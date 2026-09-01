import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ScraperController } from "./scraper.controller";
import { ScraperService } from "./scraper.service";
import { ScraperCron } from "./scraper.cron";

/**
 * Scraper module — depends on the shared `CommonModule` (for
 * `ScraperHttpClient` + `RobotsTxtService` + `SupabaseServiceRoleGuard`)
 * and on the global `DatabaseModule` (for the Prisma client token).
 *
 * Bootstraps the daily cron at 03:00 via `@nestjs/schedule`. The cron
 * calls `ScraperService.syncAll()` with the default keyword list and
 * logs the result to Pino.
 */
@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperCron],
  exports: [ScraperService],
})
export class ScraperModule {}
