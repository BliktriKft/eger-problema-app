'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

/**
 * Card — see `design/components/card.md`.  All sub-components are
 * optional; the only places we need them are list rows and detail
 * headers.
 */
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'elevated' | 'outlined' | 'flat' | 'accent' | 'destructive';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}>(({ className, variant = 'default', padding = 'md', ...props }, ref) => {
  const variantClass = {
    default: 'bg-card border border-border shadow-sm',
    elevated: 'bg-card shadow-md',
    outlined: 'bg-background border border-border',
    flat: 'bg-muted-100',
    accent: 'bg-accent-50 border border-accent-200',
    destructive: 'bg-destructive-50 border border-destructive-200',
  }[variant];
  const paddingClass = { sm: 'p-3', md: 'p-4', lg: 'p-6', none: 'p-0' }[padding];
  return <div ref={ref} className={cn('rounded-lg text-card-foreground', variantClass, paddingClass, className)} {...props} />;
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-lg font-semibold leading-snug', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-3', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex items-center pt-3', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
