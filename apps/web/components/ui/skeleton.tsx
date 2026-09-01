'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Skeleton — see `design/components/loading-state.md`.  Three variants:
 * text (single line / paragraph), circle (avatars), rect (image / map).
 * The shimmer animation comes from `tailwind.config.ts → animation.shimmer`
 * which feeds off globals.css `--muted-*` HSL channels so dark mode just
 * works without an extra class.
 */
export interface SkeletonProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'height' | 'width'> {
  variant?: 'text' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
  size?: number;
  lines?: number;
}

export function Skeleton({ className, variant = 'text', width, height, size, lines = 1, ...props }: SkeletonProps) {
  const baseClass =
    'animate-shimmer bg-gradient-to-r from-muted-200 via-muted-100 to-muted-200 bg-[length:200%_100%]';

  if (variant === 'circle') {
    const px = typeof size === 'number' ? `${size}px` : size ?? '40px';
    return <div className={cn(baseClass, 'rounded-full', className)} style={{ width: px, height: px }} aria-hidden {...props} />;
  }
  if (variant === 'rect') {
    return (
      <div
        className={cn(baseClass, 'rounded-md', className)}
        style={{ width: width ?? '100%', height: typeof height === 'number' ? `${height}px` : height ?? '120px' }}
        aria-hidden
        {...props}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={cn('space-y-2', className)}
      {...props}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(baseClass, 'h-3 rounded')}
          style={{ width: i === lines - 1 && typeof width !== 'undefined' ? (typeof width === 'number' ? `${width}px` : width) : width ?? '100%' }}
        />
      ))}
    </div>
  );
}

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  const px = { sm: 16, md: 24, lg: 32 }[size];
  return (
    <div role="status" aria-label={label ?? 'Betöltés folyamatban'} className={cn('inline-flex items-center gap-2', className)}>
      <span
        className="inline-block rounded-full border-2 border-ring border-t-transparent animate-spin"
        style={{ width: px, height: px }}
        aria-hidden
      />
      {label ? <span className="text-sm text-muted-foreground">{label}</span> : null}
    </div>
  );
}
