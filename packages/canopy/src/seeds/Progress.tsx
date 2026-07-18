import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * progressVariants - the cva recipe that maps `size` onto the track height (spec 0037),
 * following the 0005 Button recipe. All class strings are FULL LITERALS so Tailwind v4's source
 * scanner emits each utility - never build a class name dynamically. There is no `dark:` here:
 * the track fills with `bg-muted` and re-themes through the token layer (spec 0004) for free.
 *
 * The track is `bg-muted`, `rounded-full`, and `overflow-hidden` so the indicator's fill is
 * clipped to the rounded shape. `size` drives only the track height (`sm` / `md`).
 */
export const progressVariants = cva(
  // Base - shared by every size. A full-width rounded track that clips its indicator.
  'relative w-full overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'h-1.5',
        md: 'h-2.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface ProgressProps
  extends
    React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {}

/**
 * Progress - the canopy determinate progress-bar Seed (spec 0037), the determinate sibling to
 * Spinner (0017). For bounded, measurable tasks - "43% uploaded", step 2 of 4, a storage meter -
 * where a consumer needs to show *how far along* a task is, not just that it is busy. Built on
 * `@radix-ui/react-progress`, so it ships the correct `role="progressbar"` and Radix owns the
 * value clamping and the `aria-valuenow` / `aria-valuemin` / `aria-valuemax` attributes (and
 * correctly omits `aria-valuenow` in the indeterminate state).
 *
 * Styled entirely with semantic-token utilities (spec 0005 recipe) - all FULL LITERALS so
 * Tailwind v4's source scanner emits each one. No `dark:`: light/dark flips through the token
 * layer (spec 0004). The track is `bg-muted`; the indicator is `bg-primary`. `forwardRef` forwards
 * to the Root, full native prop spread, and `cn()` merge (caller `className` wins) follow the
 * recipe.
 *
 * Determinate: pass a `value` (0-100) and the indicator fills proportionally - it is translated
 * left by `100 - clamped` percent, an inline per-instance style value (NOT a Tailwind class, so it
 * is safe from the scanner). The value is clamped to 0-100 first: Radix *nullifies* (does not
 * clamp) out-of-range values, dropping `aria-valuenow` and going indeterminate for the ARIA layer,
 * so clamping the fill keeps the bar and the ARIA state in agreement. `transition-transform`
 * animates the fill as the value changes.
 *
 * Indeterminate: omit `value` (pass `null` / `undefined`) and Radix drops `aria-valuenow`; the
 * indicator becomes a partial-width bar (`w-2/5`, ~40%) that gently pulses via `animate-pulse`,
 * gated with `motion-reduce:animate-none` so reduced-motion users see a static bar. The partial
 * width keeps it from reading as a completed 100% fill.
 */
export const Progress = React.forwardRef<
  React.ComponentRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, size, value, ...props }, ref) => {
  // Radix: `value` is a number for determinate, `null` / `undefined` for indeterminate.
  const isIndeterminate = value === null || value === undefined;
  // Radix nullifies (does NOT clamp) out-of-range values, so clamp here to keep the fill
  // transform and the ARIA state consistent for value > 100 or value < 0.
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  return (
    <ProgressPrimitive.Root
      ref={ref}
      value={value}
      className={cn(progressVariants({ size }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full flex-1 rounded-full bg-primary transition-transform',
          isIndeterminate ? 'w-2/5 animate-pulse motion-reduce:animate-none' : 'w-full',
        )}
        style={isIndeterminate ? undefined : { transform: `translateX(-${100 - clamped}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = 'Progress';
