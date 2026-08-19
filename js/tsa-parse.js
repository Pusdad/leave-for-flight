/**
 * Parse FlyIndex TSA wait pages.
 * Official MyTSA GetConfirmedWaitTimes.ashx redirects to tsa.gov HTML (dead).
 * FlyIndex embeds a server-rendered waitLookup map plus an "Estimated Wait Right Now" value.
 * No PreCheck-specific numbers are published there.
 */

import { hourLabel12, zonedParts } from "./time.js";

const WAIT_LOOKUP_RE = /const waitLookup = (\{[\s\S]*?\});/;
const TZ_RE = /const airportTimeZone = "([^"]+)"/;
const CURRENT_WAIT_RE = /id="tsa-current-wait"[^>]*>([^<]+)</i;
const PRECHECK_WAIT_RE = /pre-?check[^<]{0,80}?(\d+)\s*min/i;

export function parseMinutesToken(text) {
  if (text == null) return null;
  const cleaned = String(text).trim();
  if (!cleaned || cleaned === "-") return null;
  const m = cleaned.match(/(\d+)\s*m/i);
  if (!m) return null;
  return Number(m[1]);
}

export function parseFlyindexHtml(html) {
  if (!html || html.includes("<html") && html.length < 400 && /tsa\.gov/i.test(html)) {
    return { ok: false, error: "not-flyindex" };
  }

  let lookup = null;
  const lookupMatch = html.match(WAIT_LOOKUP_RE);
  if (lookupMatch) {
    try {
      lookup = JSON.parse(lookupMatch[1]);
    } catch {
      lookup = null;
    }
  }

  const tzMatch = html.match(TZ_RE);
  const timeZone = tzMatch?.[1] || null;

  let currentMinutes = null;
  const currentMatch = html.match(CURRENT_WAIT_RE);
  if (currentMatch) currentMinutes = parseMinutesToken(currentMatch[1]);

  let preCheckMinutes = null;
  const pre = html.match(PRECHECK_WAIT_RE);
  if (pre) preCheckMinutes = Number(pre[1]);

  if (!lookup && currentMinutes == null) {
    return { ok: false, error: "unparsed" };
  }

  return {
    ok: true,
    lookup,
    timeZone,
    currentMinutes,
    preCheckMinutes,
    source: "flyindex",
    disclaimer: "third-party estimate, not TSA-published",
  };
}

export function lookupHistoricalMinutes(lookup, weekdayLong, hour24) {
  if (!lookup) return null;
  const key = `${weekdayLong}|${hourLabel12(hour24)}`;
  const value = lookup[key];
  if (value == null || value === 0) return null;
  return Number(value);
}

/**
 * If boarding is in the current airport-local hour today, use the "right now"
 * estimate. Otherwise use the historical cell for that weekday + hour.
 */
export function selectTsaMinutes({
  parsed,
  boardingMs,
  airportTimeZone,
  nowMs = Date.now(),
}) {
  const tz = airportTimeZone || parsed.timeZone || "UTC";
  const board = zonedParts(boardingMs, tz);
  const now = zonedParts(nowMs, tz);
  const sameSlot =
    board.year === now.year &&
    board.month === now.month &&
    board.day === now.day &&
    board.hour === now.hour;

  const historical = lookupHistoricalMinutes(parsed.lookup, board.weekday, board.hour);

  if (sameSlot && parsed.currentMinutes != null) {
    return {
      minutes: parsed.currentMinutes,
      slot: `${board.weekday} ${hourLabel12(board.hour)}`,
      mode: "current",
      preCheckMinutes: parsed.preCheckMinutes,
    };
  }
  if (historical != null) {
    return {
      minutes: historical,
      slot: `${board.weekday} ${hourLabel12(board.hour)}`,
      mode: "historical",
      preCheckMinutes: parsed.preCheckMinutes,
    };
  }
  if (parsed.currentMinutes != null) {
    return {
      minutes: parsed.currentMinutes,
      slot: `${board.weekday} ${hourLabel12(board.hour)}`,
      mode: "current-fallback",
      preCheckMinutes: parsed.preCheckMinutes,
    };
  }
  return null;
}
