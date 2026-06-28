import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * skeletonBase - the full literal class string for the loading placeholder (spec 0018). A
 * `muted`-filled, `rounded-md` block that pulses while content loads. Every class is a FULL
 * LITERAL so Tailwind v4's source scanner emits each utility - never build a class name
 * dynamically. There is no `dark:` here: light/dark flips automatically through the token
 * layer (spec 0004).
 *
 * Fill is `bg-muted-raised`, NOT `bg-muted`: in dark, base `muted` collapses to the same
 * `stone.900` as `surface`, so a skeleton on a card/panel would be invisible. `muted-raised`
 * (stone.100 / stone.700) steps off BOTH the page canvas and a raised surface in either theme,
 * so the placeholder is always visible (feedback 0006 - a "one step off the surface" fill).
 *
 * `animate-pulse` is the pulse; `motion-reduce:animate-none` stills it for readers who set
 * `prefers-reduced-motion: reduce`, leaving a static block. Shape and size are NOT baked in -
 * the caller drives them through `className` (`h-4 w-32` for a text line, `h-10 w-10
 * rounded-full` for an avatar), which `cn()` merges over this base.
 */
const skeletonBase = 'animate-pulse rounded-md bg-muted-raised motion-reduce:animate-none';

/**
 * SkeletonProps - the native `<div>` attributes, verbatim. Skeleton adds no bespoke props
 * (shape/size arrive via `className`), so this is a pass-through. It stays an `interface`
 * (not a `type` alias) because `react/prop-types` only resolves the spread-prop members
 * through an interface's `extends`; the resulting "empty interface" is therefore intentional.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see JSDoc: interface is required for react/prop-types resolution
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Skeleton - the canopy loading-placeholder Seed (spec 0018), built on the 0005 component
 * recipe: semantic-token utilities, `cn()` class merge, `forwardRef`, and a full spread of
 * native `<div>` props. It holds layout while content fetches and composes into any shape
 * (text lines, circles, cards) through the caller's `className`.
 *
 * Decorative by default: `aria-hidden="true"` so assistive tech skips the placeholder - the
 * surrounding loading *region* announces busy-ness (e.g. `aria-busy`), not the skeleton.
 * Because the spread follows the default, a caller can still override it (`aria-hidden={false}`)
 * when a bare skeleton needs to be perceivable. Themed entirely by tokens - no per-component
 * theme code.
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} aria-hidden="true" className={cn(skeletonBase, className)} {...props} />;
  },
);
Skeleton.displayName = 'Skeleton';
