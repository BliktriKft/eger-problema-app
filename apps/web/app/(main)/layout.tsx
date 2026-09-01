import * as React from 'react';
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
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <SubmitFab />
    </div>
  );
}
