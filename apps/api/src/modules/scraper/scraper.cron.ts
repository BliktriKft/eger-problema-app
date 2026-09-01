import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ScraperService, SyncResult } from "./scraper.service";

/**
 * Daily cron — fires at 03:00 every day.
 *
 * Time chosen so we don't compete with the Hungarian news portals'
 * own cron windows (most Mediaworks sites re-publish around midnight).
 * The full sync across all sources takes roughly `keywords × sources ×
 * rate_limit_ms ≈ 18 × 5 s ≈ 90 s`; well within the hourly window.
 *
 * In V2 this will be replaced by a distributed scheduler (e.g.
 * Supabase cron + pg_net) so multiple API instances don't duplicate
 * work. For now we just rely on a single-instance deployment.
 */
@Injectable()
export class ScraperCron {
  private readonly logger = new Logger(ScraperCron.name);

  constructor(private readonly scraper: ScraperService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: "dailyScraperSync" })
  async dailySync(): Promise<void> {
    this.logger.log("Starting daily scraper sync…");
    const startedAt = Date.now();
    let results: SyncResult[] = [];
    try {
      results = await this.scraper.syncAll();
    } catch (err) {
      this.logger.error(
        `Daily scraper sync failed: ${(err as Error).message}`,
      );
      return;
    }
    const totals = results.reduce(
      (acc, r) => ({
        fetched: acc.fetched + r.fetched,
        upserted: acc.upserted + r.upserted,
        errors: acc.errors + (r.status !== "success" ? 1 : 0),
      }),
      { fetched: 0, upserted: 0, errors: 0 },
    );
    this.logger.log(
      `Daily scraper sync done in ${Date.now() - startedAt}ms — fetched=${totals.fetched} upserted=${totals.upserted} errors=${totals.errors}`,
    );
  }
}
