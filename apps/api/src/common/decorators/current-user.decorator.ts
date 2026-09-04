import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Shape of the authenticated user we care about. We intentionally type
 * the surface minimally — controllers should not assume more than
 * `id` + `email` + `appRole` (their app-level role, set in
 * public.users.role by an admin).
 *
 * `appRole` is one of: 'user' (default), 'moderator', 'admin'.
 * It's read from the `public.users.role` column by AuthService on
 * every authenticated request. Never trust the JWT claim for this —
 * the JWT only carries Supabase's auth role ('authenticated' /
 * 'anon' / 'service_role'), not our app's permission tier.
 */
export interface AuthenticatedUser {
  /** Supabase auth.users.id, a UUID. */
  id: string;
  email: string;
  /** Supabase auth JWT role: 'authenticated' | 'anon' | 'service_role'. */
  authRole: string;
  /** App-level role: 'user' | 'moderator' | 'admin'. */
  appRole: 'user' | 'moderator' | 'admin';
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
