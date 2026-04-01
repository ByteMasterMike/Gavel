import { describe, expect, it } from "vitest";
import { verdictMatches } from "./accuracyScore";

describe("verdictMatches", () => {
  it("matches appellate dispositions", () => {
    expect(verdictMatches("REVERSED", "REVERSED")).toBe(true);
    expect(verdictMatches("AFFIRMED", "AFFIRMED")).toBe(true);
    expect(verdictMatches("REVERSED", "AFFIRMED")).toBe(false);
  });

  it("accepts common aliases for REVERSED and AFFIRMED", () => {
    expect(verdictMatches("REVERSE", "REVERSED")).toBe(true);
    expect(verdictMatches("VACATED", "REVERSED")).toBe(true);
    expect(verdictMatches("AFFIRM", "AFFIRMED")).toBe(true);
  });
});
