import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  Max,
  Min,
} from "class-validator";
import {
  DEFAULT_NEARBY_RADIUS_M,
  MAX_NEARBY_RADIUS_M,
  PROBLEM_CATEGORIES,
} from "@eger/shared";

export class QueryNearbyDto {
  @ApiProperty({ minimum: -90, maximum: 90 })
  @Type(() => Number)
  @IsLatitude()
  lat!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @Type(() => Number)
  @IsLongitude()
  lng!: number;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_NEARBY_RADIUS_M,
    default: DEFAULT_NEARBY_RADIUS_M,
    description: "Radius in metres",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_NEARBY_RADIUS_M)
  @IsOptional()
  radius?: number = DEFAULT_NEARBY_RADIUS_M;

  @ApiProperty({ enum: PROBLEM_CATEGORIES, required: false })
  @IsOptional()
  @IsEnum(PROBLEM_CATEGORIES)
  category?: (typeof PROBLEM_CATEGORIES)[number];

  @ApiProperty({ minimum: 1, maximum: 500, default: 100, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number = 100;
}