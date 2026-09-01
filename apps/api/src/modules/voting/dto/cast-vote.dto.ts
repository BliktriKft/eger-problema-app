import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

export class CastVoteDto {
  @ApiProperty({ enum: [1, -1] })
  @IsIn([1, -1])
  value!: 1 | -1;
}