import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";
import { RobotsTxtService } from "../../../common/scraper/robots-txt.service";
import { ScraperHttpClient } from "../../../common/scraper/scraper-http.client";
import { DomainRateLimiter } from "../../../common/scraper/domain-rate-limiter";
import { NewsSource, ScrapedArticle } from "./base.interface";

/**
 * HEOL (Heves Megyei Hírlap) scraper.
 *
 * Source layout (as of 2026-09-01):
 *   - Front page:     https://www.heol.hu
 *   - RSS (planned):  https://www.heol.hu/rss  (we attempt it; many
 *                     Mediaworks portals fall back to the kereső page)
 *
 * Strategy:
 *   1. Try the RSS feed first.
 *   2. If it 4xx's, query the kereső endpoint:
 *      https://www.heol.hu/kereses?search=…
 *      Parse the result list (h2 a + snippet).
 *   3. Filter by query + recency.
 *
 * robots.txt + rate limit are enforced on each fetch.
 */
@Injectable()
export class HeolSource implements NewsSource {
  readonly name = "heol";
  readonly domain = "https://www.heol.hu";

  private readonly logger = new Logger(HeolSource.name);
  private readonly rssUrl = `${this.domain}/rss`;
  private readonly searchUrl = `${this.domain}/kereses`;
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

    if (await this.robots.isAllowed(this.rssUrl)) {
      try {
        await this.limiter.wait(this.domain);
        const xml = await this.http.fetchText(this.rssUrl);
        const items = this.parseRss(xml);
        return this.filter(items, query, sinceDays, maxResults);
      } catch (err) {
        this.logger.warn(
          `HEOL RSS failed (${(err as Error).message}); falling back to kereső`,
        );
      }
    }

    if (!query.trim()) {
      // The kereső requires a query string — bail early.
      return [];
    }
    const search = `${this.searchUrl}?search=${encodeURIComponent(query)}`;
    if (!(await this.robots.isAllowed(search))) {
      this.logger.warn(`robots.txt blocks ${search}; skipping`);
      return [];
    }
    await this.limiter.wait(this.domain);
    const html = await this.http.fetchText(search);
    const items = this.parseSearch(html);
    return this.filter(items, query, sinceDays, maxResults);
  }

  private filter(
    rows: Omit<ScrapedArticle, "source">[],
    query: string,
    sinceDays: number,
    maxResults: number,
  ): ScrapedArticle[] {
    const q = query.trim().toLowerCase();
    const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1_000;
    const out: ScrapedArticle[] = [];
    for (const item of rows) {
      if (out.length >= maxResults) {
        break;
      }
      const ts = Date.parse(item.publishedAt);
      if (Number.isFinite(ts) && ts < cutoff) {
        continue;
      }
      if (q) {
        const haystack = `${item.title} ${item.snippet}`.toLowerCase();
        if (!haystack.includes(q)) {
          continue;
        }
      }
      out.push({ ...item, source: this.name });
    }
    return out;
  }

  private parseRss(xml: string): Omit<ScrapedArticle, "source">[] {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: Omit<ScrapedArticle, "source">[] = [];
    $("item").each((_i, el) => {
      const link = $(el).find("link").first().text().trim();
      const title = $(el).find("title").first().text().trim();
      const pubDate = $(el).find("pubDate,published").first().text().trim();
      const description = $(el).find("description,summary").first().text().trim();
      if (!link || !title) {
        return;
      }
      const ts = Date.parse(pubDate);
      const publishedAt = Number.isNaN(ts)
        ? new Date().toISOString()
        : new Date(ts).toISOString();
      items.push({
        url: link,
        title: title.slice(0, 500),
        publishedAt,
        snippet: this.clean(description).slice(0, 500),
        fullText: null,
      });
    });
    return items;
  }

  private parseSearch(html: string): Omit<ScrapedArticle, "source">[] {
    const $ = cheerio.load(html);
    const items: Omit<ScrapedArticle, "source">[] = [];
    // Mediaworks kereső markup: <article> with <h2><a>…</a></h2>
    $("article, .search-result, .result").each((_i, el) => {
      const $a = $(el).find("a[href]").first();
      const href = $a.attr("href");
      const title = $a.text().trim();
      if (!href || !title) {
        return;
      }
      const url = href.startsWith("http") ? href : `${this.domain}${href}`;
      const lead = $(el).find("p, .lead, .snippet").first().text().trim();
      const publishedAt = new Date().toISOString();
      items.push({
        url,
        title: title.slice(0, 500),
        publishedAt,
        snippet: this.clean(lead).slice(0, 500),
        fullText: null,
      });
    });
    return items;
  }

  private clean(s: string): string {
    return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
}
