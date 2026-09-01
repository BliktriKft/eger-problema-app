'use client';

import * as React from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ErrorBoundary — top-level React error boundary that renders a
 * branded full-page error state when something throws in render.
 *
 * Why a class component:  React's `componentDidCatch` API is the only
 * reliable hook for catching render-phase errors; hooks can't do it.
 *
 * This is intentionally placed around the (main) route group so a
 * crash in any of /map, /problems, /submit, /profile shows the same
 * recovery UI.  Below this boundary, TanStack Query's `isError`
 * branches already handle data-fetch failures — this catches the
 * stuff those can't see (component bugs, broken hooks, etc.).
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback; defaults to the branded full-page card. */
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
  /** Render this in dev for the full stack trace. */
  showStack?: boolean;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    // The Next.js dev console already shows this; we just forward to
    // the browser console for parity with production debugging.
    console.error('[ErrorBoundary]', err, info.componentStack);
  }

  reset = () => {
    this.setState({ err: null });
  };

  render() {
    const { err } = this.state;
    if (!err) return this.props.children;
    if (this.props.fallback) return this.props.fallback(err, this.reset);

    const showStack = this.props.showStack ?? process.env.NODE_ENV !== 'production';
    return (
      <div
        role="alert"
        className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 p-8 text-center"
        data-testid="error-boundary"
      >
        <div className="rounded-full bg-destructive-50 p-4">
          <AlertOctagon className="size-8 text-destructive" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Valami elromlott</h1>
        <p className="text-sm text-muted-foreground">
          Az alkalmazás váratlan hibát észlelt. Próbáld meg újra, és ha a probléma tartósan fennáll,
          küldj nekünk visszajelzést a hibaüzenettel.
        </p>
        <pre className="max-h-40 w-full overflow-auto rounded-md bg-muted-50 p-3 text-left text-xs text-muted-foreground">
          {err.message}
        </pre>
        {showStack && err.stack ? (
          <pre className="max-h-40 w-full overflow-auto rounded-md bg-muted-50 p-3 text-left text-[10px] text-muted-foreground">
            {err.stack.split('\n').slice(0, 8).join('\n')}
          </pre>
        ) : null}
        <Button variant="primary" onClick={this.reset} data-testid="error-boundary-reset">
          <RotateCcw className="size-4" aria-hidden />
          Újrapróbálkozás
        </Button>
      </div>
    );
  }
}
