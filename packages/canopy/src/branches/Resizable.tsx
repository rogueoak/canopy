import * as React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { cn } from '../lib/cn';

/**
 * Resizable - the canopy resizable split-layout Branch (spec 0063), built on
 * `react-resizable-panels`. Where a Seed is an atom and a Twig composes atoms, a **Branch** owns
 * interaction state: here the live drag / keyboard resizing of adjacent panes. No Radix primitive
 * covers panel resizing, so this is canopy's first non-Radix Branch - the same primitive shadcn's
 * `Resizable` uses. The primitive owns the hard parts (pointer tracking, min/max clamping, the
 * `separator` ARIA role + the `aria-valuenow` / `aria-valuemin` / `aria-valuemax` sizing values,
 * built-in arrow-key resize, collapsible panels, optional `autoSaveId` persistence); canopy wraps
 * its three parts in thin components styled with the 0005 recipe.
 *
 * All styling is FULL LITERAL semantic-token utilities (so Tailwind v4's scanner emits each), a
 * `cn()` merge with the caller `className` winning, and a native prop spread on every part. There
 * is NO `dark:` on the common path: light/dark flips through the token layer (spec 0004). The
 * divider paints with `border-border`, keyboard focus shows the standard focus-ring tokens, and the
 * optional grip uses `bg-border` / `border-border`. The handle flips its width/height and the
 * grip's rotation between the two directions with literal `data-[panel-group-direction=vertical]:`
 * variants - the primitive stamps `data-panel-group-direction` on both the group root and each
 * handle, so those literal variants resolve with no `dark:` or dynamic class names.
 *
 * Parts (mirroring the shadcn resizable surface):
 * - `ResizablePanelGroup` - wraps `PanelGroup`; `direction="horizontal"` (default) or `"vertical"`,
 *   forwarding `autoSaveId` / `onLayout` and other native props. Laid out `flex h-full w-full`
 *   with a `data-[panel-group-direction=vertical]:flex-col` literal variant. Its `ref` is the
 *   primitive's `ImperativePanelGroupHandle`.
 * - `ResizablePanel` - a direct alias of the primitive's `Panel` (a sizing container, no styling of
 *   its own), so `defaultSize` / `minSize` / `maxSize` / `collapsible` / `collapsedSize` pass
 *   straight through and its `ref` (the `ImperativePanelHandle`) forwards natively.
 * - `ResizableHandle` - wraps `PanelResizeHandle`; the styled `role="separator"` divider. A
 *   `withHandle` boolean renders an optional centered grip (a small bordered box with a drag-dots
 *   glyph). An overridable `aria-label` names the handle for assistive tech. (The primitive owns
 *   the separator DOM node internally and exposes no forwardable DOM ref, matching shadcn's handle,
 *   so this part - like shadcn's - is a plain styled wrapper rather than a `forwardRef`.)
 *
 * Motion: none beyond the primitive's live size updates during drag, so there is no canopy keyframe
 * and no reduced-motion concern on the common path.
 */

export type ResizablePanelGroupProps = React.ComponentPropsWithoutRef<typeof PanelGroup>;

/**
 * ResizablePanelGroup - the container that lays out its `ResizablePanel` children separated by
 * `ResizableHandle` dividers. `direction` (`"horizontal"` | `"vertical"`, defaulting to
 * `"horizontal"`) sets the split axis; the primitive stamps `data-panel-group-direction` on the
 * root, which the literal `data-[panel-group-direction=vertical]:flex-col` variant reads to stack
 * vertically.
 */
export const ResizablePanelGroup = React.forwardRef<
  React.ComponentRef<typeof PanelGroup>,
  ResizablePanelGroupProps
>(({ className, direction = 'horizontal', ...props }, ref) => (
  <PanelGroup
    ref={ref}
    direction={direction}
    className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
    {...props}
  />
));
ResizablePanelGroup.displayName = 'ResizablePanelGroup';

export type ResizablePanelProps = React.ComponentPropsWithoutRef<typeof Panel>;

/**
 * ResizablePanel - a single pane. A direct alias of the primitive's `Panel` (a sizing container
 * with no styling of its own), so `defaultSize` / `minSize` / `maxSize` / `collapsible` /
 * `collapsedSize` and the rest pass straight through, and its `ImperativePanelHandle` `ref`
 * forwards natively.
 */
export const ResizablePanel = Panel;

export type ResizableHandleProps = React.ComponentPropsWithoutRef<typeof PanelResizeHandle> & {
  /**
   * Render a centered visible grip (a small bordered box with a drag-dots glyph) inside the handle,
   * giving the divider an explicit affordance. Defaults to `false` (a hairline divider only).
   */
  withHandle?: boolean;
};

/**
 * ResizableHandle - the draggable divider between two panels. Wraps `PanelResizeHandle`, which
 * supplies `role="separator"`, `tabIndex=0` (keyboard focus + arrow-key resize), the `aria-valuenow`
 * / `aria-valuemin` / `aria-valuemax` sizing values, `data-panel-group-direction`, and
 * `data-resize-handle-state` (`inactive` / `hover` / `drag`). Styled with border tokens: a
 * `bg-border` idle divider line (a 1px width in a horizontal group, a 1px height in a vertical one)
 * that deepens to `bg-border-strong` on hover and `bg-primary` while dragging via literal
 * `data-[resize-handle-state=...]:` variants, a widened invisible hit target via the `after:`
 * pseudo-element, the standard focus-ring tokens on keyboard focus, and literal
 * `data-[panel-group-direction=vertical]:` variants that flip its dimensions and rotate the grip for
 * a vertical group. Pass `withHandle` for the visible grip and `aria-label` to name the handle.
 */
export function ResizableHandle({ className, withHandle = false, ...props }: ResizableHandleProps) {
  return (
    <PanelResizeHandle
      className={cn(
        'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset data-[resize-handle-state=hover]:bg-border-strong data-[resize-handle-state=drag]:bg-primary data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
        className,
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-border bg-border">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="h-2.5 w-2.5 text-text-muted"
          >
            <circle cx="9" cy="6" r="1" />
            <circle cx="9" cy="12" r="1" />
            <circle cx="9" cy="18" r="1" />
            <circle cx="15" cy="6" r="1" />
            <circle cx="15" cy="12" r="1" />
            <circle cx="15" cy="18" r="1" />
          </svg>
        </div>
      ) : null}
    </PanelResizeHandle>
  );
}
ResizableHandle.displayName = 'ResizableHandle';
