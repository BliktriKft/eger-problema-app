import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

/**
 * Shared HTTP client for the scraper module.
 *
 * Conventions:
 * - Sets the User-Agent to `EgerProblemaBot/0.1 (+https://egerproblem.app/bot)`
 *   by default, but allows callers to override it (e.g. when fetching
 *   an RSS feed that uses a stricter UA filter).
 * - Retries transient failures (5xx, ECONNRESET, ETIMEDOUT) with
 *   exponential backoff up to 3 attempts.
 * - Times out at 15 s by default — long enough for slow CMS pages,
 *   short enough that a stalled fetch does not block the daily cron.
 *
 * Rate limiting (1 req / 5 s per domain) is handled separately by
 * the per-source scrapers; this client only does retries + UA.
 */
@Injectable()
export class ScraperHttpClient {
  private readonly logger = new Logger(ScraperHttpClient.name);
  private readonly client: AxiosInstance;
  private readonly defaultUserAgent: string;

  constructor() {
    this.defaultUserAgent =
      process.env.NEWS_SCRAPER_USER_AGENT ??
      "EgerProblemaBot/0.1 (+https://egerproblem.app/bot)";

    this.client = axios.create({
      timeout: Number(process.env.SCRAPER_HTTP_TIMEOUT_MS ?? 15_000),
      maxRedirects: 3,
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "hu,en;q=0.5",
      },
      // Don't throw on 4xx — let the caller decide.
      validateStatus: (s) => s >= 200 && s < 400,
    });
  }

  /**
   * Fetch a URL with retry + UA defaults applied. Returns the raw
   * `text/html` (or whatever the server returned). Throws on
   * unrecoverable failure after the retry budget is exhausted.
   */
  async fetchText(
    url: string,
    options?: { userAgent?: string; maxAttempts?: number },
  ): Promise<string> {
    const maxAttempts = options?.maxAttempts ?? 3;
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const config: AxiosRequestConfig = {
        headers: {
          "User-Agent": options?.userAgent ?? this.defaultUserAgent,
        },
        responseType: "text",
        // axios types responseType:"text" as unknown — narrow here.
        transformResponse: [(d: unknown) => d],
      };
      try {
        const res = await this.client.get<string>(url, config);
        if (typeof res.data !== "string") {
          throw new Error(
            `Expected text response from ${url}, got ${typeof res.data}`,
          );
        }
        return res.data;
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts) {
          const backoff = 500 * 2 ** (attempt - 1);
          this.logger.warn(
            `fetchText(${url}) attempt ${attempt} failed: ${(err as Error).message}; retrying in ${backoff}ms`,
          );
          await new Promise((r) => setTimeout(r, backoff));
        }
      }
    }
    throw new Error(
      `fetchText(${url}) failed after ${maxAttempts} attempts: ${(lastError as Error | undefined)?.message ?? "unknown error"}`,
    );
  }
}
