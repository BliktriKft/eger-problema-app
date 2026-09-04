import {
  IsEnum,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import {
  INSTITUTION_TYPES,
  type InstitutionType,
} from "@eger/shared";

/**
 * Body for POST /api/institutions (admin only).
 *
 * `type` must be one of the canonical InstitutionType values
 * defined in packages/shared so the DB CHECK constraint and the
 * Vercel filter dropdown stay in lockstep. `latitude` /
 * `longitude` are stored as separate double-precision columns
 * (the schema does not store a geography for institutions — that
 * is only on `problems`).
 */
export class CreateInstitutionDto {
  @ApiProperty({ enum: INSTITUTION_TYPES })
  @IsEnum(INSTITUTION_TYPES, { message: "type must be one of the canonical InstitutionType values" })
  type!: InstitutionType;

  @ApiProperty({ minLength: 2, maxLength: 200 })
  @IsString()
  @Length(2, 200)
  name!: string;

  @ApiProperty({ minLength: 2, maxLength: 300 })
  @IsString()
  @Length(2, 300)
  address!: string;

  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsLongitude()
  longitude!: number;

  @ApiProperty({ required: false, example: "https://www.eger.hu" })
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: "officialUrl must be a valid URL" })
  @Length(1, 500)
  officialUrl?: string;
}
