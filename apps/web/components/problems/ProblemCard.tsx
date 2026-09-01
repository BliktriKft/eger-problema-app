import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryLabel } from '@/components/ui/empty-state';
import { VoteButtons } from '@/components/voting/VoteButtons';
import type { Problem, ProblemMarker } from '@/types';

/**
 * ProblemCard — one row in the list view.  Built on top of the Card
 * primitive; `interactive` wraps the whole card in a Link so a click
 * anywhere on it routes to /problems/:id (the VoteButtons stop
 * propagation to keep their own clicks intact).
 */
export interface ProblemCardProps {
  problem: Problem | ProblemMarker;
  showVote?: boolean;
}

export function ProblemCard({ problem, showVote = true }: ProblemCardProps) {
  return (
    <Link
      href={`/problems/${problem.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      data-testid={`problem-card-${problem.id}`}
    >
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">{problem.title}</h3>
            <p className="text-xs text-muted-foreground">
              {('institutionName' in problem && problem.institutionName) || 'Eger város'} · {(problem as Problem).status}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            <CategoryLabel value={problem.category} />
          </Badge>
        </CardHeader>
        {'description' in problem ? (
          <CardContent>
            <p className="line-clamp-2 text-sm text-muted-foreground">{problem.description}</p>
          </CardContent>
        ) : null}
        {showVote ? (
          <CardFooter className="justify-end">
            <span onClick={(e) => e.stopPropagation()}>
              <VoteButtons problemId={problem.id} initialScore={problem.score} variant="compact" size="sm" />
            </span>
          </CardFooter>
        ) : null}
      </Card>
    </Link>
  );
}
