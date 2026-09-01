import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";
import { RobotsTxtService } from "../../../common/scraper/robots-txt.service";
import { ScraperHttpClient } from "../../../common/scraper/scraper-http.client";
import { DomainRateLimiter } from "../../../common/scraper/domain-rate-limiter";
import { NewsSource, ScrapedArticle } from "./base.interface";

/**
 * Eger TV news scraper.
 *
 * Source layout (as of 2026-09-01):
 *   - RSS feed:        https://www.egertv.hu/feed
 *   - Sitemap:         https://www.egertv.hu/sitemap.xml
 *
 * Strategy:
 *   1. Fetch the RSS feed (cheerio parses XML).
 *   2. For each <item>, extract <link>, <title>, <pubDate>, <description>.
 *   3. Filter by query (case-insensitive substring match on title +
 *      description) and by recency (`sinceDays`).
 *   4. Return at most `maxResults` matches (default 50).
 *
 * robots.txt + rate limit are enforced before the RSS fetch.
 * `fullText` is left null — Eger TV's RSS descriptions are
 * typically <500 chars, which is the LLM snippet size anyway.
 */
@Injectable()
export class EgertvSource implements NewsSource {
  readonly name = "egertv";
  readonly domain = "https://www.egertv.hu";

  private readonly logger = new Logger(EgertvSource.name);
  private readonly rssUrl = `${this.domain}/feed`;
  private readonly limiter: DomainRateLimiter;

  constructor(
    private readonly http: ScraperHttpClient,
    private readonly robots: RobotsTxtService,
  ) {
    this.limiter = new DomainRateLimiter();
  }

  async fetch(
    query: string,
    options?: { sinceDays?: number; maxResults?: number },
  ): Promise<ScrapedArticle[]> {
    const sinceDays = options?.sinceDays ?? 7;
    const maxResults = options?.maxResults ?? 50;

    const allowed = await this.robots.isAllowed(this.rssUrl);
    if (!allowed) {
      this.logger.warn(`robots.txt blocks ${this.rssUrl}; skipping`);
      return [];
    }

    await this.limiter.wait(this.domain);
    const xml = await this.http.fetchText(this.rssUrl);
    const items = this.parseRss(xml);
    const q = query.trim().toLowerCase();
    const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1_000;

    const matched: ScrapedArticle[] = [];
    for (const item of items) {
      if (matched.length >= maxResults) {
        break;
      }
      const ts = Date.parse(item.publishedAt);
      if (Number.isFinite(ts) && ts < cutoff) {
        continue;
      }
      const haystack = `${item.title} ${item.snippet}`.toLowerCase();
      if (q && !haystack.includes(q)) {
        continue;
      }
      matched.push({ ...item, source: this.name });
    }
    return matched;
  }

  private parseRss(xml: string): Omit<ScrapedArticle, "source">[] {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: Omit<ScrapedArticle, "source">[] = [];
    $("item").each((_i, el) => {
      const link = $(el).find("link").first().text().trim();
      const title = $(el).find("title").first().text().trim();
      const pubDate = $(el).find("pubDate").first().text().trim();
      const description = $(el).find("description").first().text().trim();

      if (!link || !title) {
        return;
      }
      const publishedAt =
        this.normalizeDate(pubDate) ?? new Date().toISOString();

      // RSS descriptions are HTML-escaped; cheerio's text() already
      // strips tags but leaves entities. Snippet is truncated to 500.
      const cleaned = this.cleanSnippet(description).slice(0, 500);
      items.push({
        url: link,
        title: title.slice(0, 500),
        publishedAt,
        snippet: cleaned,
        fullText: null,
      });
    });
    return items;
  }

  private cleanSnippet(s: string): string {
    return s
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * RSS pubDate is RFC-822 (`Mon, 01 Sep 2026 12:00:00 +0000`).
   * `new Date(...)` handles it natively in V8 — we just normalize
   * to ISO 8601.
   */
  private normalizeDate(s: string): string | null {
    if (!s) {
      return null;
    }
    const ts = Date.parse(s);
    if (Number.isNaN(ts)) {
      return null;
    }
    return new Date(ts).toISOString();
  }
}
