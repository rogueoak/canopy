import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { cn } from '../lib/cn';

/**
 * HoverCard - the canopy rich-preview Branch (spec 0057), built on `@radix-ui/react-hover-card`
 * and the 0005 component recipe: semantic-token Tailwind utilities (FULL LITERAL strings so
 * Tailwind v4's scanner emits each one), `cn()` class merge, and `forwardRef` with a native prop
 * spread on the styled wrapper. There is NO `dark:` on the common path - light/dark flips through
 * the token layer (spec 0004), and because the `.dark` class lives on `<html>`, the
 * Radix-portalled `HoverCardContent` (mounted under `<body>`) themes correctly too, exactly like
 * `DialogContent` / `SelectContent`.
 *
 * It fills the middle gap between `Tooltip` (0014, short non-interactive text on hover/focus) and
 * `Popover` (click-triggered, focus-trapping): a rich preview surface that opens on hover AND
 * keyboard focus, does NOT trap focus, and keeps its content in the normal tab order - the pattern
 * behind link previews, `@mention` user cards, and repository hover-cards. Radix owns the hard
 * parts (hover-intent timing, the grace area between trigger and content so the card does not
 * flicker while the pointer crosses the gap, focus-open, collision-aware positioning, the portal),
 * so this component is composition + token styling.
 *
 * The family mirrors the shadcn surface area:
 * - `HoverCard` - the stateful root re-exported directly; forwards `openDelay`, `closeDelay`,
 *   `open`/`onOpenChange`, and `defaultOpen` (controlled or uncontrolled).
 * - `HoverCardTrigger` - the hovered/focused element; `asChild` so any link, `Avatar`, or `Badge`
 *   becomes the trigger and stays a real, focusable element.
 * - `HoverCardContent` - the portalled raised-surface preview (`bg-surface-raised` + `border` +
 *   `shadow-md` + `rounded-lg`) with the shared **pop** motion, `sideOffset`/`align` forwarded.
 *
 * Passive preview only - focus-trapping/interactive cards and async/lazy content are later specs
 * (spec 0057, Out of scope).
 */
const HoverCard = HoverCardPrimitive.Root;

const HoverCardTrigger = HoverCardPrimitive.Trigger;

/**
 * HoverCardContent - the portalled preview surface. Rendered through `HoverCardPrimitive.Portal`
 * (so it escapes overflow/stacking contexts) onto a raised-surface card: `bg-surface-raised` +
 * `text-text` + `border border-border` + `rounded-lg` + the primitive `shadow-md`, `p-4`, sized to
 * its content (`w-64` default; override via `className`). The shared **pop** motion
 * (`animate-pop-in` / `data-[state=closed]:animate-pop-out`) is gated with
 * `motion-reduce:animate-none` so reduced-motion users get an instant show/hide - no new keyframes.
 * `sideOffset` defaults to `4` and `align` to `center` to nudge the card off the trigger; both
 * forward to Radix. Uses `React.ComponentRef<typeof HoverCardPrimitive.Content>` for the ref type.
 */
const HoverCardContent = React.forwardRef<
  React.ComponentRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-64 rounded-lg border border-border bg-surface-raised p-4 text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </HoverCardPrimitive.Portal>
));
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

export { HoverCard, HoverCardTrigger, HoverCardContent };

export type HoverCardProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Root>;
export type HoverCardTriggerProps = React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Trigger
>;
export type HoverCardContentProps = React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Content
>;
