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

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams?.get('next') ?? '/map';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function onEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!SUPABASE_CONFIGURED) {
      toast.warning('A Supabase nincs bekötve — töltsd ki az apps/web/.env fájlt.');
      return;
    }
    if (password.length < 8) {
      toast.warning('A jelszó legyen legalább 8 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      const supabase = getBrowserSupabase();
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}` },
      });
      if (error) throw error;
      if (data.session) {
        toast.success('Sikeres regisztráció!');
        router.push(nextPath);
      } else {
        toast.info('Erősítsd meg az emailed — küldtünk egy linket.');
      }
    } catch (err) {
      toast.error('Sikertelen regisztráció', { title: err instanceof Error ? err.message : 'Ismeretlen hiba' });
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
          <h1 className="text-2xl font-semibold tracking-tight">Regisztráció</h1>
          <p className="text-sm text-muted-foreground">
            Kezdj el bejelenteni és szavazni — mindössze egy email cím kell.
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

        <form onSubmit={onEmailRegister} className="space-y-3" data-testid="email-register">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="te@példa.hu" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Jelszó (min. 8 karakter)</Label>
            <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </div>
          <Button type="submit" loading={submitting} className="w-full" data-testid="register-submit">
            Regisztráció email címmel
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Van már fiókod?{' '}
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-secondary hover:underline">
              Bejelentkezés
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
