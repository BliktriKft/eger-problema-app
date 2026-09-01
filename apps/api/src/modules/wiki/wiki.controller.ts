import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { WikiService } from "./wiki.service";

@ApiTags("wiki")
@Controller("problems/:id/wiki")
export class WikiController {
  constructor(private readonly wiki: WikiService) {}

  @Get()
  @ApiOperation({ summary: "Fetch the AI-generated wiki entry for a problem" })
  get(@Param("id", ParseUUIDPipe) _id: string): Promise<unknown> {
    return this.wiki.find();
  }

  @Post("regenerate")
  @ApiBearerAuth()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary:
      "Trigger a regeneration of the wiki entry (service-role only)",
  })
  regenerate(@Param("id", ParseUUIDPipe) _id: string): Promise<void> {
    // Service-role only: the AI worker calls this after it has written a new
    // WikiEntry. Real implementation lives in the website-ai worker.
    return Promise.resolve();
  }
}