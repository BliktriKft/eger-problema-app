import { ApiProperty } from "@nestjs/swagger";
import { ScrapedArticle } from "../sources/base.interface";

/**
 * Swagger response model for the scraper module. Mirrors the
 * `ScrapedArticle` interface and is what `GET /scraper/articles`
 * (planned, not yet implemented) will return.
 */
export class ScrapedArticleEntity implements ScrapedArticle {
  @ApiProperty({ description: "Canonical article URL." })
  url!: string;

  @ApiProperty({ description: "Article headline." })
  title!: string;

  @ApiProperty({ description: "ISO 8601 publish timestamp.", example: "2026-09-01T12:00:00Z" })
  publishedAt!: string;

  @ApiProperty({ description: "≤500 char teaser used as the LLM snippet." })
  snippet!: string;

  @ApiProperty({
    description: "≤2 KB cleaned body text, or null if the scraper skipped it.",
    nullable: true,
    required: false,
  })
  fullText?: string | null;

  @ApiProperty({
    description: "Source identifier (egertv | egri-hirek | heol).",
    example: "egertv",
  })
  source!: string;
}
