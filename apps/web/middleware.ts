import type { NextRequest } from 'next/server';
import { updateSupabaseSession } from './lib/supabase/middleware';

/**
 * Match every route except Next.js internals and static assets.
 * Everything else needs a current Supabase session cookie.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}
