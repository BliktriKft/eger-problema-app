import { Module } from "@nestjs/common";
import { WikiController } from "./wiki.controller";
import { WikiService } from "./wiki.service";
import { WikiLlmClient } from "./wiki-llm.client";
import { ScraperModule } from "../scraper/scraper.module";

/**
 * Wiki module — depends on the scraper module so `WikiService` can
 * search the local corpus before calling the LLM. `WikiLlmClient` is
 * instantiated here (not globally) because it is the only consumer
 * of the Anthropic SDK and we want the mock fallback to be the
 * default in tests.
 */
@Module({
  imports: [ScraperModule],
  controllers: [WikiController],
  providers: [WikiService, WikiLlmClient],
  exports: [WikiService],
})
export class WikiModule {}
