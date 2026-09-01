import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { timingSafeEqual } from "node:crypto";

/**
 * Marks an endpoint as requiring the Supabase service_role key.
 *
 * The service_role key is a static, server-only secret — it is NOT a
 * Supabase JWT. The AI worker (or any internal caller) sends it as
 * `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`. This guard
 * does a constant-time compare against the value in the env so we do
 * not leak the secret via timing differences.
 *
 * Used by the scraper (`POST /scraper/sync`) and the wiki
 * (`POST /wiki/problems/:id/regenerate`) controllers.
 */
export const REQUIRES_SERVICE_ROLE_KEY = "requiresServiceRole";
export const RequiresServiceRole = (): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRES_SERVICE_ROLE_KEY, true);

@Injectable()
export class SupabaseServiceRoleGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseServiceRoleGuard.name);

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRES_SERVICE_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      // Guard is mounted globally for the scraper + wiki modules, but
      // public read endpoints omit the metadata — let them through.
      return true;
    }

    const expected = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!expected) {
      // Fail closed: if the secret is not configured, refuse the call
      // rather than silently allowing every request.
      this.logger.error(
        "SUPABASE_SERVICE_ROLE_KEY is not configured; refusing service_role call",
      );
      throw new UnauthorizedException(
        "Service-role authentication is not configured on this server",
      );
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { headers: Record<string, string | string[] | undefined> }>();
    const header = request.headers.authorization;
    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const presented = header.slice("Bearer ".length).trim();
    if (!presented) {
      throw new UnauthorizedException("Empty bearer token");
    }

    if (!this.timingSafeEqualStrings(presented, expected)) {
      throw new UnauthorizedException("Invalid service-role key");
    }
    return true;
  }

  /**
   * Constant-time compare of two strings. Returns `false` for length
   * mismatches (after still running a constant-time scan over the
   * overlapping prefix) to avoid leaking length info via timing.
   */
  private timingSafeEqualStrings(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    const len = Math.min(aBuf.length, bBuf.length);
    let diff = aBuf.length ^ bBuf.length;
    for (let i = 0; i < len; i += 1) {
      diff |= (aBuf[i] ?? 0) ^ (bBuf[i] ?? 0);
    }
    return diff === 0;
  }
}

// Re-export timingSafeEqual so unit tests can stub it via spyOn if needed.
export const __testing = { timingSafeEqual };
