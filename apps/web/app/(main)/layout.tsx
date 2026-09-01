import * as React from 'react';
import { TopNav, SubmitFab } from '@/components/nav/TopNav';

/**
 * Layout for every signed-in / public surface (map, problems, submit…).
 * Renders the top nav and the optional FAB. The auth group has its own
 * layout that hides both.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav />
      <main className="flex-1">{children}</main>
      <SubmitFab />
    </div>
  );
}
