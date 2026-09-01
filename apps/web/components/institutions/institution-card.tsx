'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, ExternalLink, MapPin } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { INSTITUTION_TYPE_LABELS_HU, type Institution } from '@/types';

/**
 * InstitutionCard — one row in the institution catalog.
 *
 * Mirrors the ProblemCard layout (see design/components/card.md). The
 * whole card is a Link to /institutions/:id so a click anywhere opens
 * the detail page.
 */
export interface InstitutionCardProps {
  institution: Institution;
  /** When true, render the "Szerkesztés" admin action in the footer. */
  showAdminLink?: boolean;
  /** Optional problem count to surface in the footer. */
  problemCount?: number;
}

export function InstitutionCard({ institution, showAdminLink = false, problemCount }: InstitutionCardProps) {
  return (
    <Link
      href={`/institutions/${institution.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      data-testid={`institution-card-${institution.id}`}
    >
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary" aria-hidden>
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold">{institution.name}</h3>
              <p className="line-clamp-1 text-xs text-muted-foreground">
                <MapPin className="mr-0.5 inline-block size-3 align-middle" aria-hidden />
                <span className="align-middle">{institution.address}</span>
              </p>
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">
            {INSTITUTION_TYPE_LABELS_HU[institution.type]}
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {institution.officialUrl ? (
              <span className="inline-flex items-center gap-1">
                <ExternalLink className="size-3" aria-hidden />
                <span className="truncate">{institution.officialUrl.replace(/^https?:\/\//, '')}</span>
              </span>
            ) : (
              'Nincs hivatalos weboldal megadva.'
            )}
          </p>
        </CardContent>
        {(showAdminLink || typeof problemCount === 'number') && (
          <CardFooter className="justify-between gap-2 text-xs text-muted-foreground">
            {typeof problemCount === 'number' ? (
              <span data-testid={`institution-problem-count-${institution.id}`}>
                {problemCount} kapcsolódó bejelentés
              </span>
            ) : (
              <span />
            )}
            {showAdminLink ? (
              <span
                className="text-secondary underline-offset-4 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = `/institutions/admin/edit/${institution.id}`;
                }}
              >
                Szerkesztés
              </span>
            ) : null}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}