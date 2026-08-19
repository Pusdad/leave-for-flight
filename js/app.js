import {
  DEFAULT_BOARDING_DOMESTIC_MIN,
  DEFAULT_BOARDING_INTERNATIONAL_MIN,
  DEFAULT_PARKING_MIN,
  computeLeaveBy,
  formatCountdown,
  resolveTsaMinutes,
} from "./calc.js";
import {
  AIRLINE_NAMES,
  appleMapsDirectionsUrl,
  getAirport,
  parseFlightNumber,
} from "./airports.js";
import {
  DEFAULT_TZ,
  formatDateTime,
  formatTime,
  parseIsoToMs,
  todayYmd,
  ymdHmInZone,
  zonedLocalToUtcMs,
} from "./time.js";

const LAST_KEY = "leaveby:last";
const PREFS_KEY = "leaveby:prefs";

const $ = (id) => document.getElementById(id);
const displayTz = Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ;

const state = {
  international: false,
  result: null,
  timer: null,
};

function apiPath(name, params) {
  const qs = new URLSearchParams(params);
  return `api/${name}?${qs}`;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (res.status === 404) return { ok: false, reason: "no_api" };
  try {
    return await res.json();
  } catch {
    return { ok: false, reason: "bad_json" };
  }
}

function showBanners(messages) {
  const root = $("banners");
  root.innerHTML = "";
  for (const msg of messages) {
    const el = document.createElement("div");
    el.className = `banner${msg.error ? " error" : ""}`;
    el.textContent = msg.text;
    root.appendChild(el);
  }
}

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePrefs() {
  const prefs = {
    precheck: $("precheck").checked,
    parkMin: $("parkMin").value,
    leadMin: $("leadMin").value,
    international: state.international,
    origin: $("origin").value,
    driveMin: $("driveMin").value,
    tsaMin: $("tsaMin").value,
  };
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function applyPrefs(prefs) {
  if (prefs.precheck) $("precheck").checked = true;
  if (prefs.parkMin) $("parkMin").value = prefs.parkMin;
  if (prefs.leadMin) $("leadMin").value = prefs.leadMin;
  if (prefs.origin) $("origin").value = prefs.origin;
  if (prefs.driveMin) $("driveMin").value = prefs.driveMin;
  if (prefs.tsaMin) $("tsaMin").value = prefs.tsaMin;
  setInternational(Boolean(prefs.international), { skipLead: Boolean(prefs.leadMin) });
}

function setInternational(on, { skipLead = false } = {}) {
  state.international = on;
  $("domBtn").setAttribute("aria-pressed", String(!on));
  $("intlBtn").setAttribute("aria-pressed", String(on));
  if (!skipLead) {
    $("leadMin").value = on
      ? DEFAULT_BOARDING_INTERNATIONAL_MIN
      : DEFAULT_BOARDING_DOMESTIC_MIN;
  }
}

function fillExample() {
  $("flight").value = "";
  $("date").value = todayYmd(DEFAULT_TZ);
  $("origin").value = "DFW";
  $("depart").value = "10:00";
  $("driveMin").value = "35";
  $("tsaMin").value = "12";
  $("parkMin").value = String(DEFAULT_PARKING_MIN);
  $("leadMin").value = String(DEFAULT_BOARDING_DOMESTIC_MIN);
  setInternational(false, { skipLead: true });
  $("overrides").open = true;
}

function getPosition() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error("Geolocation is not available"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  });
}

async function lookupDrive(from, airport) {
  const params = {
    fromLat: from.lat,
    fromLng: from.lng,
    toLat: airport.lat,
    toLng: airport.lon,
  };
  try {
    const google = await getJson(apiPath("drive", params));
    if (google?.ok) return google;
  } catch {
    /* Pages / no function */
  }
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${airport.lon},${airport.lat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();
    const seconds = data?.routes?.[0]?.duration;
    if (Number.isFinite(seconds)) {
      return {
        ok: true,
        minutes: Math.max(1, Math.round(seconds / 60)),
        liveTraffic: false,
        label: "no live traffic",
        provider: "osrm",
      };
    }
  } catch {
    /* CORS or network */
  }
  return { ok: false, error: "couldn't get a drive time" };
}

function render(result) {
  state.result = result;
  localStorage.setItem(LAST_KEY, JSON.stringify({ ...result, savedAt: Date.now() }));

  $("heroEmpty").hidden = true;
  $("leaveTime").textContent = formatTime(result.leaveByMs, displayTz);
  $("summaryCard").hidden = false;
  $("breakCard").hidden = false;

  const originBits = [result.originIata, result.originName].filter(Boolean);
  if (result.originTerminal) originBits.push(`Terminal ${result.originTerminal}`);
  $("sumAirline").textContent = result.airlineLabel || result.flightIata || "—";
  $("sumOrigin").innerHTML = `${originBits.join(" · ") || "—"}${
    result.originGate ? `<small>Gate ${result.originGate}</small>` : ""
  }`;

  const depLabel = formatDateTime(result.departureMs, result.airportTz || displayTz);
  const estNote = result.delayed
    ? `<small>Using estimated departure (delayed)</small>`
    : result.scheduledLabel
      ? `<small>Scheduled ${result.scheduledLabel}</small>`
      : "";
  $("sumDepart").innerHTML = `${depLabel}${estNote}`;
  $("sumBoard").innerHTML = `${formatTime(result.boardingMs, result.airportTz || displayTz)}${
    result.boardingSource === "posted"
      ? "<small>Posted by airline</small>"
      : `<small>Departure − ${result.boardingLeadMin} min lead</small>`
  }`;

  $("bdDepart").textContent = formatTime(result.departureMs, result.airportTz || displayTz);
  $("bdBoard").textContent = formatTime(result.boardingMs, result.airportTz || displayTz);
  $("bdTsa").innerHTML = `${result.tsaWaitMin} min<small>${result.tsaLabel}</small>`;
  $("bdDrive").innerHTML = `${result.driveMin} min<small>${result.driveLabel}</small>`;
  $("bdPark").textContent = `${result.parkingBufferMin} min`;
  $("bdNote").textContent = result.notes.join(" ");

  if (result.mapsUrl) {
    $("mapsLink").hidden = false;
    $("mapsLink").href = result.mapsUrl;
  } else {
    $("mapsLink").hidden = true;
  }

  tick();
  if (state.timer) clearInterval(state.timer);
  state.timer = setInterval(tick, 1000);
}

function tick() {
  if (!state.result) return;
  const cd = formatCountdown(Date.now(), state.result.leaveByMs);
  $("countdown").textContent = cd.label;
  $("countdown").classList.toggle("overdue", cd.overdue);
  $("leaveTime").classList.toggle("overdue", cd.overdue);
}

async function onSubmit(event) {
  event.preventDefault();
  savePrefs();
  const banners = [];
  const flightRaw = $("flight").value.trim();
  const date = $("date").value;
  const originOverride = $("origin").value.trim().toUpperCase();
  const departOverride = $("depart").value;
  const driveOverride = $("driveMin").value === "" ? null : Number($("driveMin").value);
  const tsaOverride = $("tsaMin").value === "" ? null : Number($("tsaMin").value);
  const parkingBufferMin = Number($("parkMin").value || DEFAULT_PARKING_MIN);
  let boardingLeadMin = Number($("leadMin").value);
  if (!Number.isFinite(boardingLeadMin)) {
    boardingLeadMin = state.international
      ? DEFAULT_BOARDING_INTERNATIONAL_MIN
      : DEFAULT_BOARDING_DOMESTIC_MIN;
  }

  $("go").disabled = true;
  document.body.classList.add("busy");

  let flight = null;
  if (flightRaw) {
    const parsed = parseFlightNumber(flightRaw);
    if (!parsed) {
      banners.push({ error: true, text: "That doesn't look like a flight number (try AA1234)." });
    } else {
      try {
        flight = await getJson(apiPath("flight", { flight: parsed.iata, date }));
      } catch {
        flight = { ok: false, reason: "no_api" };
      }
      if (!flight?.ok) {
        banners.push({
          text: "Couldn't look that flight up. Enter airport and departure time below.",
        });
        $("overrides").open = true;
      }
    }
  }

  const originIata = originOverride || flight?.originIata || "";
  const airport = getAirport(originIata);
  const airportTz = airport?.tz || DEFAULT_TZ;

  let departureMs = null;
  let delayed = false;
  let scheduledLabel = null;
  let postedBoardingMs = null;
  let originName = airport?.name || flight?.originName || "";
  let originTerminal = flight?.originTerminal || null;
  let originGate = flight?.originGate || null;
  let airlineLabel = null;
  let flightIata = parseFlightNumber(flightRaw)?.iata || flightRaw || "";

  if (flight?.ok) {
    departureMs = parseIsoToMs(flight.departureIso);
    delayed = Boolean(flight.delayed);
    scheduledLabel = flight.scheduledDeparture
      ? formatTime(parseIsoToMs(flight.scheduledDeparture), airportTz)
      : null;
    postedBoardingMs = parseIsoToMs(flight.postedBoardingIso);
    airlineLabel = [flight.airlineName || AIRLINE_NAMES[flight.airlineIata], flight.flightIata]
      .filter(Boolean)
      .join(" · ");
    flightIata = flight.flightIata || flightIata;
    if (flight.international === true) setInternational(true, { skipLead: $("leadMin").value !== "" });
  }

  if (departOverride) {
    try {
      departureMs = zonedLocalToUtcMs(date, departOverride, airportTz);
      delayed = false;
    } catch {
      banners.push({ error: true, text: "Couldn't read that departure time." });
    }
  }

  if (departureMs == null) {
    showBanners(
      banners.length
        ? banners
        : [{ error: true, text: "Need a looked-up flight or a manual departure time." }],
    );
    $("go").disabled = false;
    document.body.classList.remove("busy");
    return;
  }

  if (!originIata) {
    banners.push({ error: true, text: "Need an origin airport (IATA, e.g. DFW)." });
    showBanners(banners);
    $("overrides").open = true;
    $("go").disabled = false;
    document.body.classList.remove("busy");
    return;
  }

  const boardingGuess = computeLeaveBy({
    departureMs,
    postedBoardingMs,
    boardingLeadMin,
    tsaWaitMin: 0,
    driveMin: 0,
    parkingBufferMin: 0,
  });

  let tsa = { minutes: tsaOverride, label: "manual override", estimated: false };
  if (tsaOverride == null) {
    try {
      const boardingIso = new Date(boardingGuess.boardingMs).toISOString();
      const remote = await getJson(apiPath("tsa", { iata: originIata, boarding: boardingIso }));
      if (remote?.ok) {
        const resolved = resolveTsaMinutes({
          standardWaitMin: remote.minutes,
          preCheckWaitMin: remote.preCheckMinutes,
          preCheck: $("precheck").checked,
        });
        tsa = {
          minutes: resolved.minutes,
          estimated: resolved.estimated,
          label:
            resolved.source === "precheck"
              ? `${remote.disclaimer}; PreCheck from source (${remote.slot})`
              : resolved.source === "precheck-estimate"
                ? `${remote.disclaimer}; PreCheck is an estimate, not official TSA (${remote.slot})`
                : `${remote.disclaimer} · ${remote.slot} · ${remote.mode}`,
        };
      } else {
        banners.push({
          text: "No TSA estimate available. Enter TSA minutes to continue.",
        });
        showBanners(banners);
        $("overrides").open = true;
        $("go").disabled = false;
        document.body.classList.remove("busy");
        return;
      }
    } catch {
      banners.push({
        text: "No TSA proxy on this host. Enter TSA minutes (Pages = manual path).",
      });
      showBanners(banners);
      $("overrides").open = true;
      $("go").disabled = false;
      document.body.classList.remove("busy");
      return;
    }
  } else if ($("precheck").checked && tsaOverride != null) {
    tsa = { minutes: tsaOverride, label: "manual TSA override (PreCheck on)", estimated: false };
  }

  let drive = { minutes: driveOverride, label: "manual override" };
  let mapsUrl = airport ? appleMapsDirectionsUrl(airport.lat, airport.lon) : null;
  if (driveOverride == null) {
    if (!airport) {
      banners.push({ text: "Unknown airport coordinates. Enter drive minutes." });
      showBanners(banners);
      $("overrides").open = true;
      $("go").disabled = false;
      document.body.classList.remove("busy");
      return;
    }
    try {
      const here = await getPosition();
      const routed = await lookupDrive(here, airport);
      if (!routed.ok) {
        banners.push({ text: "Couldn't get a drive time. Enter drive minutes." });
        showBanners(banners);
        $("overrides").open = true;
        $("go").disabled = false;
        document.body.classList.remove("busy");
        return;
      }
      drive = { minutes: routed.minutes, label: routed.label || "drive" };
    } catch {
      banners.push({ text: "Location needed for drive time, or enter drive minutes." });
      showBanners(banners);
      $("overrides").open = true;
      $("go").disabled = false;
      document.body.classList.remove("busy");
      return;
    }
  }

  const calc = computeLeaveBy({
    departureMs,
    postedBoardingMs,
    boardingLeadMin,
    tsaWaitMin: tsa.minutes,
    driveMin: drive.minutes,
    parkingBufferMin,
  });

  const notes = [];
  if (tsa.estimated) notes.push("PreCheck wait is an estimate, not official TSA.");
  notes.push("TSA source is a third-party estimate, not TSA-published.");

  showBanners(banners);
  render({
    ...calc,
    flightIata,
    airlineLabel,
    originIata,
    originName,
    originTerminal,
    originGate,
    airportTz,
    delayed,
    scheduledLabel,
    tsaLabel: tsa.label,
    driveLabel: drive.label,
    mapsUrl,
    notes,
  });

  $("go").disabled = false;
  document.body.classList.remove("busy");
}

function restoreLast() {
  try {
    const last = JSON.parse(localStorage.getItem(LAST_KEY) || "null");
    if (last?.leaveByMs) {
      showBanners([{ text: "Showing last saved leave-by. Recalculate for a fresh time." }]);
      render(last);
    }
  } catch {
    /* ignore */
  }
}

function init() {
  $("tzHint").textContent = displayTz;
  $("date").value = todayYmd(DEFAULT_TZ);
  $("parkMin").value = String(DEFAULT_PARKING_MIN);
  $("leadMin").value = String(DEFAULT_BOARDING_DOMESTIC_MIN);
  applyPrefs(loadPrefs());

  $("domBtn").addEventListener("click", () => setInternational(false));
  $("intlBtn").addEventListener("click", () => setInternational(true));
  $("form").addEventListener("submit", onSubmit);
  $("precheck").addEventListener("change", savePrefs);

  const params = new URLSearchParams(location.search);
  if (params.get("example") === "1") fillExample();

  restoreLast();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
