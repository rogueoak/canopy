import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn — the canopy class-name merge util (the shadcn convention).
 *
 * `clsx` resolves conditional/array/object class inputs into a string, then
 * `tailwind-merge` de-dupes conflicting Tailwind utilities (last one wins), so a
 * caller's `className` can always override a component's defaults. Every Seed merges
 * its cva output and incoming `className` through this.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
