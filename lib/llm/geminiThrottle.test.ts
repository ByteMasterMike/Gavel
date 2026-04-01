import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  acquireGeminiThrottle,
  getGeminiMaxDailyGenerateCalls,
  getGeminiMinMsBetweenCalls,
  resetGeminiThrottleForTests,
  utcDayStart,
} from "./geminiThrottle";

describe("geminiThrottle", () => {
  beforeEach(() => {
    resetGeminiThrottleForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetGeminiThrottleForTests();
  });

  it("utcDayStart is midnight UTC for the given instant", () => {
    const d = new Date("2026-03-15T14:22:33.456Z");
    const start = utcDayStart(d);
    expect(start.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("getGeminiMinMsBetweenCalls defaults to 12000 when unset", () => {
    expect(getGeminiMinMsBetweenCalls()).toBe(12000);
  });

  it("getGeminiMinMsBetweenCalls reads GEMINI_MIN_MS_BETWEEN_CALLS", () => {
    vi.stubEnv("GEMINI_MIN_MS_BETWEEN_CALLS", "50");
    expect(getGeminiMinMsBetweenCalls()).toBe(50);
  });

  it("getGeminiMaxDailyGenerateCalls reads env and allows 0 to disable cap", () => {
    vi.stubEnv("GEMINI_MAX_DAILY_GENERATE_CALLS", "0");
    expect(getGeminiMaxDailyGenerateCalls()).toBe(0);
    vi.stubEnv("GEMINI_MAX_DAILY_GENERATE_CALLS", "15");
    expect(getGeminiMaxDailyGenerateCalls()).toBe(15);
  });

  it("second acquire waits at least the configured min interval", async () => {
    vi.stubEnv("GEMINI_MIN_MS_BETWEEN_CALLS", "50");
    await acquireGeminiThrottle();
    const t0 = Date.now();
    const { waitedMs } = await acquireGeminiThrottle();
    const elapsed = Date.now() - t0;
    expect(waitedMs).toBeGreaterThan(0);
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  it("GEMINI_MIN_MS_BETWEEN_CALLS=0 does not wait between calls", async () => {
    vi.stubEnv("GEMINI_MIN_MS_BETWEEN_CALLS", "0");
    await acquireGeminiThrottle();
    const t0 = Date.now();
    const { waitedMs } = await acquireGeminiThrottle();
    expect(waitedMs).toBe(0);
    expect(Date.now() - t0).toBeLessThan(25);
  });
});
