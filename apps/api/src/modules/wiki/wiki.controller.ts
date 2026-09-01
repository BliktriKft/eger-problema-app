import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  RequiresServiceRole,
  SupabaseServiceRoleGuard,
} from "../../common/guards/supabase-service-role.guard";
import { WikiEntryView, WikiService } from "./wiki.service";

/**
 * Public read + service-role write endpoints for the wiki module.
 *
 * The architect placeholder (`problems/:id/wiki`) is preserved as the
 * public-read route. We add `wiki/regenerate/:problemId` as a
 * service-role endpoint under a separate path so the lead can trigger
 * a regeneration manually without going through the cron.
 */
@ApiTags("wiki")
@Controller()
export class WikiController {
  constructor(private readonly wiki: WikiService) {}

  @Get("problems/:id/wiki")
  @ApiOperation({ summary: "Fetch the AI-generated wiki entry for a problem" })
  get(@Param("id", ParseUUIDPipe) id: string): Promise<WikiEntryView | null> {
    return this.wiki.findByProblem(id);
  }

  @Post("wiki/problems/:problemId/regenerate")
  @ApiBearerAuth()
  @UseGuards(SupabaseServiceRoleGuard)
  @RequiresServiceRole()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Force-regenerate the wiki entry for a problem. Service-role only.",
  })
  regenerate(
    @Param("problemId", ParseUUIDPipe) problemId: string,
  ): Promise<WikiEntryView> {
    return this.wiki.regenerate(problemId);
  }

  @Post("wiki/regenerate/:problemId")
  @ApiBearerAuth()
  @UseGuards(SupabaseServiceRoleGuard)
  @RequiresServiceRole()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Alias for POST /wiki/problems/:problemId/regenerate (matches the plan spec).",
  })
  regenerateAlias(
    @Param("problemId", ParseUUIDPipe) problemId: string,
  ): Promise<WikiEntryView> {
    return this.wiki.regenerate(problemId);
  }
}
