import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * badgeVariants — the cva recipe that maps `variant` onto canopy semantic-token Tailwind
 * utilities (spec 0008). Badge is the first component to exercise the status roles
 * (`success`/`warning`/`danger`/`info`) end-to-end. All class strings are FULL LITERALS so
 * Tailwind v4's source scanner emits each utility — never build a class name dynamically.
 * There is no `dark:` here: light/dark flips automatically through the token layer (spec 0004).
 */
export const badgeVariants = cva(
  // Base — shared by every variant. Pill shape; presentational (no focus ring — non-interactive).
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        // Hairline border so the subtle neutral fill stays delineated even on a muted/hover
        // surface (the role fills below don't need it — their fills carry on any surface).
        neutral: 'border border-border bg-muted text-muted-foreground',
        primary: 'bg-primary text-primary-foreground',
        success: 'bg-success text-success-foreground',
        warning: 'bg-warning text-warning-foreground',
        danger: 'bg-danger text-danger-foreground',
        info: 'bg-info text-info-foreground',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  /**
   * Render as the single child element instead of a `<span>` (Radix `Slot`), merging badge
   * classes/props onto it. Use to wrap, e.g., a link: `<Badge asChild><a … /></Badge>`.
   *
   * Note: `ref` is still typed `HTMLSpanElement` (the default element); narrow it at the call
   * site if you need the child's element type.
   */
  asChild?: boolean;
}

/**
 * Badge — a small, non-interactive label for status and metadata. Follows the component
 * recipe: cva variants over semantic tokens, `cn()` class merge, Radix `Slot` for `asChild`,
 * `forwardRef`, and a full spread of native `<span>` props. Renders a `<span>` by default and
 * is themed entirely by tokens — no per-component theme code.
 *
 * Accessibility: the badge's meaning must come from its TEXT, not its colour alone. If a badge
 * ever conveys status by colour with no/again-ambiguous text (e.g. a future dot or count
 * variant), give it an `aria-label` so it isn't lost to colour-blind or screen-reader users.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span';
    return <Comp ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />;
  },
);
Badge.displayName = 'Badge';
