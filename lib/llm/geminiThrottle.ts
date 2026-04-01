import { prisma } from "@/lib/prisma";

/** Start of current UTC calendar day (for RPD counting). */
export function utcDayStart(ref: Date = new Date()): Date {
  return new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), ref.getUTCDate(), 0, 0, 0, 0));
}

/** Min ms between Gemini `generateContent` calls (in-memory, per server instance). Default 12000 for 5 RPM. */
export function getGeminiMinMsBetweenCalls(): number {
  const raw = parseInt(process.env.GEMINI_MIN_MS_BETWEEN_CALLS ?? "12000", 10);
  if (!Number.isFinite(raw) || raw < 0) return 12000;
  return raw;
}

let lastGeminiCallTime = 0;

/** Test hook: reset throttle state. */
export function resetGeminiThrottleForTests(): void {
  lastGeminiCallTime = 0;
}

/**
 * Wait until at least GEMINI_MIN_MS_BETWEEN_CALLS ms since the last Gemini HTTP call in this process.
 * Set GEMINI_MIN_MS_BETWEEN_CALLS=0 to disable spacing.
 */
export async function acquireGeminiThrottle(nowMs: number = Date.now()): Promise<{ waitedMs: number }> {
  const minMs = getGeminiMinMsBetweenCalls();
  if (minMs <= 0) {
    lastGeminiCallTime = nowMs;
    return { waitedMs: 0 };
  }
  const elapsed = nowMs - lastGeminiCallTime;
  if (lastGeminiCallTime > 0 && elapsed < minMs) {
    const wait = minMs - elapsed;
    await new Promise((r) => setTimeout(r, wait));
    lastGeminiCallTime = Date.now();
    if (process.env.NODE_ENV === "development") {
      console.info(`[geminiThrottle] waited ${wait}ms to respect RPM spacing`);
    }
    return { waitedMs: wait };
  }
  lastGeminiCallTime = Date.now();
  return { waitedMs: 0 };
}

/** Count LlmUsageLog rows since UTC midnight (each successful generateContent logs once). */
export async function countGeminiGenerateCallsTodayUtc(): Promise<number> {
  const start = utcDayStart();
  return prisma.llmUsageLog.count({
    where: { createdAt: { gte: start } },
  });
}

/**
 * GEMINI_MAX_DAILY_GENERATE_CALLS (default 20): if today's count >= max, skip new API calls.
 * Set to 0 to disable the daily cap check.
 */
export function getGeminiMaxDailyGenerateCalls(): number {
  const raw = parseInt(process.env.GEMINI_MAX_DAILY_GENERATE_CALLS ?? "20", 10);
  if (!Number.isFinite(raw)) return 20;
  return Math.max(0, raw);
}

export async function isGeminiDailyCapReached(): Promise<boolean> {
  const max = getGeminiMaxDailyGenerateCalls();
  if (max <= 0) return false;
  const n = await countGeminiGenerateCallsTodayUtc();
  if (n >= max) {
    console.warn(`[geminiThrottle] daily generate cap reached (${n}/${max} UTC day); skipping API`);
  }
  return n >= max;
}

export function isGeminiLowQuotaMode(): boolean {
  const v = process.env.GEMINI_LOW_QUOTA_MODE;
  return v === "1" || v === "true" || v === "yes";
}
