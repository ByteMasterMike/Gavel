import { describe, expect, it } from "vitest";
import {
  computeAutoDailyCaseIdForDate,
  formatUtcDateYmd,
  seededShuffle,
  utcCalendarDateOnly,
  utcDayIndexSinceEpoch,
} from "./dailyRotation";

describe("utcDayIndexSinceEpoch", () => {
  it("counts whole UTC days from epoch", () => {
    expect(utcDayIndexSinceEpoch("2026-01-01", "2026-01-01")).toBe(0);
    expect(utcDayIndexSinceEpoch("2026-01-02", "2026-01-01")).toBe(1);
    expect(utcDayIndexSinceEpoch("2026-01-10", "2026-01-01")).toBe(9);
  });
});

describe("computeAutoDailyCaseIdForDate", () => {
  const secret = "test-secret";
  const epoch = "2026-01-01";
  const ids = ["a", "b", "c", "d", "e"];

  it("returns null for empty catalog", () => {
    const d = utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 1)));
    expect(computeAutoDailyCaseIdForDate(d, [], secret, epoch)).toBeNull();
  });

  it("is deterministic for the same inputs", () => {
    const d = utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 5)));
    const x = computeAutoDailyCaseIdForDate(d, ids, secret, epoch);
    const y = computeAutoDailyCaseIdForDate(d, ids, secret, epoch);
    expect(x).toBe(y);
    expect(x).not.toBeNull();
    expect(ids).toContain(x);
  });

  it("uses each case exactly once per block of N days", () => {
    const seen = new Set<string>();
    for (let day = 0; day < 5; day++) {
      const d = utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 1 + day)));
      const id = computeAutoDailyCaseIdForDate(d, ids, secret, epoch);
      expect(id).not.toBeNull();
      seen.add(id!);
    }
    expect(seen.size).toBe(5);
    expect([...seen].sort()).toEqual([...ids].sort());
  });

  it("changes order in the next block (different permutation)", () => {
    const block0 = computeAutoDailyCaseIdForDate(
      utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 1))),
      ids,
      secret,
      epoch,
    );
    const block1First = computeAutoDailyCaseIdForDate(
      utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 6))),
      ids,
      secret,
      epoch,
    );
    expect(block0).not.toBeNull();
    expect(block1First).not.toBeNull();
    // Same length-5 block would repeat pattern if block seed were identical; different block index → different shuffle.
    const perm0 = [];
    for (let day = 0; day < 5; day++) {
      const d = utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 1 + day)));
      perm0.push(computeAutoDailyCaseIdForDate(d, ids, secret, epoch));
    }
    const perm1 = [];
    for (let day = 0; day < 5; day++) {
      const d = utcCalendarDateOnly(new Date(Date.UTC(2026, 0, 6 + day)));
      perm1.push(computeAutoDailyCaseIdForDate(d, ids, secret, epoch));
    }
    expect(perm0).not.toEqual(perm1);
  });
});

describe("seededShuffle", () => {
  it("is stable for the same seed key", () => {
    const a = seededShuffle(["x", "y", "z"], "k1");
    const b = seededShuffle(["x", "y", "z"], "k1");
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(3);
  });
});

describe("formatUtcDateYmd", () => {
  it("formats UTC calendar date", () => {
    expect(formatUtcDateYmd(new Date(Date.UTC(2026, 2, 31, 18, 0, 0)))).toBe("2026-03-31");
  });
});
