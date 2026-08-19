/**
 * Flight lookup. Never invents a flight, gate, or time.
 * Providers (in order, only if a key is present):
 *   1. Aviationstack — AVIATIONSTACK_API_KEY
 *   2. AeroDataBox via RapidAPI — AERODATABOX_KEY
 * There is no reliable no-key JSON source for scheduled departure / boarding
 * as of 2026-08-19 (OpenSky is ADS-B only; official MyTSA is unrelated).
 */

import { getAirport, parseFlightNumber } from "./airports.js";
import { parseIsoToMs } from "./time.js";

const UA = "LeaveBy/1.0 (personal PWA; +https://github.com/Pusdad/leave-for-flight)";

function jsonHeaders() {
  return { Accept: "application/json", "User-Agent": UA };
}

function pickIso(...candidates) {
  for (const value of candidates) {
    if (!value) continue;
    const iso = typeof value === "string" ? value : value.local || value.utc || value;
    if (typeof iso === "string" && Number.isFinite(Date.parse(iso))) return iso;
  }
  return null;
}

function inferInternational(destIata, destCountry) {
  if (destCountry) {
    const c = destCountry.toUpperCase();
    if (c === "US" || c === "USA" || c === "UNITED STATES") return false;
    return true;
  }
  if (destIata && getAirport(destIata)) return false;
  return null;
}

function normalizeResult(partial, provider) {
  const scheduled = pickIso(partial.scheduledDeparture);
  const estimated = pickIso(partial.estimatedDeparture);
  const scheduledMs = parseIsoToMs(scheduled);
  const estimatedMs = parseIsoToMs(estimated);
  const delayed =
    estimatedMs != null && scheduledMs != null && estimatedMs - scheduledMs >= 60_000;
  const useIso = delayed ? estimated : scheduled || estimated;
  const postedBoarding = pickIso(partial.postedBoarding);
  if (!useIso || !partial.originIata) {
    return {
      ok: false,
      error: "couldn't look that flight up",
      reason: "incomplete",
      provider,
    };
  }
  return {
    ok: true,
    provider,
    flightIata: partial.flightIata,
    airlineName: partial.airlineName || null,
    airlineIata: partial.airlineIata || null,
    originIata: String(partial.originIata).toUpperCase(),
    originName: partial.originName || null,
    originTerminal: partial.originTerminal || null,
    originGate: partial.originGate || null,
    destIata: partial.destIata ? String(partial.destIata).toUpperCase() : null,
    destName: partial.destName || null,
    scheduledDeparture: scheduled,
    estimatedDeparture: estimated,
    departureIso: useIso,
    delayed,
    postedBoardingIso: postedBoarding,
    status: partial.status || null,
    international: inferInternational(partial.destIata, partial.destCountry),
  };
}

async function fetchJson(url, headers, timeoutMs = 12_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal });
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data, text };
  } finally {
    clearTimeout(t);
  }
}

function aviationstackUrl(key, flightIata, date, proto) {
  const u = new URL(`${proto}://api.aviationstack.com/v1/flights`);
  u.searchParams.set("access_key", key);
  u.searchParams.set("flight_iata", flightIata);
  if (date) u.searchParams.set("flight_date", date);
  return u;
}

async function lookupAviationstack(key, parsed, date) {
  const attempts = [
    aviationstackUrl(key, parsed.iata, date, "https"),
    aviationstackUrl(key, parsed.iata, date, "http"),
  ];
  let last = null;
  for (const url of attempts) {
    try {
      last = await fetchJson(url, jsonHeaders());
      if (last.data?.error && /https/i.test(JSON.stringify(last.data.error))) continue;
      if (last.data?.data) break;
    } catch (err) {
      last = { ok: false, error: String(err) };
    }
  }
  const rows = last?.data?.data;
  if (!Array.isArray(rows) || !rows.length) {
    return {
      ok: false,
      error: "couldn't look that flight up",
      reason: last?.data?.error ? "provider_error" : "not_found",
      provider: "aviationstack",
    };
  }

  const row =
    rows.find((r) => r.flight_date === date) ||
    rows.find((r) => r.flight?.iata === parsed.iata) ||
    rows[0];

  const dep = row.departure || {};
  return normalizeResult(
    {
      flightIata: row.flight?.iata || parsed.iata,
      airlineName: row.airline?.name,
      airlineIata: row.airline?.iata,
      originIata: dep.iata,
      originName: dep.airport,
      originTerminal: dep.terminal,
      originGate: dep.gate,
      destIata: row.arrival?.iata,
      destName: row.arrival?.airport,
      destCountry: row.arrival?.timezone ? null : null,
      scheduledDeparture: dep.scheduled,
      estimatedDeparture: dep.estimated || dep.actual,
      postedBoarding: dep.boarding || row.boarding,
      status: row.flight_status,
    },
    "aviationstack",
  );
}

async function lookupAeroDataBox(key, parsed, date) {
  const url = new URL(
    `https://aerodatabox.p.rapidapi.com/flights/number/${encodeURIComponent(parsed.iata)}/${date}`,
  );
  url.searchParams.set("dateLocalRole", "Departure");
  const last = await fetchJson(url, {
    ...jsonHeaders(),
    "X-RapidAPI-Key": key,
    "X-RapidAPI-Host": "aerodatabox.p.rapidapi.com",
  });
  const rows = Array.isArray(last.data) ? last.data : last.data?.flights || [];
  if (!rows.length) {
    return {
      ok: false,
      error: "couldn't look that flight up",
      reason: last.status === 404 ? "not_found" : "provider_error",
      provider: "aerodatabox",
    };
  }
  const row = rows.find((r) => !r.isCargo) || rows[0];
  const dep = row.departure || {};
  const arr = row.arrival || {};
  return normalizeResult(
    {
      flightIata: (row.number || parsed.iata).replace(/\s+/g, ""),
      airlineName: row.airline?.name,
      airlineIata: row.airline?.iata,
      originIata: dep.airport?.iata,
      originName: dep.airport?.name,
      originTerminal: dep.terminal,
      originGate: dep.gate,
      destIata: arr.airport?.iata,
      destName: arr.airport?.name,
      destCountry: arr.airport?.countryCode,
      scheduledDeparture: dep.scheduledTime,
      estimatedDeparture: dep.revisedTime || dep.predictedTime || dep.runwayTime,
      postedBoarding: dep.boardingTime || dep.quality?.boarding,
      status: row.status,
    },
    "aerodatabox",
  );
}

export async function lookupFlight({ flight, date, env = process.env }) {
  const parsed = parseFlightNumber(flight);
  if (!parsed) {
    return { ok: false, error: "couldn't look that flight up", reason: "bad_flight_number" };
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "couldn't look that flight up", reason: "bad_date" };
  }

  const aviationKey = env.AVIATIONSTACK_API_KEY;
  const aeroKey = env.AERODATABOX_KEY || env.RAPIDAPI_KEY;

  if (!aviationKey && !aeroKey) {
    return {
      ok: false,
      error: "couldn't look that flight up",
      reason: "no_key",
      hint: "Set AVIATIONSTACK_API_KEY or AERODATABOX_KEY, or enter airport and departure time.",
    };
  }

  const errors = [];
  if (aviationKey) {
    try {
      const result = await lookupAviationstack(aviationKey, parsed, date);
      if (result.ok) return result;
      errors.push(result);
    } catch (err) {
      errors.push({ reason: "provider_error", detail: String(err) });
    }
  }
  if (aeroKey) {
    try {
      const result = await lookupAeroDataBox(aeroKey, parsed, date);
      if (result.ok) return result;
      errors.push(result);
    } catch (err) {
      errors.push({ reason: "provider_error", detail: String(err) });
    }
  }

  return {
    ok: false,
    error: "couldn't look that flight up",
    reason: errors[0]?.reason || "not_found",
    providerErrors: errors,
  };
}

export async function handleFlightRequest(url, env = process.env) {
  const flight = url.searchParams.get("flight") || url.searchParams.get("q") || "";
  const date = url.searchParams.get("date") || "";
  const body = await lookupFlight({ flight, date, env });
  return {
    status: body.ok ? 200 : body.reason === "bad_flight_number" || body.reason === "bad_date" ? 400 : 200,
    body,
  };
}
