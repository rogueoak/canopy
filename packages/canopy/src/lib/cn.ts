import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Canopy's Roots typography ROLES (spec 0004) - `text-display`, `text-h1`…`text-h4`,
 * `text-body`, `text-body-sm`, `text-label`, `text-caption`, `text-code`. Each is a composite
 * `text-*` utility that sets font-size / line-height / font-weight (NOT colour).
 *
 * Out of the box tailwind-merge does not know these custom values, so it misclassifies a role
 * like `text-label` into the `text-color` group - where it then conflicts with a genuine colour
 * utility such as `text-text` and one of the two is silently dropped. Registering the roles in
 * the `font-size` group (Tailwind's home for the `text-<size>` axis) teaches the merge that a
 * role and a colour are orthogonal, so a Seed can carry both (e.g. Label's `text-label text-text`)
 * and a caller can still override either axis independently. Label is the first Seed to pair a
 * role with a colour, so it is the first to need this.
 */
const TYPOGRAPHY_ROLES = [
  'display',
  'h1',
  'h2',
  'h3',
  'h4',
  'body',
  'body-sm',
  'label',
  'caption',
  'code',
];

/**
 * `surface-raised` (spec 0073) paints a background AND re-points the control vars for its subtree,
 * so it is a custom `@utility` rather than a generated `bg-*` colour. tailwind-merge keys on the
 * class NAME, so out of the box it does not know this one sets a background: a caller passing
 * `bg-muted` to a component defaulting to `surface-raised` would keep BOTH, leaving the winner to
 * stylesheet order rather than to the caller. Registering it in the `background-color` group makes
 * the caller win, which is the whole contract of `cn()`.
 *
 * Same failure mode as the typography roles above, one property along.
 */
const SURFACE_CONTEXTS = ['surface-raised'];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: TYPOGRAPHY_ROLES }],
      'bg-color': SURFACE_CONTEXTS,
    },
  },
});

/**
 * cn - the canopy class-name merge util (the shadcn convention).
 *
 * `clsx` resolves conditional/array/object class inputs into a string, then
 * `tailwind-merge` de-dupes conflicting Tailwind utilities (last one wins), so a
 * caller's `className` can always override a component's defaults. Every Seed merges
 * its cva output and incoming `className` through this. The merge is extended to know
 * Canopy's Roots typography roles (see `TYPOGRAPHY_ROLES`) so a role and a colour never
 * collide.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
