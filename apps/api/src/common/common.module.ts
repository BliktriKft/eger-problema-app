import { Module, Global } from "@nestjs/common";
import { SupabaseServiceRoleGuard } from "./guards/supabase-service-role.guard";
import { ScraperHttpClient } from "./scraper/scraper-http.client";
import { RobotsTxtService } from "./scraper/robots-txt.service";

/**
 * Shared infrastructure for the scraper + wiki modules:
 * - `SupabaseServiceRoleGuard`  — gates internal endpoints on the
 *   static service_role key (constant-time compare).
 * - `ScraperHttpClient`         — axios wrapper with retry + UA.
 * - `RobotsTxtService`          — fetches + parses + caches robots.txt
 *   so every source check costs at most one HTTP round-trip per domain
 *   per hour.
 *
 * Marked `@Global()` so the scraper and wiki modules can inject
 * these without re-importing the CommonModule.
 */
@Global()
@Module({
  providers: [
    SupabaseServiceRoleGuard,
    ScraperHttpClient,
    RobotsTxtService,
  ],
  exports: [
    SupabaseServiceRoleGuard,
    ScraperHttpClient,
    RobotsTxtService,
  ],
})
export class CommonModule {}
