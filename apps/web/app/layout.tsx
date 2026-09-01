import type { Metadata, Viewport } from 'next';
import * as React from 'react';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Eger Város Probléma Térkép',
  description: 'Jelentsd és szavazd meg Eger város problémáit egy interaktív térképen.',
  applicationName: 'Eger Probléma Térkép',
  authors: [{ name: 'Bliktri Kft.' }],
  keywords: ['Eger', 'probléma', 'térkép', 'bejelentés', 'önkormányzat'],
};

export const viewport: Viewport = {
  themeColor: '#C8102E',
  width: 'device-width',
  initialScale: 1,
};

// The root layout renders Client Components that depend on browser APIs
// (Supabase cookie store, query-client singletons).  Forcing a dynamic
// render here avoids the static-generation worker timeout you'll get
// otherwise when client components run inside the RSC build phase.
export const dynamic = 'force-dynamic';

/**
 * Root layout — owns the Supabase/QueryClient tree (via `Providers`)
 * and the design-system Tailwind base layer.  Individual route groups
 * (`(auth)`, `(main)`) render their own `<main>` content inside.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
