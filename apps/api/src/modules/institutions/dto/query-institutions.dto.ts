import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from "class-validator";
import { INSTITUTION_TYPES, MAX_NEARBY_RADIUS_M } from "@eger/shared";

export class QueryInstitutionsDto {
  @ApiProperty({ enum: INSTITUTION_TYPES, required: false })
  @IsOptional()
  @IsEnum(INSTITUTION_TYPES)
  type?: (typeof INSTITUTION_TYPES)[number];

  @ApiProperty({ required: false, description: "Free-text name search" })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  search?: string;

  @ApiProperty({ minimum: 1, maximum: 500, default: 100, required: false })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number = 100;
}

// Re-export so we don't accidentally import the constant elsewhere
export { MAX_NEARBY_RADIUS_M };