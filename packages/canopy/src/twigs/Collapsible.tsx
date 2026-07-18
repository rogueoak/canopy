import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '../lib/cn';

/**
 * Collapsible - the single expand/collapse disclosure Twig (spec 0046), built on
 * `@radix-ui/react-collapsible`. One trigger toggles the visibility of one content region - the
 * "show more / show less" primitive that sits one notch below Accordion (0052): Accordion manages
 * a *set* of sections, Collapsible is the *single* disclosure it composes.
 *
 * Radix supplies the open-state machine (controlled `open` + `onOpenChange`, uncontrolled
 * `defaultOpen`, and root `disabled`), the real `button` trigger carrying `aria-expanded` /
 * `aria-controls`, and the `data-state` + `--radix-collapsible-content-height` CSS var that drives
 * the height animation. We add only canopy styling and the barrel export.
 *
 * The family follows the 0005 recipe: each part is a small `forwardRef` wrapper that spreads native
 * props and merges `className` via `cn()` (caller wins), typed with `React.ComponentRef` /
 * `React.ComponentPropsWithoutRef`, styled with FULL LITERAL semantic-token utilities so Tailwind
 * v4's scanner emits each, and with NO `dark:` on the common path - light/dark flips through the
 * token layer (spec 0004).
 * - `Collapsible` - the root; passes `open` / `defaultOpen` / `onOpenChange` / `disabled` straight
 *   through to `CollapsiblePrimitive.Root`.
 * - `CollapsibleTrigger` - the toggle `button`; carries the focus-visible ring token set, the shared
 *   toggle-disabled tokens (`disabled:opacity-50 disabled:cursor-not-allowed`), and `cursor-pointer`
 *   on the base to match the Button idiom. Supports `asChild` so callers can render their own trigger.
 * - `CollapsibleContent` - the show/hide region; `overflow-hidden` with the `data-state`-driven height
 *   animation (`animate-collapsible-down` / `-up`, from the Roots motion preset) gated behind
 *   `motion-reduce:animate-none` so reduced-motion users get an instant toggle.
 */
export type CollapsibleProps = React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>;

/**
 * Collapsible - the disclosure root. Owns the open state (controlled `open` / `onOpenChange`,
 * uncontrolled `defaultOpen`) and the `disabled` flag, all passed straight through to the Radix
 * primitive. Presentational only; carries no styling of its own.
 */
export const Collapsible = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Root>,
  CollapsibleProps
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Root ref={ref} className={cn(className)} {...props} />
));
Collapsible.displayName = CollapsiblePrimitive.Root.displayName;

export type CollapsibleTriggerProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Trigger
>;

/**
 * CollapsibleTrigger - the toggle. A real `button` (from the Radix primitive) carrying
 * `aria-expanded` / `aria-controls`; styled with the focus-visible ring token set, the shared
 * toggle-disabled tokens, and `cursor-pointer` on the base. Pass `asChild` to render your own
 * trigger element while keeping the button semantics and ARIA wiring.
 */
export const CollapsibleTrigger = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Trigger>,
  CollapsibleTriggerProps
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    className={cn(
      'cursor-pointer text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
CollapsibleTrigger.displayName = CollapsiblePrimitive.Trigger.displayName;

export type CollapsibleContentProps = React.ComponentPropsWithoutRef<
  typeof CollapsiblePrimitive.Content
>;

/**
 * CollapsibleContent - the region that shows/hides. `overflow-hidden` so the height animation
 * clips its children, with the `data-state`-driven height slide (`animate-collapsible-down` when
 * opening, `animate-collapsible-up` when closing) from the Roots motion preset. Gated behind
 * `motion-reduce:animate-none` so reduced-motion users get an instant show/hide. Radix hides the
 * region from the accessibility tree when closed.
 */
export const CollapsibleContent = React.forwardRef<
  React.ComponentRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleContentProps
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-text data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
));
CollapsibleContent.displayName = CollapsiblePrimitive.Content.displayName;
