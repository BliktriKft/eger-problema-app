import { ApiProperty } from "@nestjs/swagger";
import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from "class-validator";
import {
  PROBLEM_CATEGORIES,
  PROBLEM_TITLE_MAX_LENGTH,
} from "@eger/shared";

export class CreateProblemDto {
  @ApiProperty({ minLength: 3, maxLength: PROBLEM_TITLE_MAX_LENGTH })
  @IsString()
  @Length(3, PROBLEM_TITLE_MAX_LENGTH)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 5000 })
  @IsString()
  @Length(10, 5000)
  description!: string;

  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ enum: PROBLEM_CATEGORIES })
  @IsEnum(PROBLEM_CATEGORIES)
  category!: (typeof PROBLEM_CATEGORIES)[number];

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  institutionId?: string | null;
}