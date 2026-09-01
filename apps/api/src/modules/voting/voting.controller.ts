import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { VotingService } from "./voting.service";
import { CastVoteDto } from "./dto/cast-vote.dto";

@ApiTags("voting")
@Controller()
export class VotingController {
  constructor(private readonly voting: VotingService) {}

  @Post("problems/:id/vote")
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Cast or change a vote (+1/-1) on a problem (auth required)",
  })
  cast(
    @Param("id", ParseUUIDPipe) _id: string,
    @Body() _body: CastVoteDto,
  ): Promise<{ score: number }> {
    return this.voting.cast() as Promise<{ score: number }>;
  }
}