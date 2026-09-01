import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * Optional body for `POST /scraper/sync`.
 *
 * The endpoint is intended to be triggered by the website lead or
 * the daily cron — both can omit the body and accept the defaults.
 * The body is used by tests + ad-hoc backfills to scope the run.
 */
export class SyncScraperDto {
  @ApiProperty({
    description:
      "Restrict the sync to a specific source (egertv, egri-hirek, heol). Default: sync all sources.",
    required: false,
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiProperty({
    description:
      "Number of days to look back when querying each source. Default: 7.",
    required: false,
    default: 7,
    minimum: 1,
    maximum: 90,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  sinceDays?: number;

  @ApiProperty({
    description:
      "Override the default keyword list (Eger közlekedés, Eger iskola, …) with these queries.",
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  queries?: string[];
}
