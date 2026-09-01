import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

/**
 * OAuth/PKCE callback endpoint.  Supabase redirects Google/Apple/Meta
 * back here with `?code=` (or `#` fragments for implicit).  We swap
 * the code for a session via @supabase/ssr (cookie-based), then bounce
 * the user back to `?next=` — defaults to `/map`.
 *
 * Reference: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/map';

  if (code) {
    const supabase = await getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
