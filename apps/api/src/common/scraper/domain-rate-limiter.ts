/**
 * Per-domain rate limiter used by the scraper module.
 *
 * Tracks the last fetch time per domain and enforces a minimum gap
 * (default 5 000 ms, matching `SCRAPER_RATE_LIMIT_MS`). Implemented
 * as a simple in-process map — the cron job is single-instance, so
 * distributed coordination is not needed in V2.
 *
 * When the budget is exhausted, callers should throw or return an
 * empty result and log a `rate_limited` row via `WikiScraperLogs`.
 */
export class DomainRateLimiter {
  private readonly lastFetchAt = new Map<string, number>();
  private readonly minIntervalMs: number;

  constructor(minIntervalMs = Number(process.env.SCRAPER_RATE_LIMIT_MS ?? 5_000)) {
    this.minIntervalMs = minIntervalMs;
  }

  /**
   * Wait until at least `minIntervalMs` has elapsed since the last
   * call for `domain`. Resolves with the actual sleep duration in ms.
   */
  async wait(domain: string): Promise<number> {
    const now = Date.now();
    const last = this.lastFetchAt.get(domain) ?? 0;
    const elapsed = now - last;
    const wait = Math.max(0, this.minIntervalMs - elapsed);
    if (wait > 0) {
      await new Promise((r) => setTimeout(r, wait));
    }
    this.lastFetchAt.set(domain, Date.now());
    return wait;
  }

  /** For tests: reset state. */
  reset(): void {
    this.lastFetchAt.clear();
  }

  /** For tests + introspection: the configured minimum interval. */
  get intervalMs(): number {
    return this.minIntervalMs;
  }
}
