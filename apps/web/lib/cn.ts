import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Class-name composer used everywhere shadcn/ui primitives live. We
 * merge Tailwind classes with `tailwind-merge` so callers can override
 * defaults (`<Button className="bg-red-500">` beats `bg-primary`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
