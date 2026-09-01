'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { listProblems, getProblem } from '@/lib/api';
import { MOCK_PROBLEMS, MOCK_PROBLEM_DETAILS } from '@/lib/mock-problems';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export function ProblemsList() {
  const { isConfigured, session } = useAuth();

  const problemsQuery = useQuery({
    queryKey: ['problems', { all: true }],
    queryFn: () => listProblems({}, session?.access_token ?? null),
    enabled: isConfigured,
    staleTime: 30_000,
  });

  const items = isConfigured && problemsQuery.data ? problemsQuery.data : MOCK_PROBLEMS;
  const isLoading = isConfigured && problemsQuery.isLoading;
  const isError = isConfigured && problemsQuery.isError;

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
        <EmptyState variant="error" title="Nem sikerült betölteni a bejelentéseket." />
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

export function ProblemDetail({ id }: { id: string }) {
  const { isConfigured, session } = useAuth();

  const q = useQuery({
    queryKey: ['problem', id],
    queryFn: () => getProblem(id, session?.access_token ?? null),
    enabled: isConfigured,
    initialData: MOCK_PROBLEM_DETAILS[id] ?? undefined,
  });

  const problem = q.data ?? MOCK_PROBLEM_DETAILS[id];
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
