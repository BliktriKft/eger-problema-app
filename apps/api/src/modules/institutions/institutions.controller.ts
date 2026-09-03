import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { InstitutionsService } from "./institutions.service";
import { QueryInstitutionsDto } from "./dto/query-institutions.dto";
import { Public } from "../auth/auth.guard";

@ApiTags("institutions")
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "List institutions (public)" })
  findAll(@Query() _query: QueryInstitutionsDto): Promise<unknown[]> {
    return this.institutions.findAll();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get one institution" })
  findOne(@Param("id", ParseUUIDPipe) _id: string): Promise<unknown> {
    return Promise.resolve({});
  }
}