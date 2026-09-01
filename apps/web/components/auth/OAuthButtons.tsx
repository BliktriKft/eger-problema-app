'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toaster';
import { getBrowserSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

/**
 * OAuthButtons — Google / Apple / Meta. Wraps `supabase.auth.signInWithOAuth`
 * for each provider; on success Supabase redirects back to /api/auth/callback
 * (Route Handler) which finalises the PKCE exchange. The browser-supplied
 * session persists in a cookie via `@supabase/ssr`.
 */

type OAuthProvider = 'google' | 'apple' | 'facebook';

interface ProviderSpec {
  id: OAuthProvider;
  label: string;
}

const PROVIDERS: ReadonlyArray<ProviderSpec> = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
  { id: 'facebook', label: 'Meta' },
];

export function OAuthButtons({ className, callbackUrl = '/map' }: { className?: string; callbackUrl?: string }) {
  const [pending, setPending] = React.useState<OAuthProvider | null>(null);

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className={cn('rounded-md border border-warning-200 bg-warning-50 p-3 text-sm text-warning-900', className)}>
        Az OAuth gombok használatához állítsd be a <code>NEXT_PUBLIC_SUPABASE_URL</code> és <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> változókat az <code>apps/web/.env</code> fájlban.
      </div>
    );
  }

  async function handle(provider: OAuthProvider) {
    setPending(provider);
    try {
      const supabase = getBrowserSupabase();
      const redirectTo = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
      const { error, data } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ismeretlen hiba';
      toast.error('Bejelentkezés sikertelen', { title: msg });
      setPending(null);
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)} data-testid="oauth-buttons">
      {PROVIDERS.map((p) => (
        <Button
          key={p.id}
          variant="outline"
          size="lg"
          onClick={() => handle(p.id)}
          loading={pending === p.id}
          disabled={pending !== null && pending !== p.id}
          data-testid={`oauth-${p.id}`}
          aria-label={`${p.label} fiókkal bejelentkezés`}
          className="justify-start"
        >
          <span className="inline-block size-5 shrink-0 rounded-sm bg-muted-200" aria-hidden />
          {p.label} folytatás
        </Button>
      ))}
    </div>
  );
}
