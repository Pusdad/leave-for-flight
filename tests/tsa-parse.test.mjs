import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseFlyindexHtml,
  selectTsaMinutes,
} from "../js/tsa-parse.js";
import { zonedLocalToUtcMs } from "../js/time.js";

const FIXTURE = `
<p id="tsa-current-wait" class="text-3xl">10 min</p>
<script>(function(){const waitLookup = {"Wednesday|9 AM":26,"Wednesday|10 AM":28,"Friday|12 AM":10};
const airportTimeZone = "America/Chicago";
})();</script>
`;

describe("flyindex parser", () => {
  it("reads current wait and waitLookup", () => {
    const parsed = parseFlyindexHtml(FIXTURE);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.currentMinutes, 10);
    assert.equal(parsed.lookup["Wednesday|9 AM"], 26);
    assert.equal(parsed.disclaimer.includes("not TSA-published"), true);
    assert.equal(parsed.preCheckMinutes, null);
  });

  it("uses the historical cell for a later boarding hour", () => {
    const parsed = parseFlyindexHtml(FIXTURE);
    const boardingMs = zonedLocalToUtcMs("2026-08-19", "09:30", "America/Chicago");
    const nowMs = zonedLocalToUtcMs("2026-08-19", "00:15", "America/Chicago");
    const selected = selectTsaMinutes({
      parsed,
      boardingMs,
      airportTimeZone: "America/Chicago",
      nowMs,
    });
    assert.equal(selected.minutes, 26);
    assert.equal(selected.mode, "historical");
    assert.equal(selected.slot, "Wednesday 9 AM");
  });
});
