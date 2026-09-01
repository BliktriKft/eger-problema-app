'use client';

import * as React from 'react';
import {
  PROBLEM_CATEGORY_LABELS_HU,
  PROBLEM_STATUS_LABELS_HU,
  type ProblemCategory,
} from '@/types';
import { MapPin, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * EmptyState — see `design/components/empty-state.md`.  We intentionally
 * use lucide icons (per the design spec) because the real illustrations
 * haven't been drawn yet (out of MVP scope, see the plan).
 */

type Variant = 'no-results' | 'no-pins' | 'no-votes' | 'no-ai' | 'error' | 'first-time';

const DEFAULT_TITLE: Record<Variant, string> = {
  'no-results': 'Nincs a keresésnek megfelelő probléma.',
  'no-pins': 'Ebben a körzetben még nincs bejelentés.',
  'no-votes': 'Még nem szavaztál semmire.',
  'no-ai': 'Erről a problémáról még nincs AI-wiki.',
  'error': 'Valami elromlott. Próbáld újra.',
  'first-time': 'Üdv Egerben! Jelentsd az első problémát.',
};

const DEFAULT_DESC: Record<Variant, string> = {
  'no-results': 'Próbálj más szűrőket vagy nagyíts a térképen.',
  'no-pins': 'Legyen az első, aki bejelentést tesz.',
  'no-votes': 'Fedezd fel a térképet és szavazz a számodra fontos ügyekre.',
  'no-ai': 'Az AI-wiki automatikusan készül, amint elég szavazat gyűlik össze.',
  'error': 'Ellenőrizd az internetkapcsolatod, vagy próbáld újra később.',
  'first-time': 'Egy kattintás a térképen, és már be is jelentheted.',
};

const ICON_FOR: Record<Variant, LucideIcon> = {
  'no-results': MapPin,
  'no-pins': MapPin,
  'no-votes': MapPin,
  'no-ai': MapPin,
  'error': MapPin,
  'first-time': MapPin,
};

export interface EmptyStateProps {
  variant: Variant;
  title?: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ variant, title, description, action, className, children }: EmptyStateProps) {
  const Icon = ICON_FOR[variant];
  return (
    <div
      className={cn(
        'mx-auto flex max-w-md flex-col items-center text-center gap-3 p-8',
        'rounded-lg border border-dashed border-border bg-muted-50',
        className,
      )}
      role="status"
      data-variant={variant}
    >
      <div className="rounded-full bg-muted-100 p-4" aria-hidden>
        <Icon className="size-6 text-muted-500" />
      </div>
      <h2 className="text-lg font-semibold leading-snug">
        {title ?? DEFAULT_TITLE[variant]}
      </h2>
      {description !== null ? (
        <p className="text-sm text-muted-foreground">{description ?? DEFAULT_DESC[variant]}</p>
      ) : null}
      {action ? (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-600"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-fg hover:bg-primary-600"
          >
            {action.label}
          </button>
        )
      ) : null}
      {children}
    </div>
  );
}

/**
 * CategoryLabel — convenience helper used in list rows and the map popup.
 * Keeps "infrastructure" → "Infrastruktúra" mapping out of feature code.
 */
export function CategoryLabel({ value, className }: { value: ProblemCategory; className?: string }) {
  return <span className={className}>{PROBLEM_CATEGORY_LABELS_HU[value]}</span>;
}

/**
 * StatusLabel — same pattern as CategoryLabel for ProblemStatus.
 */
export function StatusLabel({ value, className }: { value: keyof typeof PROBLEM_STATUS_LABELS_HU; className?: string }) {
  return <span className={className}>{PROBLEM_STATUS_LABELS_HU[value]}</span>;
}
