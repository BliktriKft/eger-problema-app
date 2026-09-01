'use client';

import * as React from 'react';
import { useProblemsList, useProblem } from '@/lib/api/queries/problems';
import { MOCK_PROBLEM_DETAILS } from '@/lib/mock-problems';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { USE_API } from '@/lib/env';

/**
 * ProblemsList — paginated / filterable list view backed by
 * /api/problems.  Falls back to the F2 mock dataset when USE_API is
 * false so the demo still works without env config.
 */
export function ProblemsList() {
  const listQuery = useProblemsList({});
  const items = USE_API && listQuery.data ? listQuery.data : Object.values(MOCK_PROBLEM_DETAILS);
  const isLoading = USE_API && listQuery.isLoading;
  const isError = USE_API && listQuery.isError;
  const refetch = listQuery.refetch;

  return (
    <div className="mx-auto max-w-2xl space-y-3 p-4" data-testid="problems-list">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Bejelentések</h1>
        <span className="text-sm text-muted-foreground">{items.length} db</span>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton variant="text" width="60%" />
              <div className="h-2" />
              <Skeleton variant="text" width="90%" lines={2} />
            </Card>
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          severity="error"
          title="Nem sikerült betölteni a bejelentéseket."
          description="Próbáld meg újra kicsit később."
          primaryAction={{ label: 'Újrapróbálkozás', onClick: () => refetch() }}
        />
      ) : items.length === 0 ? (
        <EmptyState variant="no-pins" />
      ) : (
        <div className="space-y-3">
          {items.map((p) => (
            <ProblemCard key={p.id} problem={p} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * ProblemDetail — fetches a single problem via /api/problems/:id.
 * Falls back to MOCK_PROBLEM_DETAILS when USE_API is false so the
 * F2 routes /problems/mock-1, /problems/mock-2, … still render the
 * seed data offline.
 */
export function ProblemDetail({ id }: { id: string }) {
  const detailQuery = useProblem(id);
  const fallback = MOCK_PROBLEM_DETAILS[id];

  // API mode: show loading / error / data from the query.
  if (USE_API) {
    if (detailQuery.isLoading) {
      return (
        <article className="mx-auto max-w-2xl space-y-4 p-4" data-testid={`problem-detail-${id}`}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="90%" lines={3} />
        </article>
      );
    }
    if (detailQuery.isError) {
      return (
        <div className="mx-auto max-w-2xl p-4" data-testid={`problem-detail-${id}`}>
          <ErrorState
            severity="error"
            title="Nem sikerült betölteni a bejelentést."
            primaryAction={{ label: 'Újrapróbálkozás', onClick: () => detailQuery.refetch() }}
          />
        </div>
      );
    }
    if (!detailQuery.data) {
      return <EmptyState variant="no-results" title="Ez a bejelentés nem található." />;
    }
    const problem = detailQuery.data;
    return (
      <article className="mx-auto max-w-2xl space-y-6 p-4" data-testid={`problem-detail-${id}`}>
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
          <p className="text-sm text-muted-foreground">
            {problem.institutionName ?? 'Eger város'} · {problem.status}
          </p>
        </header>
        <p className="text-sm leading-relaxed text-foreground">{problem.description}</p>
      </article>
    );
  }

  // Mock mode: serve the seed dataset directly.
  const problem = fallback;
  if (!problem) return <EmptyState variant="no-results" title="Ez a bejelentés nem található." />;
  return (
    <article className="mx-auto max-w-2xl space-y-6 p-4" data-testid={`problem-detail-${id}`}>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{problem.title}</h1>
        <p className="text-sm text-muted-foreground">
          {problem.institutionName ?? 'Eger város'} · {problem.status}
        </p>
      </header>
      <p className="text-sm leading-relaxed text-foreground">{problem.description}</p>
    </article>
  );
}
