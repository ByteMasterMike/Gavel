const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const buckets = new Map<string, number[]>();

export function checkRulingSubmissionRate(userId: string): { ok: true } | { ok: false; message: string } {
  const now = Date.now();
  const prev = buckets.get(userId) ?? [];
  const recent = prev.filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return {
      ok: false,
      message: "Too many ruling submissions this hour. Please wait before trying again.",
    };
  }
  recent.push(now);
  buckets.set(userId, recent);
  return { ok: true };
}
