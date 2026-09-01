'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/cn';
import { castVote, getProblem, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/components/ui/toaster';
import type { VoteState } from '@/lib/vote-state';
import { computeVoteState } from '@/lib/vote-state';

/**
 * VoteButtons — see `design/components/vote-buttons.md`.
 *
 * MVP wiring:
 *  - One optimistic update (state + score) per click.
 *  - 401 nudges the user to login (no visual rollback; we keep the
 *    optimistic state so it fires the moment auth returns).
 *  - Other errors roll back and surface a toast.
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
  const qc = useQueryClient();

  const [state, setState] = React.useState<VoteState>(initialState);
  const [score, setScore] = React.useState<number>(initialScore);
  const [bumpKey, setBumpKey] = React.useState(0);

  // Re-sync from a fresh server response when the cache invalidates.
  const problemQuery = useQuery({
    queryKey: ['problem', problemId],
    queryFn: () => getProblem(problemId, session?.access_token ?? null),
    enabled: false,
  });

  React.useEffect(() => {
    if (problemQuery.data) {
      setScore(problemQuery.data.score);
      setState(computeVoteState(problemQuery.data));
    }
  }, [problemQuery.data]);

  const mutation = useMutation({
    mutationFn: async (value: 1 | -1) => {
      if (!session?.access_token) throw new ApiError(401, null, 'Bejelentkezés szükséges');
      return castVote(problemId, value, session.access_token);
    },
    onMutate: async (value) => {
      // Optimistic
      const next: VoteState = state === (value === 1 ? 'upvoted' : 'downvoted') ? 'neutral' : value === 1 ? 'upvoted' : 'downvoted';
      const delta = next === 'neutral' ? (state === 'upvoted' ? -1 : state === 'downvoted' ? 1 : 0) : (next === 'upvoted' ? 1 : -1) - (state === 'upvoted' ? 1 : state === 'downvoted' ? -1 : 0);
      const prevState = state;
      const prevScore = score;
      setState(next);
      setScore((s) => s + delta);
      setBumpKey((k) => k + 1);
      return { prevState, prevScore };
    },
    onError: (err, _value, ctx) => {
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
      // rollback
      if (ctx) {
        setState(ctx.prevState);
        setScore(ctx.prevScore);
      }
    },
    onSuccess: (data) => {
      setScore(data.score);
      qc.invalidateQueries({ queryKey: ['problem', problemId] });
    },
  });

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
    mutation.mutate(value);
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
