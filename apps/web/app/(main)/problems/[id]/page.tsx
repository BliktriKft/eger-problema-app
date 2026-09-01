import { ProblemDetail } from '@/components/problems/ProblemsScreen';
import { VoteButtons } from '@/components/voting/VoteButtons';
import { WikiSection } from '@/components/wiki/WikiSection';
import { MOCK_PROBLEM_DETAILS } from '@/lib/mock-problems';
import { MapShell } from '@/components/map/MapShell';

export const dynamic = 'force-dynamic';

export default function ProblemDetailPage({ params }: { params: { id: string } }) {
  const fallback = MOCK_PROBLEM_DETAILS[params.id];
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <ProblemDetail id={params.id} />

      {fallback ? (
        <div className="rounded-lg border border-border bg-muted-50 p-3">
          <p className="mb-2 text-xs text-muted-foreground">Helyszín a térképen</p>
          <MapShell
            markers={[{ ...fallback }]}
            center={[fallback.latitude, fallback.longitude]}
            zoom={16}
            selectedId={fallback.id}
            className="h-72 w-full overflow-hidden rounded-md"
          />
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <VoteButtons problemId={params.id} initialScore={fallback?.score ?? 0} size="lg" />
        <span className="text-sm text-muted-foreground">Szavazz a probléma fontosságára</span>
      </div>

      <WikiSection problemId={params.id} />
    </div>
  );
}
