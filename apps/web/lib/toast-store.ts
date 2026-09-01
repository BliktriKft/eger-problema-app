'use client';

import { useSyncExternalStore } from 'react';
import type { ToastVariant } from '@/components/ui/toast';

/**
 * Tiny pub-sub store for the toast queue.  We hand-roll it (instead of
 * pulling in zustand / jotai) because the entire surface is five
 * functions and `useSyncExternalStore` keeps re-renders surgical.
 */

interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
  open: boolean;
}

type Listener = () => void;

let toasts: ToastItem[] = [];
const listeners = new Set<Listener>();

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function getSnapshot() {
  return toasts;
}

function notify() {
  for (const l of listeners) l();
}

let counter = 0;

export const create = {
  push(input: { title?: string; description?: string; variant?: ToastVariant; duration?: number }) {
    const id = `t-${Date.now()}-${counter++}`;
    toasts = [...toasts, { ...input, id, open: true }];
    notify();
    return id;
  },
  dismiss(id: string) {
    toasts = toasts.map((t) => (t.id === id ? { ...t, open: false } : t));
    notify();
    // Drop the toast from the list after the close animation finishes.
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 250);
  },
  useToasts() {
    return {
      toasts: useSyncExternalStore(subscribe, getSnapshot, getSnapshot),
    };
  },
};
