import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../lib/cn';

/**
 * Tooltip — the canopy hover/focus hint Seed (spec 0014), built on `@radix-ui/react-tooltip`
 * and the 0005 component recipe: semantic-token Tailwind utilities (FULL LITERAL strings so
 * Tailwind v4's scanner emits each one), `cn()` class merge, and `forwardRef` with a full native
 * prop spread on the styled wrapper. There is NO `dark:` on the common path — light/dark flips
 * automatically through the token layer (spec 0004), and because the `.dark` class lives on
 * `<html>`, the Radix-portalled `TooltipContent` (mounted under `<body>`) themes correctly too.
 *
 * The family mirrors the shadcn surface area:
 * - `TooltipProvider` — shared config (`delayDuration`, `skipDelayDuration`). Wrap once, high in
 *   the tree, so every tooltip beneath shares the same open delay.
 * - `Tooltip` — the stateful root; opens on hover AND keyboard focus, closes on blur/escape.
 * - `TooltipTrigger` — the element the tooltip describes (use `asChild` to wrap a Button etc.).
 * - `TooltipContent` — the portalled hint (`Portal` + `Content` + a matching `Arrow`), styled on
 *   a raised-surface card (`bg-surface-raised` + `border` + `shadow-md`) with terse `text-xs`.
 *
 * Short, non-interactive text only — Popover / HoverCard / rich content are separate, later
 * specs (spec 0014, Out of scope).
 */
const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

export interface TooltipContentProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
> {
  /** Render the little arrow pointing at the trigger. Default `true`; set `false` to omit it. */
  arrow?: boolean;
}

/**
 * TooltipContent — the portalled hint surface. Rendered through `TooltipPrimitive.Portal` (so it
 * escapes overflow/stacking contexts) onto a raised-surface card: `bg-surface-raised` + `text-text`
 * + `border border-border` + `rounded-md` + the primitive `shadow-md` (there is no semantic
 * elevation token yet), capped at `max-w-xs` so a long hint wraps instead of stretching.
 * `sideOffset` defaults to `4` to nudge the card off the trigger. The `arrow` (default `true`)
 * `TooltipPrimitive.Arrow` is filled with `fill-surface-raised` so the SVG pointer matches the
 * card face in both themes; pass `arrow={false}` to omit it.
 */
const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(({ className, sideOffset = 4, arrow = true, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs overflow-hidden rounded-md border border-border bg-surface-raised px-3 py-1.5 text-xs text-text shadow-md',
        className,
      )}
      {...props}
    >
      {children}
      {arrow ? <TooltipPrimitive.Arrow className="fill-surface-raised" /> : null}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent };

export type TooltipProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Root>;
export type TooltipProviderProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Provider>;
export type TooltipTriggerProps = React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>;
