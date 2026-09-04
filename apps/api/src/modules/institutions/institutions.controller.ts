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
import { InstitutionsService } from "./institutions.service";
import { QueryInstitutionsDto } from "./dto/query-institutions.dto";
import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { Public, RequireAdmin } from "../auth/auth.guard";

@ApiTags("institutions")
@Controller("institutions")
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  /** Public catalog browse. Anyone can read. */
  @Get()
  @Public()
  @ApiOperation({ summary: "List institutions (public)" })
  findAll(@Query() _query: QueryInstitutionsDto): Promise<unknown[]> {
    return this.institutions.findAll();
  }

  /** Single institution detail. Public — used by the autocomplete on /submit. */
  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Get one institution" })
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<unknown> {
    return this.institutions.findOne(id);
  }

  // ----- admin-only CRUD -----

  /** Admin / moderator: create a new institution. */
  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Create institution (admin only)" })
  create(@Body() body: CreateInstitutionDto): Promise<unknown> {
    return this.institutions.create(body);
  }

  /** Admin / moderator: update institution name/address/url/coords/type. */
  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Update institution (admin only)" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateInstitutionDto,
  ): Promise<unknown> {
    return this.institutions.update(id, body);
  }

  /** Admin only: delete an institution. Blocked if any problem references it. */
  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Delete institution (admin only)" })
  remove(@Param("id", ParseUUIDPipe) id: string): Promise<{ id: string }> {
    return this.institutions.remove(id);
  }
}
