'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Building2, ExternalLink, MapPin } from 'lucide-react';
import { useInstitution } from '@/lib/api/queries/institutions';
import { useProblemsList } from '@/lib/api/queries/problems';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ProblemCard } from '@/components/problems/ProblemCard';
import { INSTITUTION_TYPE_LABELS_HU } from '@/types';
import { USE_API } from '@/lib/env';
import { MOCK_PROBLEM_DETAILS } from '@/lib/mock-problems';
import { cn } from '@/lib/cn';

// Client-only map (Leaflet touches window at import time).
const MapShell = dynamic(
  () => import('@/components/map/MapShell').then((m) => m.MapShell),
  {
    ssr: false,
    loading: () => <Skeleton variant="rect" className="h-48 w-full rounded-md" />,
  },
);

export interface InstitutionDetailProps {
  id: string;
}

/**
 * InstitutionDetail — full page for one institution. Layout:
 *   1. Header: name + type badge + back link
 *   2. Address + map snippet
 *   3. Official URL (if any)
 *   4. Related problems list (filtered by institutionId)
 */
export function InstitutionDetail({ id }: InstitutionDetailProps) {
  const detail = useInstitution(id);
  const related = useProblemsList({ institutionId: id });

  // In mock mode the problems list query may return empty (no institutionId links in seed),
  // so fall back to filtering the local mock dataset for a sensible demo.
  const fallbackRelated = React.useMemo(() => {
    if (USE_API) return [];
    return Object.values(MOCK_PROBLEM_DETAILS).filter((p) => p.institutionId === id);
  }, [id]);

  if (detail.isLoading) {
    return (
      <article className="mx-auto max-w-2xl space-y-4 p-4" data-testid={`institution-detail-${id}`}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" lines={2} />
        <Skeleton variant="rect" className="h-40 w-full rounded-md" />
      </article>
    );
  }
  if (detail.isError) {
    return (
      <div className="mx-auto max-w-2xl p-4" data-testid={`institution-detail-${id}`}>
        <ErrorState
          severity="error"
          title="Nem sikerült betölteni az intézményt."
          primaryAction={{ label: 'Újrapróbálkozás', onClick: () => detail.refetch() }}
        />
      </div>
    );
  }
  if (!detail.data) {
    return <EmptyState variant="no-results" title="Ez az intézmény nem található." />;
  }

  const institution = detail.data;

  const relatedItems =
    USE_API && related.data ? related.data : fallbackRelated;

  return (
    <article className="mx-auto max-w-2xl space-y-6 p-4" data-testid={`institution-detail-${id}`}>
      <div>
        <Link
          href="/institutions"
          className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-1')}
          data-testid="institution-detail-back"
        >
          <ArrowLeft className="size-3" aria-hidden /> Vissza a katalógushoz
        </Link>
      </div>

      <header className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary" aria-hidden>
            <Building2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">{institution.name}</h1>
            <p className="text-sm text-muted-foreground">
              <Badge variant="outline" className="mr-2 align-middle">
                {INSTITUTION_TYPE_LABELS_HU[institution.type]}
              </Badge>
            </p>
          </div>
        </div>
      </header>

      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <MapPin className="size-4" aria-hidden /> Cím és helyszín
          </h2>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{institution.address}</p>
          <MapShell
            markers={[
              {
                id: institution.id,
                title: institution.name,
                category: 'institution',
                status: 'open',
                latitude: institution.latitude,
                longitude: institution.longitude,
                score: 0,
              },
            ]}
            center={[institution.latitude, institution.longitude]}
            zoom={16}
            selectedId={institution.id}
            className="h-48 w-full overflow-hidden rounded-md"
          />
          <p className="font-mono text-xs text-muted-foreground">
            {institution.latitude.toFixed(5)}, {institution.longitude.toFixed(5)}
          </p>
        </CardContent>
      </Card>

      {institution.officialUrl ? (
        <Card>
          <CardHeader>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ExternalLink className="size-4" aria-hidden /> Hivatalos weboldal
            </h2>
          </CardHeader>
          <CardContent>
            <a
              href={institution.officialUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="break-all text-sm text-secondary underline-offset-4 hover:underline"
            >
              {institution.officialUrl}
            </a>
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3" aria-labelledby="related-problems-heading">
        <div className="flex items-center justify-between">
          <h2 id="related-problems-heading" className="text-lg font-semibold tracking-tight">
            Kapcsolódó bejelentések
          </h2>
          <span className="text-xs text-muted-foreground" data-testid="institution-related-count">
            {relatedItems.length} db
          </span>
        </div>
        {relatedItems.length === 0 ? (
          <EmptyState
            variant="no-pins"
            title="Még nincs bejelentés ehhez az intézményhez."
            description="Ha látsz valami problémát, jelentsd be a térképen."
          />
        ) : (
          <div className="space-y-3" data-testid="institution-related-list">
            {relatedItems.map((p) => (
              <ProblemCard key={p.id} problem={p} showVote />
            ))}
          </div>
        )}
      </section>

      <div className="flex justify-end pt-2">
        <Link
          href={`/submit?institution=${encodeURIComponent(institution.id)}`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          data-testid="institution-submit-link"
        >
          Bejelentés az intézményhez
        </Link>
      </div>
    </article>
  );
}