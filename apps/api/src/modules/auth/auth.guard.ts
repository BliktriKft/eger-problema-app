import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

/**
 * Marks an endpoint as requiring authentication. Public endpoints omit this. */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Marks an endpoint as requiring admin (or moderator) role.
 *
 * Resolution order:
 *   1. If @Public() is set on the same handler/class, this metadata is
 *      ignored — public endpoints stay public.
 *   2. Otherwise the JwtAuthGuard checks request.user.appRole. Only
 *      'admin' or 'moderator' are allowed; everyone else gets a 403.
 *
 * Use sparingly — most admin endpoints should still authenticate, and
 * we prefer the JwtAuthGuard's 401 for missing/invalid tokens over
 * a 403 for a real admin rejection.
 */
export const REQUIRE_ADMIN_KEY = "requireAdmin";
export const RequireAdmin = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_ADMIN_KEY, true);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length).trim();
    request.user = await this.authService.verifyToken(token);

    // Admin gate runs AFTER verifyToken so that an unauthenticated
    // request never learns whether the admin endpoint exists.
    const requireAdmin = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requireAdmin) {
      const role = request.user.appRole;
      if (role !== "admin" && role !== "moderator") {
        throw new ForbiddenException(
          "Admin role required for this endpoint",
        );
      }
    }
    return true;
  }
}
