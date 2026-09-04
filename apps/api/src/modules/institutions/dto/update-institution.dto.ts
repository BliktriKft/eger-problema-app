import { PartialType } from "@nestjs/swagger";
import { CreateInstitutionDto } from "./create-institution.dto";

/**
 * Body for PATCH /api/institutions/:id (admin only).
 *
 * Every field on CreateInstitutionDto is optional here; the
 * service applies only the fields that were actually sent so
 * admin can rename an institution without re-sending the
 * address or coordinates.
 */
export class UpdateInstitutionDto extends PartialType(CreateInstitutionDto) {}
