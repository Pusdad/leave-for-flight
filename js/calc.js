/** Leave-by math. No I/O, no invented flight/TSA/drive numbers. */

export const DEFAULT_PARKING_MIN = 15;
export const DEFAULT_BOARDING_DOMESTIC_MIN = 30;
export const DEFAULT_BOARDING_INTERNATIONAL_MIN = 45;

export function estimatePreCheckMinutes(standardWaitMin) {
  const n = Number(standardWaitMin);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.max(5, Math.round(n * 0.4));
}

export function resolveTsaMinutes({
  standardWaitMin,
  preCheckWaitMin = null,
  preCheck = false,
}) {
  if (!preCheck) {
    return {
      minutes: Number(standardWaitMin),
      source: "standard",
      estimated: false,
    };
  }
  if (preCheckWaitMin != null && Number.isFinite(Number(preCheckWaitMin))) {
    return {
      minutes: Number(preCheckWaitMin),
      source: "precheck",
      estimated: false,
    };
  }
  const estimated = estimatePreCheckMinutes(standardWaitMin);
  return {
    minutes: estimated,
    source: "precheck-estimate",
    estimated: true,
  };
}

export function resolveBoardingMs({
  departureMs,
  postedBoardingMs = null,
  boardingLeadMin,
}) {
  if (postedBoardingMs != null && Number.isFinite(postedBoardingMs)) {
    return { boardingMs: postedBoardingMs, boardingSource: "posted" };
  }
  return {
    boardingMs: departureMs - Number(boardingLeadMin) * 60_000,
    boardingSource: "lead",
  };
}

/**
 * leave_by = boarding_time − tsa_wait − drive_time − parking_buffer
 * boarding_time = posted boarding, else departure − boarding_lead
 */
export function computeLeaveBy({
  departureMs,
  postedBoardingMs = null,
  boardingLeadMin,
  tsaWaitMin,
  driveMin,
  parkingBufferMin,
}) {
  if (!Number.isFinite(departureMs)) {
    throw new Error("departureMs is required");
  }
  const lead = Number(boardingLeadMin);
  const tsa = Number(tsaWaitMin);
  const drive = Number(driveMin);
  const park = Number(parkingBufferMin);
  for (const [name, value] of [
    ["boardingLeadMin", lead],
    ["tsaWaitMin", tsa],
    ["driveMin", drive],
    ["parkingBufferMin", park],
  ]) {
    if (!Number.isFinite(value)) {
      throw new Error(`${name} is required`);
    }
  }

  const { boardingMs, boardingSource } = resolveBoardingMs({
    departureMs,
    postedBoardingMs,
    boardingLeadMin: lead,
  });
  const leaveByMs = boardingMs - (tsa + drive + park) * 60_000;

  return {
    departureMs,
    boardingMs,
    leaveByMs,
    boardingSource,
    tsaWaitMin: tsa,
    driveMin: drive,
    parkingBufferMin: park,
    boardingLeadMin: lead,
  };
}

export function formatCountdown(fromMs, toMs) {
  const delta = toMs - fromMs;
  if (delta <= 0) return { overdue: true, label: "Leave now", ms: delta };
  const totalMin = Math.floor(delta / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return { overdue: false, label: `in ${parts.join(" ")}`, ms: delta };
}
