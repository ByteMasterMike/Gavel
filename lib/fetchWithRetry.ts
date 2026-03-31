/** Delays between attempts (after first failure). Up to 1 + delays.length attempts. */
const RETRY_DELAYS_MS = [500, 1000, 2000];

/** Max time per fetch attempt before abort (avoids hanging forever on stuck server/DB). */
const FETCH_TIMEOUT_MS = 25_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET JSON with retries on network failure, 5xx, 429, or timeout (cold starts / mobile).
 */
export async function fetchOkJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false }> {
  const maxAttempts = 1 + RETRY_DELAYS_MS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (res.ok) {
        return { ok: true, data: (await res.json()) as T };
      }
      const retryable = res.status >= 500 || res.status === 429;
      if (retryable && attempt < maxAttempts - 1) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
        continue;
      }
      return { ok: false };
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
        continue;
      }
      return { ok: false };
    } finally {
      clearTimeout(tid);
    }
  }

  return { ok: false };
}
