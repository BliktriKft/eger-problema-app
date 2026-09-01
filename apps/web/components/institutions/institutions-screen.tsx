'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useInstitutions } from '@/lib/api/queries/institutions';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { InstitutionCard } from './institution-card';
import { InstitutionFilter, type InstitutionFilterValue } from './institution-filter';
import { cn } from '@/lib/cn';

/**
 * InstitutionsScreen — public list of the institution catalog.
 *
 * Loads via useInstitutions(q, type).  The queryKey includes the
 * filter args so changing the input is enough to refetch.  The list is
 * paginated client-side: backend `limit` defaults to 100 which fits
 * the Eger seed (and any reasonable institution catalog).
 */
const PAGE_SIZE = 12;

export function InstitutionsScreen() {
  const [filter, setFilter] = React.useState<InstitutionFilterValue>({ q: '', type: '' });
  const [page, setPage] = React.useState(1);

  const listQuery = useInstitutions({ q: filter.q, type: filter.type || undefined });

  // Reset to first page when the filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [filter.q, filter.type]);

  const items = listQuery.data ?? [];
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4" data-testid="institutions-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Intézmények</h1>
          <p className="text-sm text-muted-foreground">
            Böngészhető katalógus az egri közintézményekről.
          </p>
        </div>
        <Link
          href="/institutions/admin"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
          data-testid="institutions-admin-link"
        >
          Admin
        </Link>
      </header>

      <InstitutionFilter
        value={filter}
        onChange={setFilter}
        resultCount={items.length}
      />

      {listQuery.isLoading ? (
        <div className="space-y-3" data-testid="institutions-loading">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton variant="text" width="50%" />
              <div className="h-2" />
              <Skeleton variant="text" width="80%" lines={2} />
            </Card>
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState
          severity="error"
          title="Nem sikerült betölteni az intézményeket."
          primaryAction={{ label: 'Újrapróbálkozás', onClick: () => listQuery.refetch() }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          variant="no-results"
          title="Nincs a keresésnek megfelelő intézmény."
          description="Próbálj másik típust vagy nevet."
          action={filter.q || filter.type ? { label: 'Szűrők törlése', onClick: () => setFilter({ q: '', type: '' }) } : undefined}
        />
      ) : (
        <>
          <div className="space-y-3" data-testid="institutions-list">
            {pageItems.map((inst) => (
              <InstitutionCard key={inst.id} institution={inst} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav
              className="flex items-center justify-between text-sm"
              aria-label="Lapozás"
              data-testid="institutions-pagination"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                data-testid="institutions-page-prev"
              >
                Előző
              </Button>
              <span className="text-xs text-muted-foreground" data-testid="institutions-page-info">
                {safePage} / {totalPages}. oldal
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                data-testid="institutions-page-next"
              >
                Következő
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}

/**
 * InstitutionsAdminScreen — same data source as the public list, but
 * exposes edit/delete actions on each row and a "create new" CTA at
 * the top.  The route handler wraps this with AdminGate so only
 * service-role / admin users reach it.
 */
export function InstitutionsAdminScreen() {
  const listQuery = useInstitutions({});

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4" data-testid="institutions-admin-screen">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Intézmények admin</h1>
          <p className="text-sm text-muted-foreground">
            Létrehozás, szerkesztés, törlés — csak admin felhasználóknak.
          </p>
        </div>
        <Link
          href="/institutions/admin/edit/new"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}
          data-testid="institutions-admin-new"
        >
          <Plus className="size-4" aria-hidden /> Új intézmény
        </Link>
      </header>

      {listQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <Skeleton variant="text" width="50%" />
              <div className="h-2" />
              <Skeleton variant="text" width="80%" lines={2} />
            </Card>
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState
          severity="error"
          title="Nem sikerült betölteni az intézményeket."
          primaryAction={{ label: 'Újrapróbálkozás', onClick: () => listQuery.refetch() }}
        />
      ) : (
        <div className="space-y-3" data-testid="institutions-admin-list">
          {(listQuery.data ?? []).map((inst) => (
            <InstitutionCard key={inst.id} institution={inst} showAdminLink />
          ))}
        </div>
      )}
    </div>
  );
}

// Re-export for callers that want the page entry point to be a named import.
export default InstitutionsScreen;