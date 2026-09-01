'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { toast } from '@/components/ui/toaster';
import { getBrowserSupabase, SUPABASE_CONFIGURED } from '@/lib/supabase/client';

// Login uses `useSearchParams` which requires a dynamic render — Next.js
// would otherwise refuse to statically pre-render this route.
export const dynamic = 'force-dynamic';

/**
 * Login page — email + OAuth (Google / Apple / Meta).
 *
 * Email/password sign-in is handled by `supabase.auth.signInWithPassword`.
 * On success we bounce back to `?next=` (default /map).  We deliberately
 * DO NOT implement "forgot password" in MVP — that's V2 work.
 */

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next') ?? '/map';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function onEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!SUPABASE_CONFIGURED) {
      toast.warning('A Supabase nincs bekötve — töltsd ki az apps/web/.env fájlt.');
      return;
    }
    if (!email || !password) {
      toast.warning('Add meg az emailed és a jelszavad.');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = getBrowserSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Üdv újra!');
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      toast.error('Sikertelen bejelentkezés', { title: err instanceof Error ? err.message : 'Ismeretlen hiba' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted-50 px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6 rounded-lg border border-border bg-background p-6 shadow-sm">
        <header className="space-y-1">
          <Link href="/map" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3" /> Vissza a térképre
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Bejelentkezés</h1>
          <p className="text-sm text-muted-foreground">
            Eger város problématérképére. Szavazhatsz, bejelenthetsz és követheted az ügyeket.
          </p>
        </header>

        <OAuthButtons callbackUrl={nextPath} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">vagy</span>
          </div>
        </div>

        <form onSubmit={onEmailSignIn} className="space-y-3" data-testid="email-signin">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="te@példa.hu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="login-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Jelszó</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="login-password"
            />
          </div>
          <Button type="submit" loading={submitting} className="w-full" data-testid="login-submit">
            Bejelentkezés email címmel
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Nincs fiókod?{' '}
            <Link href={`/register?next=${encodeURIComponent(nextPath)}`} className="text-secondary hover:underline">
              Regisztráció
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
