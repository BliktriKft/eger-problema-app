import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  RequiresServiceRole,
  SupabaseServiceRoleGuard,
} from "../../common/guards/supabase-service-role.guard";
import { ScraperService, SyncResult } from "./scraper.service";
import { SyncScraperDto } from "./dto/sync-scraper.dto";

/**
 * Internal endpoints used by the website lead (manual trigger) and
 * by the daily cron. Gated by the service_role key.
 *
 * Throttled at 5 req/min/user to prevent accidental flood.
 */
@ApiTags("scraper")
@ApiBearerAuth()
@Controller("scraper")
@UseGuards(SupabaseServiceRoleGuard)
@Throttle({ default: { limit: 5, ttl: 60_000 } })
export class ScraperController {
  constructor(private readonly scraper: ScraperService) {}

  @Post("sync")
  @RequiresServiceRole()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Run the scraper sync across all sources (or one filtered source). Service-role only.",
  })
  sync(@Body() body: SyncScraperDto): Promise<SyncResult[]> {
    return this.scraper.syncAll({
      source: body.source,
      sinceDays: body.sinceDays,
      queries: body.queries,
    });
  }
}
