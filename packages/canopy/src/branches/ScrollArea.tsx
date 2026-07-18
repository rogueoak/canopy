import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cn } from '../lib/cn';

/**
 * ScrollArea - the canopy themed scroll container Branch (spec 0050), built on
 * `@radix-ui/react-scroll-area`. Where the browser's native overflow scrollbars look different in
 * every OS/browser and ignore the token layer, this wraps arbitrary content in a custom,
 * cross-browser scroll region: a focusable, natively-scrollable viewport plus a thin themed
 * `ScrollBar` that hides until needed and reads as part of the design system in light and dark.
 *
 * Radix supplies the mechanics - a `Root`, a `Viewport` that owns overflow and native
 * wheel/touch/keyboard scrolling, a `Scrollbar` + `Thumb` for the custom bar, and a `Corner` where
 * the two bars meet - while suppressing the native OS scrollbar so only the themed bar shows.
 * Nothing is portalled here (the viewport is inline), and light/dark is a token-layer property, so
 * the bar themes correctly with no per-instance wiring.
 *
 * The family mirrors the shadcn scroll-area, canopy-styled:
 * - `ScrollArea` - the root. Renders `ScrollAreaPrimitive.Root` (`relative overflow-hidden`),
 *   wraps `children` in `ScrollAreaPrimitive.Viewport` (`h-full w-full rounded-[inherit]`), and by
 *   default ships a vertical `ScrollBar` + the `Corner`. The caller sets height/max-height via
 *   `className`; the viewport handles overflow. Forwards `ref` to the root, spreads native props.
 * - `ScrollBar` - `ScrollAreaPrimitive.Scrollbar` + `ScrollAreaPrimitive.Thumb`, `orientation`
 *   `vertical` (default) or `horizontal`, with a thin `rounded-full bg-border` thumb.
 *
 * Styled with the 0005 recipe: FULL LITERAL token utility strings (so Tailwind v4's scanner emits
 * each), `cn()` merge with the caller `className` winning, `forwardRef` + native prop spread on
 * every part, `React.ComponentRef` ref typing, semantic tokens only, and NO `dark:` on the common
 * path. The only color token in play is `bg-border` for the thumb, which reads correctly in both
 * themes; the track stays transparent so the bar reads as part of the surface it sits on. No custom
 * keyframes - motion is Radix's built-in hover/scroll reveal, so there is nothing to gate behind
 * `motion-reduce`.
 *
 * a11y: Radix keeps the viewport natively scrollable and focusable (keyboard scrolling preserved);
 * the `Scrollbar` / `Thumb` / `Corner` are presentational so assistive tech reads the content, not
 * the bar. No ARIA roles are invented.
 */
const ScrollArea = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
));
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

/**
 * ScrollBar - the draggable themed bar (`ScrollAreaPrimitive.Scrollbar` + `Thumb`). `orientation`
 * `vertical` (default) renders a thin vertical track (`h-full w-2.5`, `border-l`); `horizontal`
 * renders a thin horizontal track (`h-2.5 flex-col`, `border-t`). Both use `touch-none select-none`
 * with a small padding so the `flex-1 rounded-full bg-border` thumb sits as a slim rounded bar
 * flush to the edge. The thumb deepens to `bg-border-strong` on hover/active (with
 * `transition-colors`) so the draggable bar reads as interactive. Forwards `ref` to the scrollbar,
 * spreads native props.
 */
const ScrollBar = React.forwardRef<
  React.ComponentRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', forceMount, ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    forceMount={forceMount}
    className={cn(
      'flex touch-none select-none',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
      className,
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      forceMount={forceMount}
      className="relative flex-1 rounded-full bg-border transition-colors hover:bg-border-strong active:bg-border-strong"
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };

export type ScrollAreaProps = React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>;
export type ScrollBarProps = React.ComponentPropsWithoutRef<
  typeof ScrollAreaPrimitive.ScrollAreaScrollbar
>;
