'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, Map as MapIcon, Plus, List } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * Top navigation bar shown on every page except the auth layout. Renders
 * the logo, primary nav links, and the auth state slot (in vs out).
 */
export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, signOut } = useAuth();

  const links = [
    { href: '/map', label: 'Térkép', icon: MapIcon },
    { href: '/problems', label: 'Lista', icon: List },
    { href: '/submit', label: 'Új bejelentés', icon: Plus },
  ];

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur">
      <Link href="/map" className="flex items-center gap-2 font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
        <span className="inline-block size-6 rounded-md bg-primary text-primary-fg grid place-items-center text-xs">ÉP</span>
        Eger Probléma Térkép
      </Link>

      <nav className="hidden items-center gap-1 md:flex" aria-label="Fő navigáció">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-muted-100',
              pathname?.startsWith(l.href) && 'bg-muted-100 font-semibold',
            )}
          >
            <l.icon className="size-4" aria-hidden />
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        {isLoading ? (
          <span className="text-xs text-muted-foreground">…</span>
        ) : isAuthenticated ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            data-testid="sign-out"
          >
            <LogOut className="size-4" />
            Kijelentkezés
          </Button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(pathname ?? '/map')}`}
            className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
            data-testid="sign-in"
          >
            <LogIn className="size-4" />
            Bejelentkezés
          </Link>
        )}
      </div>
    </header>
  );
}

/**
 * Floating Action Button (FAB) for the map page — opens the submit form.
 * Kept separate from `TopNav` because it lives *over* the map, not in the
 * header strip.
 */
export function SubmitFab() {
  return (
    <Link
      href="/submit"
      className="fixed bottom-6 right-6 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Új bejelentés"
      data-testid="submit-fab"
    >
      <Plus className="size-6" aria-hidden />
    </Link>
  );
}
