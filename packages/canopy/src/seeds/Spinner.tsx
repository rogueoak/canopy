import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * spinnerVariants - the cva recipe that maps `size` onto the spinning SVG's box (spec 0017),
 * following the 0005 Button recipe. All class strings are FULL LITERALS so Tailwind v4's source
 * scanner emits each utility - never build a class name dynamically. There is no `dark:` here:
 * the indicator draws with `currentColor`, so it inherits whatever text colour the caller sets
 * (e.g. `text-primary` / `text-muted-foreground`) and re-themes through the token layer (spec
 * 0004) for free.
 *
 * `animate-spin` drives the rotation; `motion-reduce:animate-none` stills it for users who set
 * `prefers-reduced-motion: reduce`, so the indicator stays put rather than spinning.
 */
export const spinnerVariants = cva(
  // Base - shared by every size. The spin animation, gated behind reduced-motion.
  'animate-spin motion-reduce:animate-none',
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof spinnerVariants> {}

/**
 * Spinner - the canopy busy-indicator Seed (spec 0017), built on the 0005 component recipe: cva
 * size variants, `cn()` class merge, `forwardRef`, and a full spread of native `<span>` props.
 * Pure CSS/SVG - no Radix, no dependency.
 *
 * Renders a `<span role="status">` whose accessible name comes from a SINGLE source - a
 * visually-hidden (`sr-only`) text node holding the label (default `"Loading"`, overridable via
 * the native `aria-label` prop). The label is NOT also set as an `aria-label` attribute: the
 * `sr-only` text is what a polite live region announces on mount, and duplicating it as an
 * attribute makes some screen readers say it twice. Inside sits an inline SVG - a faint circle
 * track and a brighter arc - drawn with `currentColor` and spun with `animate-spin`. The SVG is
 * `aria-hidden` so the status is announced once.
 *
 * Colour: the indicator inherits `currentColor`, so set a text-colour token on the Spinner (or an
 * ancestor) to tint it - `<Spinner className="text-primary" />`. Themed entirely by tokens - no
 * per-component theme code.
 *
 * Reduced motion: the rotation is gated with `motion-reduce:animate-none`, so users who prefer
 * reduced motion see a static indicator instead of a spinning one.
 */
export const Spinner = React.forwardRef<HTMLSpanElement, SpinnerProps>(
  ({ className, size, 'aria-label': ariaLabel = 'Loading', ...props }, ref) => {
    return (
      <span ref={ref} role="status" className={cn('inline-flex', className)} {...props}>
        <svg
          className={spinnerVariants({ size })}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">{ariaLabel}</span>
      </span>
    );
  },
);
Spinner.displayName = 'Spinner';
