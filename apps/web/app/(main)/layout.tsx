'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { TopNav, SubmitFab } from '@/components/nav/TopNav';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * Layout for every signed-in / public surface (map, problems, submit…).
 * Renders the top nav and the optional FAB. The auth group has its own
 * layout that hides both.
 *
 * F3: a render-phase ErrorBoundary wraps the page content so a crash in
 * any of /map, /problems, /submit, /profile shows the same recovery
 * UI instead of an unstyled blank screen.
 *
 * The SubmitFab is hidden on /submit (it would overlap the form's
 * primary action button) and on /institutions/admin/* (admin pages
 * have their own toolbar) so it doesn't compete with on-page UI.
 */
const FAB_HIDDEN_PREFIXES = ['/submit', '/login', '/register', '/institutions/admin'];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showFab = pathname
    ? !FAB_HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
    : true;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {showFab && <SubmitFab />}
    </div>
  );
}
