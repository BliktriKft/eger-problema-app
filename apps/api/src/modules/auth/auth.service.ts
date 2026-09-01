import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

/**
 * Thin wrapper around the Supabase server client. We hold one client
 * per role: `serviceRole` (bypasses RLS, used for admin / wiki writes)
 * and `anon` (respects RLS, used for OAuth callback exchanges). See
 * docs/decisions/0003-auth-flow.md.
 */
@Injectable()
export class AuthService {
  private readonly serviceClient: SupabaseClient;
  private readonly anonClient: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!url || !serviceKey || !anonKey) {
      throw new Error(
        'SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY must all be set',
      );
    }

    this.serviceClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    this.anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  /** Verifies a bearer token and returns the authenticated user. Throws on invalid token. */
  async verifyToken(accessToken: string): Promise<AuthenticatedUser> {
    const { data, error } = await this.serviceClient.auth.getUser(accessToken);
    if (error || !data.user) {
      throw new Error(`Invalid Supabase token: ${error?.message ?? 'unknown'}`);
    }
    const u = data.user;
    return {
      id: u.id,
      email: u.email ?? '',
      role: (u.app_metadata?.['role'] as string | undefined) ?? 'authenticated',
    };
  }

  getServiceClient(): SupabaseClient {
    return this.serviceClient;
  }

  getAnonClient(): SupabaseClient {
    return this.anonClient;
  }
}
