import { Injectable, Logger } from "@nestjs/common";
import * as cheerio from "cheerio";
import { RobotsTxtService } from "../../../common/scraper/robots-txt.service";
import { ScraperHttpClient } from "../../../common/scraper/scraper-http.client";
import { DomainRateLimiter } from "../../../common/scraper/domain-rate-limiter";
import { NewsSource, ScrapedArticle } from "./base.interface";

/**
 * Egri Hírek (eger.hu/hirek) scraper.
 *
 * Source layout (as of 2026-09-01):
 *   - Section page:   https://eger.hu/hirek
 *   - RSS (planned):  https://eger.hu/hirek/feed  (may 404; we
 *                     fall back to the section page parse).
 *
 * Strategy:
 *   1. Try the RSS feed first (cheap, structured).
 *   2. If the feed 4xx's, fall back to scraping the section page —
 *      each <article> block has a heading link + lead paragraph.
 *
 * robots.txt + rate limit are enforced once per fetch (the fallback
 * is a separate HTTP request, also rate-limited).
 */
@Injectable()
export class EgriHirekSource implements NewsSource {
  readonly name = "egri-hirek";
  readonly domain = "https://eger.hu";

  private readonly logger = new Logger(EgriHirekSource.name);
  private readonly rssUrl = `${this.domain}/hirek/feed`;
  private readonly sectionUrl = `${this.domain}/hirek`;
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

    // Prefer RSS — respect robots on the RSS URL.
    if (await this.robots.isAllowed(this.rssUrl)) {
      try {
        await this.limiter.wait(this.domain);
        const xml = await this.http.fetchText(this.rssUrl);
        const fromRss = this.parseRss(xml);
        return this.filter(fromRss, query, sinceDays, maxResults);
      } catch (err) {
        this.logger.warn(
          `Egri Hírek RSS failed (${(err as Error).message}); falling back to section page`,
        );
      }
    } else {
      this.logger.warn(`robots.txt blocks ${this.rssUrl}; trying section page`);
    }

    // Fallback: scrape the section page. Still robots-checked.
    if (await this.robots.isAllowed(this.sectionUrl)) {
      await this.limiter.wait(this.domain);
      const html = await this.http.fetchText(this.sectionUrl);
      const fromHtml = this.parseSection(html);
      return this.filter(fromHtml, query, sinceDays, maxResults);
    }

    this.logger.warn(`robots.txt blocks ${this.sectionUrl}; skipping`);
    return [];
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

  private parseSection(html: string): Omit<ScrapedArticle, "source">[] {
    const $ = cheerio.load(html);
    const items: Omit<ScrapedArticle, "source">[] = [];
    // The egri-hirek section page uses WordPress-style markup
    // (post-### classes). We accept any <article> with an <h*> link.
    $("article").each((_i, el) => {
      const $a = $(el).find("a[href]").first();
      const href = $a.attr("href");
      const title = $a.text().trim();
      if (!href || !title) {
        return;
      }
      const url = href.startsWith("http") ? href : `${this.domain}${href}`;
      const lead = $(el).find("p, .excerpt, .lead").first().text().trim();
      // Section pages don't expose publish dates reliably; use now as
      // a conservative fallback (filtered downstream by `sinceDays`).
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
