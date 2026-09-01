'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Button — backed by shadcn/ui's Slot for `asChild` composition, but
 * variants/sizes are mapped against the design tokens defined in
 * `design/components/button.md`.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 gap-2',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-fg hover:bg-primary-600 active:bg-primary-700',
        secondary:
          'bg-secondary text-secondary-fg hover:bg-secondary-600 active:bg-secondary-700',
        accent:
          'bg-accent text-accent-fg hover:bg-accent-600 active:bg-accent-700',
        outline:
          'border border-border bg-background hover:bg-muted-100 hover:text-foreground',
        ghost: 'bg-transparent hover:bg-muted-100 text-foreground',
        destructive:
          'bg-destructive text-destructive-fg hover:bg-destructive-600 active:bg-destructive-700',
        link: 'text-secondary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span className="inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
        ) : null}
        {children}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
