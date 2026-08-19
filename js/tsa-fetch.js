import { getAirport } from "./airports.js";
import { parseIsoToMs } from "./time.js";
import { parseFlyindexHtml, selectTsaMinutes } from "./tsa-parse.js";

const UA = "LeaveBy/1.0 (personal PWA; +https://github.com/Pusdad/leave-for-flight)";

export function flyindexTsaUrl(iata) {
  return `https://flyindex.org/airports/${String(iata).toLowerCase()}/tsa-wait-times/`;
}

export async function fetchTsaEstimate({ iata, boardingIso, boardingMs, envTimeZone }) {
  const code = String(iata || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) {
    return { ok: false, error: "airport IATA required" };
  }
  const airport = getAirport(code);
  const tz = envTimeZone || airport?.tz || "America/Chicago";
  const boardMs = boardingMs ?? parseIsoToMs(boardingIso) ?? Date.now();

  const url = flyindexTsaUrl(code);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  let html;
  try {
    const res = await fetch(url, {
      headers: { Accept: "text/html", "User-Agent": UA },
      signal: ctrl.signal,
      redirect: "follow",
    });
    html = await res.text();
    if (!res.ok) {
      return { ok: false, error: `flyindex HTTP ${res.status}`, iata: code };
    }
  } catch (err) {
    return { ok: false, error: String(err), iata: code };
  } finally {
    clearTimeout(timer);
  }

  const parsed = parseFlyindexHtml(html);
  if (!parsed.ok) {
    return {
      ok: false,
      error: "couldn't parse TSA estimate",
      iata: code,
      disclaimer: "third-party estimate, not TSA-published",
    };
  }

  const selected = selectTsaMinutes({
    parsed,
    boardingMs: boardMs,
    airportTimeZone: tz,
  });
  if (!selected) {
    return {
      ok: false,
      error: "no wait published for that day and hour",
      iata: code,
      disclaimer: "third-party estimate, not TSA-published",
      source: "flyindex",
    };
  }

  return {
    ok: true,
    iata: code,
    minutes: selected.minutes,
    preCheckMinutes: selected.preCheckMinutes,
    slot: selected.slot,
    mode: selected.mode,
    source: "flyindex",
    sourceUrl: url,
    disclaimer: "third-party estimate, not TSA-published",
    timeZone: parsed.timeZone || tz,
  };
}

export async function handleTsaRequest(url) {
  const iata = url.searchParams.get("iata") || url.searchParams.get("airport") || "";
  const boardingIso = url.searchParams.get("boarding") || url.searchParams.get("at") || "";
  const body = await fetchTsaEstimate({ iata, boardingIso });
  return { status: body.ok ? 200 : 200, body };
}
