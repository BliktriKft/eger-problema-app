import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ProblemsService } from "./problems.service";
import { CreateProblemDto } from "./dto/create-problem.dto";
import { UpdateProblemDto } from "./dto/update-problem.dto";
import { QueryNearbyDto } from "./dto/query-nearby.dto";
import { ProblemEntity } from "./entities/problem.entity";
import { Public } from "../auth/auth.guard";

@ApiTags("problems")
@Controller("problems")
export class ProblemsController {
  constructor(private readonly problems: ProblemsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "List problems (paginated, filtered)" })
  findAll(): Promise<ProblemEntity[]> {
    return this.problems.findAll() as Promise<ProblemEntity[]>;
  }

  @Get("nearby")
  @Public()
  @ApiOperation({
    summary: "Find problems within `radius` metres of (lat, lng)",
  })
  nearby(@Query() _query: QueryNearbyDto): Promise<ProblemEntity[]> {
    // Real implementation uses raw SQL: ST_DWithin(location, point, radius).
    return Promise.resolve([]);
  }

  @Post()
  @ApiOperation({ summary: "Create a new problem (auth required)" })
  create(@Body() _body: CreateProblemDto): Promise<ProblemEntity> {
    return Promise.resolve({} as ProblemEntity);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a problem (author or admin)" })
  update(
    @Param("id", ParseUUIDPipe) _id: string,
    @Body() _body: UpdateProblemDto,
  ): Promise<ProblemEntity> {
    return Promise.resolve({} as ProblemEntity);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a problem (author or admin)" })
  remove(@Param("id", ParseUUIDPipe) _id: string): Promise<void> {
    return Promise.resolve();
  }
}