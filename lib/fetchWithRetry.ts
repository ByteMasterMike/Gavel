/** Delays between attempts (after first failure). Up to 1 + delays.length attempts. */
const RETRY_DELAYS_MS = [500, 1000, 2000];

/** Max time per attempt for fetch + reading/parsing JSON body (body read can hang after headers). */
const FETCH_TIMEOUT_MS = 25_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RaceResult<T> = { tag: "timeout" } | { tag: "http"; status: number } | { tag: "ok"; data: T };

/**
 * GET JSON with retries on network failure, 5xx, 429, or timeout (cold starts / mobile).
 * Each attempt is bounded for the whole operation including `res.json()`.
 */
export async function fetchOkJson<T>(url: string): Promise<{ ok: true; data: T } | { ok: false }> {
  const maxAttempts = 1 + RETRY_DELAYS_MS.length;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      const deadline = new Promise<RaceResult<T>>((resolve) => {
        timeoutId = setTimeout(() => {
          controller.abort();
          resolve({ tag: "timeout" });
        }, FETCH_TIMEOUT_MS);
      });

      const work = (async (): Promise<RaceResult<T>> => {
        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) {
          return { tag: "http", status: res.status };
        }
        return { tag: "ok", data: (await res.json()) as T };
      })();

      const result = await Promise.race([work, deadline]);

      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      if (result.tag === "timeout") {
        if (attempt < maxAttempts - 1) {
          await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
          continue;
        }
        return { ok: false };
      }

      if (result.tag === "http") {
        const retryable = result.status >= 500 || result.status === 429;
        if (retryable && attempt < maxAttempts - 1) {
          await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
          continue;
        }
        return { ok: false };
      }

      return { ok: true, data: result.data };
    } catch {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
      if (attempt < maxAttempts - 1) {
        await sleep(RETRY_DELAYS_MS[attempt] ?? 2000);
        continue;
      }
      return { ok: false };
    }
  }

  return { ok: false };
}
