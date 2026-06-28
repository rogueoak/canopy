import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '../lib/cn';

export type SeparatorProps = React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>;

/**
 * Separator - the canopy hairline divider Seed (spec 0016). A thin rule between content
 * groups (menu sections, toolbar clusters, list groupings). Built on
 * `@radix-ui/react-separator`, so it handles the decorative vs semantic ARIA distinction:
 * `decorative` (the default) renders no role, while `decorative={false}` exposes
 * `role="separator"` with `aria-orientation` reflecting the `orientation`.
 *
 * Styled entirely with semantic-token utilities (spec 0005 recipe) - all FULL LITERALS so
 * Tailwind v4's source scanner emits each one. No `dark:`: light/dark flips through the token
 * layer (spec 0004). The rule paints with the `border` token (`bg-border`); the
 * `data-[orientation=…]` utilities size it as a 1px-tall full-width line when horizontal and a
 * 1px-wide full-height line when vertical. `forwardRef`, full native prop spread, and `cn()`
 * merge follow the recipe.
 */
export const Separator = React.forwardRef<
  React.ComponentRef<typeof SeparatorPrimitive.Root>,
  SeparatorProps
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root
    ref={ref}
    orientation={orientation}
    decorative={decorative}
    className={cn(
      'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';
