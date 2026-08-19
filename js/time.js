/** Timezone helpers using Intl (no Temporal required). */

export const DEFAULT_TZ = "America/Chicago";

function pad(n) {
  return String(n).padStart(2, "0");
}

export function zonedParts(ms, timeZone) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const map = Object.fromEntries(
    fmt.formatToParts(new Date(ms)).map((p) => [p.type, p.value]),
  );
  return {
    weekday: map.weekday,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

export function todayYmd(timeZone = DEFAULT_TZ, nowMs = Date.now()) {
  const p = zonedParts(nowMs, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/**
 * Interpret a civil date + HH:MM as a local time in `timeZone`, return UTC ms.
 */
export function zonedLocalToUtcMs(dateYmd, hm, timeZone) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const [hour, minute = 0] = hm.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) {
    throw new Error("invalid date/time");
  }

  let guess = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const got = zonedParts(guess, timeZone);
    const gotAsUtc = Date.UTC(got.year, got.month - 1, got.day, got.hour, got.minute, 0);
    const wantAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const delta = wantAsUtc - gotAsUtc;
    if (delta === 0) break;
    guess += delta;
  }
  return guess;
}

export function formatTime(ms, timeZone, hour12 = true) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(new Date(ms));
}

export function formatDateTime(ms, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(ms));
}

export function hourLabel12(hour24) {
  const h = ((hour24 % 24) + 24) % 24;
  if (h === 0) return "12 AM";
  if (h === 12) return "12 PM";
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

export function parseIsoToMs(iso) {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

/** Split an ISO-like string into { ymd, hm } in a given zone. */
export function ymdHmInZone(ms, timeZone) {
  const p = zonedParts(ms, timeZone);
  return {
    ymd: `${p.year}-${pad(p.month)}-${pad(p.day)}`,
    hm: `${pad(p.hour)}:${pad(p.minute)}`,
    weekday: p.weekday,
    hour: p.hour,
  };
}
