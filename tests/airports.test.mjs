import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getAirport, parseFlightNumber } from "../js/airports.js";

describe("airports", () => {
  it("includes DFW and DAL with Chicago tz", () => {
    assert.equal(getAirport("dfw").tz, "America/Chicago");
    assert.equal(getAirport("DAL").name.includes("Love"), true);
    assert.ok(getAirport("DFW").lat);
    assert.ok(getAirport("DFW").lon);
  });
});

describe("flight numbers", () => {
  it("parses AA1234 and WN42", () => {
    assert.deepEqual(parseFlightNumber("aa 1234"), {
      airline: "AA",
      number: "1234",
      iata: "AA1234",
    });
    assert.equal(parseFlightNumber("WN42").iata, "WN42");
    assert.equal(parseFlightNumber("not-a-flight"), null);
  });
});
