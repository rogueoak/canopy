import * as React from 'react';
import * as TogglePrimitive from '@radix-ui/react-toggle';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * toggleVariants - the cva recipe that maps `variant` × `size` onto canopy semantic-token
 * Tailwind utilities (spec 0005, 0039). All class strings are FULL LITERALS so Tailwind v4's
 * source scanner emits each utility - never build a class name dynamically. There is no
 * `dark:` here: light/dark flips automatically through the token layer (spec 0004).
 *
 * The on state is driven by Radix's `data-state="on"` attribute: `default` fills with the
 * accent surface (`bg-accent`, paired with its guaranteed-contrast `text-accent-foreground`)
 * so a pressed toolbar button reads clearly as active, while `outline` uses the quieter neutral
 * fill (`bg-muted`) plus a stronger border (`border-border-strong`) so the pressed state stays
 * distinct from a plain `hover:bg-muted` and the segment does not shout.
 * Exported so ToggleGroup (0049) can reuse the exact same class recipe on its items.
 */
export const toggleVariants = cva(
  // Base - shared by every variant/size.
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-transparent text-text hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
        outline:
          'border border-border bg-surface text-text hover:bg-muted data-[state=on]:bg-muted data-[state=on]:border-border-strong',
      },
      size: {
        sm: 'h-8 min-w-8 px-2 text-sm',
        md: 'h-10 min-w-10 px-3 text-sm',
        lg: 'h-12 min-w-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export type ToggleProps = React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>;

/**
 * Toggle - the canopy two-state pressed-button Seed (spec 0039). For the bold / italic / mute
 * button in a toolbar: a control that reads as a button (`aria-pressed`), not a form field.
 * Built on `@radix-ui/react-toggle`, so it ships the correct `button` element, `aria-pressed`,
 * and the full controlled (`pressed` + `onPressedChange`) and uncontrolled (`defaultPressed`)
 * APIs. Icon-only usages should pass an `aria-label`.
 *
 * Styled entirely with semantic-token utilities (the 0005 recipe): `toggleVariants` maps
 * `variant` × `size` to FULL LITERAL token classes, `cn()` merges the caller `className` last
 * (caller wins), `forwardRef` + a full native prop spread. No `dark:` on the common path -
 * light/dark flips through the token layer (spec 0004). It is the atom ToggleGroup (0049)
 * will compose.
 */
export const Toggle = React.forwardRef<
  React.ComponentRef<typeof TogglePrimitive.Root>,
  ToggleProps
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size }), className)}
    {...props}
  />
));
Toggle.displayName = 'Toggle';
