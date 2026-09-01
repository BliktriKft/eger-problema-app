import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Shape of the Supabase JWT payload we care about. We intentionally
 * type the surface minimally — controllers should not assume more
 * than `id` + `email` + `role`.
 */
export interface AuthenticatedUser {
  /** Supabase auth.users.id, a UUID. */
  id: string;
  email: string;
  /** `authenticated` | `anon` | `service_role` (from `auth.jwt() ->> 'role'`). */
  role: string;
}

/**
 * `@CurrentUser()` decorator — pulls the authenticated user off the
 * request. The `AuthGuard` (see `modules/auth/auth.guard.ts`) is
 * responsible for populating `request.user` with a verified JWT.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new UnauthorizedException('No authenticated user on request');
    }
    return request.user;
  },
);
