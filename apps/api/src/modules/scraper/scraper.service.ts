import { Inject, Injectable, Logger } from "@nestjs/common";
import { PRISMA_CLIENT } from "../../database/database.module";
import { NewsSource, ScrapedArticle } from "./sources/base.interface";
import { EgertvSource } from "./sources/egertv.source";
import { EgriHirekSource } from "./sources/egri-hirek.source";
import { HeolSource } from "./sources/heol.source";
import { ScraperHttpClient } from "../../common/scraper/scraper-http.client";
import { RobotsTxtService } from "../../common/scraper/robots-txt.service";

/**
 * Default keyword list used by `syncAll()`. Covers the broad topics
 * citizens care about in Eger (transport, schools, pool, parking).
 *
 * The wiki service can later narrow the list to a single problem's
 * context via `ScraperService.search(query)`.
 */
export const DEFAULT_KEYWORDS: readonly string[] = [
  "Eger közlekedés",
  "Eger iskola",
  "Eger uszoda",
  "Eger parkolás",
  "Eger szemét",
  "Eger közvilágítás",
];

export interface SyncResult {
  source: string;
  query: string;
  fetched: number;
  upserted: number;
  durationMs: number;
  status: "success" | "robots_blocked" | "rate_limited" | "error";
  errorMsg?: string;
}

/**
 * Coordinates the three news sources, persists results, and logs every
 * attempt. Used by the controller (manual trigger) and by the cron
 * (daily run at 03:00).
 */
@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly sources: NewsSource[];

  constructor(
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient,
    http: ScraperHttpClient,
    robots: RobotsTxtService,
  ) {
    this.sources = [
      new EgertvSource(http, robots),
      new EgriHirekSource(http, robots),
      new HeolSource(http, robots),
    ];
  }

  listSources(): readonly NewsSource[] {
    return this.sources;
  }

  /**
   * Run a sync across one or all sources. `opts.source` filters by
   * name (egertv | egri-hirek | heol). `opts.queries` overrides the
   * default keyword list.
   */
  async syncAll(opts?: {
    source?: string;
    sinceDays?: number;
    queries?: readonly string[];
  }): Promise<SyncResult[]> {
    const queries = opts?.queries ?? DEFAULT_KEYWORDS;
    const selected = opts?.source
      ? this.sources.filter((s) => s.name === opts.source)
      : this.sources;

    if (selected.length === 0) {
      throw new Error(`Unknown scraper source: ${opts?.source}`);
    }

    const results: SyncResult[] = [];
    for (const src of selected) {
      for (const q of queries) {
        results.push(await this.syncOne(src, q, opts?.sinceDays ?? 7));
      }
    }
    return results;
  }

  /**
   * Search a single source for `query`. Used by the wiki service when
   * generating a wiki entry for a specific Problem.
   */
  async search(
    sourceName: string,
    query: string,
    options?: { sinceDays?: number; maxResults?: number },
  ): Promise<ScrapedArticle[]> {
    const src = this.sources.find((s) => s.name === sourceName);
    if (!src) {
      throw new Error(`Unknown scraper source: ${sourceName}`);
    }
    return src.fetch(query, options);
  }

  private async syncOne(
    source: NewsSource,
    query: string,
    sinceDays: number,
  ): Promise<SyncResult> {
    const startedAt = Date.now();
    let status: SyncResult["status"] = "success";
    let errorMsg: string | undefined;

    let rows: ScrapedArticle[] = [];
    try {
      rows = await source.fetch(query, { sinceDays, maxResults: 50 });
    } catch (err) {
      status = "error";
      errorMsg = (err as Error).message?.slice(0, 2000);
      this.logger.error(
        `Scraper ${source.name} failed for "${query}": ${errorMsg}`,
      );
    }

    if (status === "error") {
      await this.logAttempt(source.name, query, status, startedAt, errorMsg);
      return {
        source: source.name,
        query,
        fetched: 0,
        upserted: 0,
        durationMs: Date.now() - startedAt,
        status,
        errorMsg,
      };
    }

    let upserted = 0;
    for (const article of rows) {
      try {
        await this.upsertArticle(article);
        upserted += 1;
      } catch (err) {
        this.logger.warn(
          `Upsert failed for ${article.url}: ${(err as Error).message}`,
        );
      }
    }

    await this.logAttempt(source.name, query, status, startedAt, errorMsg);

    return {
      source: source.name,
      query,
      fetched: rows.length,
      upserted,
      durationMs: Date.now() - startedAt,
      status,
    };
  }

  private async upsertArticle(article: ScrapedArticle): Promise<void> {
    await this.prisma.scrapedArticle.upsert({
      where: { url: article.url },
      create: {
        url: article.url,
        title: article.title.slice(0, 500),
        publishedAt: new Date(article.publishedAt),
        snippet: article.snippet.slice(0, 500),
        fullText: article.fullText ? article.fullText.slice(0, 2048) : null,
        source: article.source,
      },
      update: {
        title: article.title.slice(0, 500),
        publishedAt: new Date(article.publishedAt),
        snippet: article.snippet.slice(0, 500),
        fullText: article.fullText ? article.fullText.slice(0, 2048) : null,
      },
    });
  }

  private async logAttempt(
    source: string,
    url: string,
    status: SyncResult["status"],
    startedAt: number,
    errorMsg?: string,
  ): Promise<void> {
    try {
      await this.prisma.wikiScraperLog.create({
        data: {
          source,
          url: url.slice(0, 2000),
          status,
          errorMsg: errorMsg?.slice(0, 2000),
          durationMs: Date.now() - startedAt,
        },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to write wiki_scraper_logs row: ${(err as Error).message}`,
      );
    }
  }
}

// We import the Prisma client type only at use-sites below.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PrismaClient = import("@prisma/client").PrismaClient;
