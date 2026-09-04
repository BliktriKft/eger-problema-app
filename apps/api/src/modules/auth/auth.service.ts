import { Inject, Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import type { AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { PRISMA_CLIENT } from "../../database/database.module";

/**
 * Thin wrapper around the Supabase server client. We hold one client
 * per role: `serviceRole` (bypasses RLS, used for admin / wiki writes)
 * and `anon` (respects RLS, used for OAuth callback exchanges). See
 * docs/decisions/0003-auth-flow.md.
 *
 * The service also injects the Prisma client so that `verifyToken`
 * can read the caller's app-level role from `public.users.role`.
 * That column is the single source of truth for admin / moderator
 * gating; it is set by the project owner via the Supabase SQL editor
 * (there is intentionally no public endpoint that elevates a user).
 */
@Injectable()
export class AuthService {
  private readonly serviceClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor(@Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      throw new Error(
        "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must all be set",
      );
    }

    this.serviceClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /**
   * Verifies a bearer token and returns the authenticated user.
   *
   * Steps:
   *   1. Call Supabase auth.getUser to confirm the JWT is valid and
   *      to extract the user's id + email + Supabase auth role.
   *   2. Look up public.users.role for that id (via the Prisma client
   *      which uses the Supabase pooler connection, RLS-bypassing
   *      because we connect with the postgres superuser from
   *      DATABASE_URL).
   *   3. If the row is missing (e.g. the user signed in but the
   *      trigger from auth.users → public.users hasn't fired yet,
   *      which happens during the very first OAuth callback), fall
   *      back to 'user' so the caller isn't unnecessarily rejected.
   *
   * Throws on invalid token (caller will get a 401 from JwtAuthGuard).
   */
  async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.serviceClient.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new Error(`Invalid Supabase token: ${error?.message ?? "unknown"}`);
    }
    const u = data.user;
    const authRole =
      (u.app_metadata?.["role"] as string | undefined) ?? "authenticated";

    // Read app role from public.users.role. We use the raw $queryRawUnsafe
    // path so we don't depend on the typed Problem/User delegates —
    // the typed UserDelegate is generated from the same Prisma schema,
    // but reading role as raw text avoids any typegen drift between
    // the locked pnpm Prisma version in the sandbox and the freshly
    // generated client in the builder stage.
    let appRole: "user" | "moderator" | "admin" = "user";
    try {
      const rows = await this.prisma.$queryRawUnsafe<Array<{ role: string }>>(
        `SELECT role FROM users WHERE id::text = $1::text LIMIT 1`,
        u.id,
      );
      const candidate = rows?.[0]?.role;
      if (candidate === "admin" || candidate === "moderator" || candidate === "user") {
        appRole = candidate;
      }
    } catch {
      // Swallow the read failure and default to 'user'. The token is
      // valid; we just couldn't load the role. Subsequent admin-gated
      // endpoints will correctly reject this caller as 'user'.
    }

    return {
      id: u.id,
      email: u.email ?? "",
      authRole,
      appRole,
    };
  }

  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }
}
