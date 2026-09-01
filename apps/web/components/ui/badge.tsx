'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-fg hover:bg-primary-600',
        secondary: 'border-transparent bg-secondary text-secondary-fg hover:bg-secondary-600',
        accent: 'border-transparent bg-accent text-accent-fg',
        outline: 'text-foreground border-border',
        success: 'border-transparent bg-success text-success-fg',
        warning: 'border-transparent bg-warning text-warning-fg',
        destructive: 'border-transparent bg-destructive text-destructive-fg',
        muted: 'border-transparent bg-muted-100 text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
