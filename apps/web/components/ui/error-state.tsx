'use client';

import * as React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ErrorState — see `design/components/error-state.md`.  Three variants:
 * full (page-level), inline (within a card), and toast (delegated to our
 * toast provider — see `components/ui/toaster.tsx`).
 */

type Severity = 'info' | 'success' | 'warning' | 'error';
type Mode = 'full' | 'inline';

const ICON: Record<Severity, LucideIcon> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const SURFACE: Record<Severity, string> = {
  info: 'border-secondary-200 bg-secondary-50 text-secondary-900',
  success: 'border-success-200 bg-success-50 text-success-900',
  warning: 'border-warning-200 bg-warning-50 text-warning-900',
  error: 'border-destructive bg-destructive text-destructive-fg',
};

export interface ErrorStateProps {
  severity: Severity;
  variant?: Mode;
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick?: () => void; href?: string };
  secondaryAction?: { label: string; onClick?: () => void; href?: string };
  className?: string;
  children?: React.ReactNode;
}

export function ErrorState({
  severity,
  variant = 'full',
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  children,
}: ErrorStateProps) {
  const Icon = ICON[severity];
  if (variant === 'inline') {
    return (
      <div
        role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
        className={cn(
          'flex items-start gap-3 rounded-md border p-3 text-sm',
          SURFACE[severity],
          className,
        )}
      >
        <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-medium">{title}</p>
          {description ? <p className="mt-1 text-xs opacity-90">{description}</p> : null}
          {(primaryAction || secondaryAction) ? (
            <div className="mt-2 flex gap-2">
              {primaryAction ? renderAction(primaryAction, 'primary') : null}
              {secondaryAction ? renderAction(secondaryAction, 'outline') : null}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    );
  }
  return (
    <div
      role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
      aria-live={severity === 'error' ? 'assertive' : 'polite'}
      className={cn('mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center', className)}
    >
      <div className="rounded-full bg-destructive-50 p-4" aria-hidden>
        <Icon className="size-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {(primaryAction || secondaryAction) ? (
        <div className="mt-2 flex gap-2">
          {primaryAction ? renderAction(primaryAction, 'primary') : null}
          {secondaryAction ? renderAction(secondaryAction, 'outline') : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}

function renderAction(
  a: { label: string; onClick?: () => void; href?: string },
  variant: 'primary' | 'outline',
) {
  const cls = cn(
    'inline-flex h-10 items-center rounded-md px-4 text-sm font-medium transition-colors',
    variant === 'primary'
      ? 'bg-primary text-primary-fg hover:bg-primary-600'
      : 'border border-border bg-background hover:bg-muted-100',
  );
  return a.href ? (
    <a href={a.href} className={cls}>
      {a.label}
    </a>
  ) : (
    <button type="button" onClick={a.onClick} className={cls}>
      {a.label}
    </button>
  );
}
