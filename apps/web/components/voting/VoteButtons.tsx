'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useProblem, useVote } from '@/lib/api/queries/problems';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth-context';
import { USE_API } from '@/lib/env';
import { toast } from '@/components/ui/toaster';
import { cn } from '@/lib/cn';
import type { VoteState } from '@/lib/vote-state';
import { computeVoteState } from '@/lib/vote-state';

/**
 * VoteButtons — see `design/components/vote-buttons.md`.
 *
 * MVP wiring:
 *  - One optimistic update (state + score) per click via the useVote hook.
 *  - 401 nudges the user to login (no visual rollback; we keep the
 *    optimistic state so it fires the moment auth returns).
 *  - Other errors roll back and surface a toast.
 *  - The server-side problem is re-fetched via useProblem in API mode so
 *    the score converges with the server's authoritative state.
 */

export interface VoteButtonsProps {
  problemId: string;
  initialScore: number;
  /** Initial vote state for the current user (server-side inferred). */
  initialState?: VoteState;
  variant?: 'expanded' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function VoteButtons({
  problemId,
  initialScore,
  initialState = 'neutral',
  variant = 'expanded',
  size = 'md',
  disabled,
  className,
}: VoteButtonsProps) {
  const { isAuthenticated, isConfigured, session } = useAuth();

  const [state, setState] = React.useState<VoteState>(initialState);
  const [score, setScore] = React.useState<number>(initialScore);
  const [bumpKey, setBumpKey] = React.useState(0);

  // Re-sync from a fresh server response (API mode only).
  const problemQuery = useProblem(USE_API ? problemId : null);
  React.useEffect(() => {
    if (problemQuery.data) {
      setScore(problemQuery.data.score);
      setState(computeVoteState(problemQuery.data));
    }
  }, [problemQuery.data]);

  const vote = useVote(problemId);

  function click(value: 1 | -1) {
    if (disabled) return;
    if (!isConfigured) {
      toast.warning('A Supabase nincs bekötve — adj meg env változókat a szavazáshoz.');
      return;
    }
    if (!isAuthenticated) {
      toast.warning('A szavazáshoz jelentkezz be.');
      return;
    }
    // Optimistic UI bump happens here — we touch state/score before the
    // network call so the click feels instant; useVote's onMutate
    // mirrors the score into the cached Problem so any sibling views
    // see the new value too.
    const next: VoteState =
      state === (value === 1 ? 'upvoted' : 'downvoted')
        ? 'neutral'
        : value === 1
        ? 'upvoted'
        : 'downvoted';
    const prevScore = score;
    const delta =
      next === 'neutral'
        ? state === 'upvoted'
          ? -1
          : state === 'downvoted'
          ? 1
          : 0
        : next === 'upvoted'
        ? 1 - (state === 'upvoted' ? 1 : state === 'downvoted' ? -1 : 0)
        : -1 - (state === 'upvoted' ? 1 : state === 'downvoted' ? -1 : 0);
    setState(next);
    setScore((s) => s + delta);
    setBumpKey((k) => k + 1);

    vote.mutate(value, {
      onSuccess: (data: { score: number }) => {
        setScore(data.score);
      },
      onError: (err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          toast({
            title: 'A szavazáshoz jelentkezz be.',
            description: 'A Google/Apple gombbal 1 kattintás.',
            variant: 'warning',
          });
          return;
        }
        toast({
          title: 'Nem sikerült rögzíteni a szavazatod.',
          description: err instanceof ApiError ? `${err.status} ${err.message}` : undefined,
          variant: 'destructive',
        });
        // rollback to the value we had before the click
        setScore(prevScore);
      },
    });
  }

  const isCompact = variant === 'compact';
  const btnSize = { sm: 'size-8', md: 'size-10', lg: 'size-12' }[size];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-background p-1',
        isCompact ? 'flex-row' : 'flex-col',
        className,
      )}
      data-testid="vote-buttons"
      data-state={state}
    >
      <button
        type="button"
        onClick={() => click(1)}
        aria-label={score !== undefined ? `Upvote, jelenlegi pontszám ${score}` : 'Upvote'}
        aria-pressed={state === 'upvoted'}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          btnSize,
          state === 'upvoted'
            ? 'bg-primary text-primary-fg hover:bg-primary-600'
            : 'bg-transparent text-muted-foreground hover:bg-muted-100',
        )}
        data-testid="vote-up"
      >
        <ArrowUp className="size-4" aria-hidden />
      </button>
      <span
        key={bumpKey}
        className={cn(
          'min-w-8 text-center font-semibold tabular-nums',
          size === 'lg' ? 'text-xl' : 'text-base',
          state === 'upvoted' && 'text-primary',
          state === 'downvoted' && 'text-destructive',
          state === 'neutral' && 'text-muted-foreground',
          bumpKey > 0 && 'animate-vote-bump',
        )}
        data-testid="vote-score"
      >
        {score > 0 ? `+${score}` : score}
      </span>
      <button
        type="button"
        onClick={() => click(-1)}
        aria-label={score !== undefined ? `Downvote, jelenlegi pontszám ${score}` : 'Downvote'}
        aria-pressed={state === 'downvoted'}
        className={cn(
          'inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          btnSize,
          state === 'downvoted'
            ? 'bg-destructive text-destructive-fg hover:bg-destructive-600'
            : 'bg-transparent text-muted-foreground hover:bg-muted-100',
        )}
        data-testid="vote-down"
      >
        <ArrowDown className="size-4" aria-hidden />
      </button>
    </div>
  );
}
