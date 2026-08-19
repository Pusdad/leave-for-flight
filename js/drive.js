/**
 * Drive-time helpers. Google stays server-side (key never in the client).
 * OSRM public router is used from the browser or server and labeled "no live traffic".
 */

const UA = "LeaveBy/1.0 (personal PWA; +https://github.com/Pusdad/leave-for-flight)";

export function osrmUrl(fromLon, fromLat, toLon, toLat) {
  return `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
}

export function minutesFromSeconds(seconds) {
  return Math.max(1, Math.round(Number(seconds) / 60));
}

export async function routeOsrm({ fromLat, fromLng, toLat, toLng }) {
  const url = osrmUrl(fromLng, fromLat, toLng, toLat);
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  const data = await res.json();
  const seconds = data?.routes?.[0]?.duration;
  if (!Number.isFinite(seconds)) {
    return { ok: false, error: "no route" };
  }
  return {
    ok: true,
    minutes: minutesFromSeconds(seconds),
    provider: "osrm",
    liveTraffic: false,
    label: "no live traffic",
  };
}

export async function routeGoogle({ fromLat, fromLng, toLat, toLng, key }) {
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", `${fromLat},${fromLng}`);
  url.searchParams.set("destinations", `${toLat},${toLng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("departure_time", "now");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", "User-Agent": UA },
  });
  const data = await res.json();
  const el = data?.rows?.[0]?.elements?.[0];
  const seconds = el?.duration_in_traffic?.value ?? el?.duration?.value;
  if (!Number.isFinite(seconds)) {
    return { ok: false, error: data?.error_message || "no route", status: data?.status };
  }
  const live = Boolean(el?.duration_in_traffic);
  return {
    ok: true,
    minutes: minutesFromSeconds(seconds),
    provider: "google",
    liveTraffic: live,
    label: live ? "live traffic" : "no live traffic",
  };
}

export async function handleDriveRequest(url, env = process.env) {
  const fromLat = Number(url.searchParams.get("fromLat"));
  const fromLng = Number(url.searchParams.get("fromLng"));
  const toLat = Number(url.searchParams.get("toLat"));
  const toLng = Number(url.searchParams.get("toLng"));
  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return { status: 400, body: { ok: false, error: "fromLat, fromLng, toLat, toLng required" } };
  }
  const key = env.GOOGLE_MAPS_API_KEY;
  if (!key) {
    return {
      status: 200,
      body: { ok: false, available: false, reason: "no_key", hint: "Use OSRM in the client." },
    };
  }
  try {
    const body = await routeGoogle({ fromLat, fromLng, toLat, toLng, key });
    return { status: 200, body };
  } catch (err) {
    return { status: 200, body: { ok: false, error: String(err) } };
  }
}
