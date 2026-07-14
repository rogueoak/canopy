import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * inputVariants - the cva recipe that maps `size` onto canopy semantic-token Tailwind
 * utilities (spec 0006), following the 0005 Button recipe. All class strings are FULL
 * LITERALS so Tailwind v4's source scanner emits each utility - never build a class name
 * dynamically. There is no `dark:` here: light/dark flips automatically through the token
 * layer (spec 0004).
 *
 * The invalid state is driven by the native `aria-invalid` attribute via Tailwind's
 * `aria-invalid:` variant (`aria-invalid:border-danger aria-invalid:ring-danger …`) - set
 * `aria-invalid` on the element and the danger ramp takes over the border and focus ring,
 * keeping a11y and styling in lockstep with no extra prop.
 */
export const inputVariants = cva(
  // Base - shared by every size. Border + surface + text tokens; muted placeholder (text-muted,
  // not text-subtle: subtle is AA-Large-only and placeholder is small text - review 0006); the
  // focus-visible ring (a11y); the disabled token pair (not opacity); and the aria-invalid
  // danger overrides for border + ring.
  // Font size is `text-base md:text-sm`: 16px on mobile, 14px from md up. iOS Safari auto-zooms
  // the page when a focused field is below 16px, so the base font must be >=16px on phones; the
  // md breakpoint restores the denser 14px on larger (non-zooming) viewports (feedback 0017).
  'flex w-full rounded-md border border-border bg-surface px-3 text-base md:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {}

/**
 * Input - the canopy text-field Seed (spec 0006), built on the 0005 component recipe: cva
 * size variants over semantic tokens, `cn()` class merge, `forwardRef`, and a full spread of
 * native `<input>` props (`type` defaults to `'text'`). The `invalid` state is the native
 * `aria-invalid` attribute (styled via the `aria-invalid:` variant) - pass it through like any
 * native prop. Themed entirely by tokens - no per-component theme code.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type = 'text', ...props }, ref) => {
    return (
      <input ref={ref} type={type} className={cn(inputVariants({ size }), className)} {...props} />
    );
  },
);
Input.displayName = 'Input';
