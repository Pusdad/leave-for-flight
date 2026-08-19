import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeLeaveBy,
  estimatePreCheckMinutes,
  formatCountdown,
  resolveTsaMinutes,
} from "../js/calc.js";
import { formatTime, zonedLocalToUtcMs } from "../js/time.js";

describe("leave-by formula", () => {
  it("DFW 10:00am, 30 board, 12 TSA, 35 drive, 15 park → 8:28am", () => {
    const departureMs = zonedLocalToUtcMs("2026-08-19", "10:00", "America/Chicago");
    const result = computeLeaveBy({
      departureMs,
      boardingLeadMin: 30,
      tsaWaitMin: 12,
      driveMin: 35,
      parkingBufferMin: 15,
    });
    assert.equal(result.boardingSource, "lead");
    assert.equal(formatTime(result.boardingMs, "America/Chicago"), "9:30 AM");
    assert.equal(formatTime(result.leaveByMs, "America/Chicago"), "8:28 AM");
  });

  it("uses posted boarding when present", () => {
    const departureMs = zonedLocalToUtcMs("2026-08-19", "10:00", "America/Chicago");
    const postedBoardingMs = zonedLocalToUtcMs("2026-08-19", "09:10", "America/Chicago");
    const result = computeLeaveBy({
      departureMs,
      postedBoardingMs,
      boardingLeadMin: 30,
      tsaWaitMin: 12,
      driveMin: 35,
      parkingBufferMin: 15,
    });
    assert.equal(result.boardingSource, "posted");
    assert.equal(formatTime(result.leaveByMs, "America/Chicago"), "8:08 AM");
  });

  it("uses estimated departure (delay) when caller passes that ms", () => {
    const estimated = zonedLocalToUtcMs("2026-08-19", "10:25", "America/Chicago");
    const result = computeLeaveBy({
      departureMs: estimated,
      boardingLeadMin: 30,
      tsaWaitMin: 12,
      driveMin: 35,
      parkingBufferMin: 15,
    });
    assert.equal(formatTime(result.leaveByMs, "America/Chicago"), "8:53 AM");
  });
});

describe("PreCheck", () => {
  it("estimates max(5, round(standard * 0.4))", () => {
    assert.equal(estimatePreCheckMinutes(12), 5);
    assert.equal(estimatePreCheckMinutes(20), 8);
    assert.equal(estimatePreCheckMinutes(8), 5);
  });

  it("uses official PreCheck when the source returned one", () => {
    const r = resolveTsaMinutes({
      standardWaitMin: 20,
      preCheckWaitMin: 6,
      preCheck: true,
    });
    assert.equal(r.minutes, 6);
    assert.equal(r.estimated, false);
    assert.equal(r.source, "precheck");
  });

  it("falls back to the estimate and labels it", () => {
    const r = resolveTsaMinutes({
      standardWaitMin: 20,
      preCheckWaitMin: null,
      preCheck: true,
    });
    assert.equal(r.minutes, 8);
    assert.equal(r.estimated, true);
    assert.equal(r.source, "precheck-estimate");
  });
});

describe("countdown", () => {
  it("says Leave now when the time has passed", () => {
    const cd = formatCountdown(1_000, 0);
    assert.equal(cd.overdue, true);
    assert.equal(cd.label, "Leave now");
  });
});
