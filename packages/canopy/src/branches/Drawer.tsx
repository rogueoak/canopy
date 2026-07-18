import * as React from 'react';
import { Drawer as DrawerPrimitive } from 'vaul';
import { cva } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Drawer - the edge-anchored, drag-to-dismiss modal Branch (spec 0067), built on **`vaul`**. Where
 * `Dialog` (0024) is a centred modal on `@radix-ui/react-dialog`, a Drawer anchors to an edge of the
 * viewport (`bottom` (default) / `top` / `left` / `right`), slides in, and can be **dragged to
 * dismiss** with a finger. vaul wraps Radix Dialog under the hood, so the mental model stays close to
 * the other portalled Branches - it adds the pointer-drag tracking, velocity/threshold dismiss, and
 * the anchored `direction` API that raw Radix Dialog can't give.
 *
 * The family mirrors the shadcn drawer so callers compose like the other portalled Branches:
 * - `Drawer` - the stateful root: vaul `Drawer.Root`, forwarding `open` / `defaultOpen` /
 *   `onOpenChange` / `direction` (default `bottom`) / `modal` and the vaul drag props. Owns open state
 *   and the drag gesture.
 * - `DrawerTrigger` / `DrawerClose` - the vaul `Trigger` / `Close`; `DrawerContent` also ships a
 *   built-in top-corner icon `DrawerClose`, a real labelled `button`.
 * - `DrawerOverlay` - the vaul `Overlay` styled as the shared `fixed inset-0 z-50 bg-overlay/80`
 *   scrim (identical to the Dialog / SideNav / ResponsiveDialog scrim in use today).
 * - `DrawerContent` - the vaul `Content` (portalled) styled per `direction` with **full literal**
 *   token-utility strings, a grab-handle affordance on the drag axis, and the `animate-drawer-*`
 *   (side) / `animate-bottom-sheet-*` (bottom) motion tokens, all gated with
 *   `motion-reduce:animate-none`.
 * - `DrawerHeader` / `DrawerFooter` - layout slots (header stacks title + description; footer stacks
 *   on mobile, right-aligns on `sm+`), reusing the Dialog slot idiom.
 * - `DrawerTitle` / `DrawerDescription` - the vaul `Title` / `Description` wiring the dialog's
 *   accessible name (`aria-labelledby`) / description (`aria-describedby`).
 *
 * There is NO `dark:` on the common path: light/dark flips through the token layer (spec 0004), and
 * because `.dark` lives on `<html>` the portalled panel + scrim (mounted under `<body>`) theme
 * correctly too. vaul supplies `role="dialog"` + `aria-modal`, the focus trap, return-focus, scroll
 * lock, `Esc`, and outside-click dismiss.
 */

type DrawerPrimitiveProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Root>;

type DrawerDirection = NonNullable<DrawerPrimitiveProps['direction']>;

export type DrawerProps = DrawerPrimitiveProps;

/**
 * Drawer - the stateful root (vaul `Drawer.Root`). Controlled or uncontrolled via `open` /
 * `defaultOpen` / `onOpenChange`; `direction` (default `bottom`) anchors the panel; `modal` (default
 * `true`) traps focus and scrolls-locks the page. All vaul root props pass through.
 */
const Drawer = ({ direction = 'bottom', ...props }: DrawerProps) => (
  <DrawerPrimitive.Root direction={direction} {...props} />
);
Drawer.displayName = 'Drawer';

export type DrawerTriggerProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Trigger>;

/** DrawerTrigger - the vaul `Trigger`; opens the drawer. `asChild` to wrap a Button Seed. */
const DrawerTrigger: React.ForwardRefExoticComponent<
  DrawerTriggerProps & React.RefAttributes<HTMLButtonElement>
> = DrawerPrimitive.Trigger;

export type DrawerCloseProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Close>;

/** DrawerClose - the vaul `Close`; closes the drawer. `asChild` to wrap a Button (e.g. "Cancel"). */
const DrawerClose: React.ForwardRefExoticComponent<
  DrawerCloseProps & React.RefAttributes<HTMLButtonElement>
> = DrawerPrimitive.Close;

/** DrawerPortal - the vaul `Portal`; renders the drawer outside the DOM hierarchy under `<body>`. */
const DrawerPortal = DrawerPrimitive.Portal;

export type DrawerOverlayProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>;

/**
 * DrawerOverlay - the vaul `Overlay` styled as the shared `bg-overlay/80` scrim, fading via
 * `data-[state]` with `motion-reduce:animate-none`. Identical to the Dialog / SideNav /
 * ResponsiveDialog scrim in use today.
 */
const DrawerOverlay: React.ForwardRefExoticComponent<
  DrawerOverlayProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<React.ComponentRef<typeof DrawerPrimitive.Overlay>, DrawerOverlayProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-dialog-overlay-in data-[state=closed]:animate-dialog-overlay-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  ),
);
DrawerOverlay.displayName = 'DrawerOverlay';

/**
 * drawerContentVariants - maps `direction` to a FULL LITERAL token-utility string (no dynamically
 * composed class names, so Tailwind v4's scanner emits each): the anchored edge, the full-bleed axis,
 * the rounded corners on the exposed side, and the enter/exit motion token. `bottom` reuses the
 * `bottom-sheet-*` motion; the three side directions use the `drawer-*` motion. Every variant sits on
 * the raised-surface pattern (`bg-surface-raised` + `border-border` + `text-text` + `shadow-lg`).
 */
const drawerContentVariants = cva(
  'fixed z-50 flex flex-col border-border bg-surface-raised text-text shadow-lg motion-reduce:animate-none',
  {
    variants: {
      direction: {
        bottom:
          'inset-x-0 bottom-0 mt-24 max-h-[85vh] rounded-t-lg border-t data-[state=open]:animate-bottom-sheet-in data-[state=closed]:animate-bottom-sheet-out',
        top: 'inset-x-0 top-0 mb-24 max-h-[85vh] rounded-b-lg border-b data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out',
        left: 'inset-y-0 left-0 w-3/4 max-w-sm rounded-r-lg border-r data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out',
        right:
          'inset-y-0 right-0 w-3/4 max-w-sm rounded-l-lg border-l data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out',
      },
    },
    defaultVariants: {
      direction: 'bottom',
    },
  },
);

/**
 * Per-direction grab-handle affordance. On the vertical directions the handle is a horizontal bar
 * centred on the top/bottom edge (drag axis = vertical); on the horizontal directions it is a
 * vertical bar centred on the exposed edge (drag axis = horizontal). Uses `bg-muted-raised` (the
 * raised-surface rule) and is `aria-hidden` (decorative).
 */
const handleClasses: Record<DrawerDirection, string> = {
  bottom: 'mx-auto mt-4 h-1.5 w-10 shrink-0 rounded-full bg-muted-raised',
  top: 'mx-auto mb-4 h-1.5 w-10 shrink-0 rounded-full bg-muted-raised order-last',
  left: 'my-auto ml-auto mr-4 h-10 w-1.5 shrink-0 rounded-full bg-muted-raised',
  right: 'my-auto mr-auto ml-4 h-10 w-1.5 shrink-0 rounded-full bg-muted-raised',
};

export interface DrawerContentProps
  extends React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content> {
  /**
   * The edge the drawer anchors to: `bottom` (default) / `top` / `left` / `right`. Drives the
   * anchored edge, the rounded corners on the exposed side, and the grab-handle axis. Pass the same
   * value as the root `Drawer direction` (vaul threads its own direction via context, so this prop
   * only styles the content and adds the matching handle).
   */
  direction?: DrawerDirection;
  /**
   * Whether to render the decorative grab-handle affordance on the drag axis. Default `true`; set
   * `false` for a drawer with no visible drag handle (drag still works).
   */
  showHandle?: boolean;
}

/**
 * DrawerContent - the vaul `Content` (portalled over the `DrawerOverlay`), styled per `direction`
 * with the raised-surface pattern and a grab-handle affordance on the drag axis. vaul provides the
 * `role="dialog"`; we add `aria-modal="true"` explicitly (matching Dialog) so the drawer advertises
 * its modality directly. `cn()` merges the caller `className` (caller wins).
 */
const DrawerContent: React.ForwardRefExoticComponent<
  DrawerContentProps & React.RefAttributes<HTMLDivElement>
> = React.forwardRef<React.ComponentRef<typeof DrawerPrimitive.Content>, DrawerContentProps>(
  ({ className, children, direction = 'bottom', showHandle = true, ...props }, ref) => (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        aria-modal="true"
        className={cn(drawerContentVariants({ direction }), className)}
        {...props}
      >
        {showHandle ? <div aria-hidden="true" className={handleClasses[direction]} /> : null}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  ),
);
DrawerContent.displayName = 'DrawerContent';

export type DrawerHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/** DrawerHeader - the stacked header slot (title + description), padded, text-left. */
const DrawerHeader = React.forwardRef<HTMLDivElement, DrawerHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-4 text-left', className)} {...props} />
  ),
);
DrawerHeader.displayName = 'DrawerHeader';

export type DrawerFooterProps = React.HTMLAttributes<HTMLDivElement>;

/** DrawerFooter - the action slot; stacks on mobile, becomes a right-aligned row on `sm+`. */
const DrawerFooter = React.forwardRef<HTMLDivElement, DrawerFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-auto flex flex-col gap-2 p-4 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  ),
);
DrawerFooter.displayName = 'DrawerFooter';

export type DrawerTitleProps = React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>;

/**
 * DrawerTitle - the accessible title (vaul `Title`), in the `text-h4` role; wired as the dialog's
 * `aria-labelledby`.
 */
const DrawerTitle: React.ForwardRefExoticComponent<
  DrawerTitleProps & React.RefAttributes<HTMLHeadingElement>
> = React.forwardRef<React.ComponentRef<typeof DrawerPrimitive.Title>, DrawerTitleProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Title ref={ref} className={cn('text-h4 text-text', className)} {...props} />
  ),
);
DrawerTitle.displayName = 'DrawerTitle';

export type DrawerDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DrawerPrimitive.Description
>;

/**
 * DrawerDescription - muted supporting copy (vaul `Description`), `text-body-sm` on the muted text
 * token; wired as the dialog's `aria-describedby`.
 */
const DrawerDescription: React.ForwardRefExoticComponent<
  DrawerDescriptionProps & React.RefAttributes<HTMLParagraphElement>
> = React.forwardRef<React.ComponentRef<typeof DrawerPrimitive.Description>, DrawerDescriptionProps>(
  ({ className, ...props }, ref) => (
    <DrawerPrimitive.Description
      ref={ref}
      className={cn('text-body-sm text-text-muted', className)}
      {...props}
    />
  ),
);
DrawerDescription.displayName = 'DrawerDescription';

export {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
  DrawerOverlay,
};
