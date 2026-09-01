'use client';

import * as React from 'react';
import { create } from '@/lib/toast-store';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport, type ToastVariant } from './toast';

/**
 * Top-level provider — wrap the root once. Holds the queue of active toasts
 * inside a tiny pub-sub store so component consumers don't have to plumb
 * the list through context explicitly.
 */
export function Toaster() {
  const { toasts } = create.useToasts();
  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant ?? 'default'} open={t.open} onOpenChange={(open) => !open && create.dismiss(t.id)} duration={t.duration}>
          <div className="grid gap-1">
            {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
            {t.description ? <ToastDescription>{t.description}</ToastDescription> : null}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}

// Convenience helpers — see `lib/toast-store.ts`.
export type ToastInput = { title?: string; description?: string; variant?: ToastVariant; duration?: number };

export const toast = Object.assign(
  (args: ToastInput) => {
    create.push(args);
  },
  {
    success: (description: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      create.push({ variant: 'success', description, ...opts }),
    error: (description: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      create.push({ variant: 'destructive', description, duration: opts?.duration ?? 8000, ...opts }),
    warning: (description: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      create.push({ variant: 'warning', description, ...opts }),
    info: (description: string, opts?: Omit<ToastInput, 'variant' | 'description'>) =>
      create.push({ variant: 'info', description, ...opts }),
    dismiss: (id: string) => create.dismiss(id),
  },
);
