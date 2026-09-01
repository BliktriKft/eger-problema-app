import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from "class-validator";
import {
  PROBLEM_CATEGORIES,
  PROBLEM_STATUSES,
  PROBLEM_TITLE_MAX_LENGTH,
} from "@eger/shared";

export class UpdateProblemDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(3, PROBLEM_TITLE_MAX_LENGTH)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(10, 5000)
  description?: string;

  @ApiProperty({ enum: PROBLEM_CATEGORIES, required: false })
  @IsOptional()
  @IsEnum(PROBLEM_CATEGORIES)
  category?: (typeof PROBLEM_CATEGORIES)[number];

  @ApiProperty({ enum: PROBLEM_STATUSES, required: false })
  @IsOptional()
  @IsEnum(PROBLEM_STATUSES)
  status?: (typeof PROBLEM_STATUSES)[number];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  institutionId?: string | null;
}