/**
 * Canonical shape returned by every news source.
 *
 * Stored verbatim in the `scraped_articles` table by
 * `ScraperService.sync()`. The wiki service then joins these rows
 * with Google News hits when generating a `WikiEntry`.
 */
export interface ScrapedArticle {
  /** Canonical URL — unique key in `scraped_articles`. */
  url: string;
  /** Article headline. Trimmed, ≤500 chars (DB constraint). */
  title: string;
  /** ISO 8601 string from the source. */
  publishedAt: string;
  /** ≤500 chars — teaser used as the LLM snippet for this source. */
  snippet: string;
  /** ≤2 KB cleaned body text, or null if the scraper skipped it. */
  fullText?: string | null;
  /** Source identifier — matches `NewsSource.name`. */
  source: string;
}

/**
 * Implemented by each portal-specific scraper.
 *
 * Contract:
 * - `fetch()` MUST respect robots.txt (via `RobotsTxtService`) before
 *   making any HTTP request.
 * - `fetch()` MUST honour the per-domain rate limit
 *   (`SCRAPER_RATE_LIMIT_MS`, default 5 s) via `DomainRateLimiter`.
 * - `fetch()` MUST log every attempt to `wiki_scraper_logs` via the
 *   shared `ScraperService` — return an empty array (do not throw)
 *   if scraping is blocked.
 */
export interface NewsSource {
  readonly name: string;
  readonly domain: string;
  fetch(
    query: string,
    options?: { sinceDays?: number; maxResults?: number },
  ): Promise<ScrapedArticle[]>;
}
