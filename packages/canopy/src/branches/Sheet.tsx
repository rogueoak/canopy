import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Sheet - the edge-anchored side-panel Branch (spec 0068), built on the existing
 * `@radix-ui/react-dialog` primitive (**no new dependency**). Where `Dialog` (0024) is a *centred*
 * modal and `Drawer` (0067) is the *drag-to-dismiss* panel on `vaul`, a Sheet is the click/`Esc`-
 * dismissed panel anchored to a viewport edge: settings drawers, filter panels, detail flyouts,
 * mobile nav sheets. It is the same Radix Dialog state machine and ARIA contract as Dialog - Radix
 * owns the open/close state, focus trap, return-focus, scroll lock, `Esc`-to-close, and the
 * `role="dialog"` + `aria-labelledby` / `aria-describedby` wiring - the difference is purely
 * positioning + motion: anchored to an edge with a slide-in instead of centred with a zoom.
 *
 * There is NO `dark:` on the common path: light/dark flips through the token layer (spec 0004), and
 * because `.dark` lives on `<html>` the portalled overlay + content (mounted under `<body>`) theme
 * correctly too. The surface reuses the raised-surface pattern (`bg-surface-raised` + `border` + the
 * primitive `shadow-lg`) and the scrim reuses the pre-provisioned `color-overlay` token at reduced
 * opacity (`bg-overlay/80`) - so Sheet adds NO new token.
 *
 * The family mirrors the shadcn Sheet surface and the Dialog naming:
 * - `Sheet` - the stateful root (`open` / `onOpenChange`; controlled or uncontrolled via
 *   `defaultOpen`).
 * - `SheetTrigger` - opens the sheet; `asChild` to wrap a Button Seed.
 * - `SheetClose` - closes the sheet; `asChild` to wrap a Button (e.g. a footer "Cancel").
 * - `SheetOverlay` - the full-viewport scrim, **exported** (unlike Dialog's internal overlay) so a
 *   caller can restyle or replace the scrim; `SheetContent` still bakes in a default overlay so the
 *   common path stays one part.
 * - `SheetContent` - the portalled panel with a `side` prop (`top` / `right` / `bottom` / `left`,
 *   default `right`) and a built-in `X` close affordance; owns focus trap, return-focus, scroll
 *   lock, and `Esc`-to-close (Radix).
 * - `SheetHeader` / `SheetFooter` - layout slots (stacked header; right-aligned action footer).
 * - `SheetTitle` - the accessible title (`text-h3`), wired as `aria-labelledby`.
 * - `SheetDescription` - muted supporting copy (`text-body-sm`), wired as `aria-describedby`.
 *
 * The per-edge slide is gated with `motion-reduce:animate-none`, so a reduced-motion user gets an
 * instant show/hide. The slide reuses the pre-provisioned Roots-preset motion tokens - each `side`
 * animates toward its anchored edge: `left` = `animate-drawer-*` (translateX(-100%)), `right` =
 * `animate-drawer-right-*` (translateX(100%)), `top` = `animate-drawer-top-*` (translateY(-100%)),
 * `bottom` = `animate-bottom-sheet-*` (translateY(100%)) - **no new keyframe**.
 */
const Sheet = DialogPrimitive.Root;

const SheetTrigger = DialogPrimitive.Trigger;

const SheetClose = DialogPrimitive.Close;

const SheetPortal = DialogPrimitive.Portal;

/**
 * SheetOverlay - the full-viewport scrim. `bg-overlay/80` is the pre-provisioned `color-overlay`
 * semantic token at reduced opacity, so the panel reads through it in both themes. Fades in/out via
 * Radix's `data-[state]` hooks, gated with `motion-reduce:animate-none`. **Exported** so a caller
 * can restyle the scrim (side panels sometimes want a lighter/absent scrim, e.g. a non-modal desktop
 * nav); `SheetContent` still bakes in a default overlay so the common path stays one part.
 */
const SheetOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-dialog-overlay-in data-[state=closed]:animate-dialog-overlay-out motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * sheetContentVariants - maps the `side` prop to a FULL LITERAL token-utility string (no dynamically
 * composed class names, so Tailwind v4's scanner emits each): the anchored edge, the span/size
 * (`left`/`right` -> full height, capped width; `top`/`bottom` -> full width, capped auto height),
 * and the per-edge slide motion. Every variant sits on the shared raised-surface pattern in the base
 * (`bg-surface-raised` + `border-border` + `text-text` + `shadow-lg`), gated with
 * `motion-reduce:animate-none`.
 */
const sheetContentVariants = cva(
  'fixed z-50 flex flex-col gap-4 border-border bg-surface-raised p-6 text-text shadow-lg motion-reduce:animate-none',
  {
    variants: {
      side: {
        top: 'inset-x-0 top-0 border-b data-[state=open]:animate-drawer-top-in data-[state=closed]:animate-drawer-top-out',
        right:
          'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:animate-drawer-right-in data-[state=closed]:animate-drawer-right-out',
        bottom:
          'inset-x-0 bottom-0 border-t data-[state=open]:animate-bottom-sheet-in data-[state=closed]:animate-bottom-sheet-out',
        left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out',
      },
    },
    defaultVariants: {
      side: 'right',
    },
  },
);

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof sheetContentVariants> {}

/**
 * SheetContent - the portalled panel. Rendered through `DialogPrimitive.Portal` (so it escapes
 * overflow/stacking contexts) over a baked-in `SheetOverlay`, anchored to the `side` edge (default
 * `right`) with the matching full-literal size span and per-edge slide motion. Includes a built-in
 * close affordance: an `X`-icon `SheetClose` (inline SVG using `currentColor`, `aria-hidden`) with
 * `aria-label="Close"`, the `muted-raised` hover fill and the shared focus-visible ring.
 *
 * We set `aria-modal="true"` explicitly: Radix marks the modal by `aria-hidden`-ing sibling content
 * rather than emitting `aria-modal`, so we add the APG modal-dialog attribute so the sheet
 * advertises its modality directly to assistive tech (same decision as Dialog). `cn()` merges the
 * caller `className` (caller wins).
 */
const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, side = 'right', ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-modal="true"
      className={cn(sheetContentVariants({ side }), className)}
      {...props}
    >
      {children}
      <DialogPrimitive.Close
        aria-label="Close"
        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-muted-raised hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:pointer-events-none"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

/**
 * SheetHeader - the stacked header region (title + description). Text-left, a small vertical gap.
 * `pr-6` keeps a long title clear of the absolutely-positioned close `X` in the top-right corner.
 */
const SheetHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 pr-6 text-left', className)} {...props} />
  ),
);
SheetHeader.displayName = 'SheetHeader';

/**
 * SheetFooter - the action region. Stacks reversed on mobile (the primary action ends up on top) and
 * becomes a right-aligned row on `sm+`, mirroring the Dialog footer layout. `mt-auto` pins it to the
 * bottom of the tall side panel.
 */
const SheetFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  ),
);
SheetFooter.displayName = 'SheetFooter';

/**
 * SheetTitle - the accessible title (`DialogPrimitive.Title`), in the `text-h3` role; Radix wires it
 * as the sheet's `aria-labelledby`.
 */
const SheetTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-h3', className)} {...props} />
));
SheetTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * SheetDescription - muted supporting copy (`DialogPrimitive.Description`), `text-body-sm` on the
 * muted text token; Radix wires it as the sheet's `aria-describedby`.
 */
const SheetDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-text-muted text-body-sm', className)}
    {...props}
  />
));
SheetDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetOverlay,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};

export type SheetProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
export type SheetTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
export type SheetCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
export type SheetOverlayProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;
export type SheetHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type SheetFooterProps = React.HTMLAttributes<HTMLDivElement>;
export type SheetTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
export type SheetDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;
