import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/cn';

/**
 * Dialog — the first canopy Branch (organism, spec 0024), built on `@radix-ui/react-dialog`.
 * Where a Seed is an atom and a Twig composes atoms, a **Branch** owns interaction state and a
 * portal: Radix supplies the open/close state machine, the focus trap, return-focus, scroll lock,
 * and the `role="dialog"` + `aria-modal` / `aria-labelledby` / `aria-describedby` ARIA contract,
 * so this component is composition + token styling — not hand-rolled focus management.
 *
 * It reuses the established raised-surface pattern (the third portalled surface after Select 0013
 * and Tooltip 0014): the content card sits on `bg-surface-raised` + `border` + the primitive
 * `shadow-lg`, and the scrim uses the **pre-provisioned** `color-overlay` token at reduced opacity
 * (`bg-overlay/80`) — so the first Branch adds NO new token. There is NO `dark:` on the common
 * path: light/dark flips through the token layer (spec 0004), and because `.dark` lives on
 * `<html>`, the portalled overlay + content (mounted under `<body>`) theme correctly too.
 *
 * The family mirrors the shadcn surface area:
 * - `Dialog` — the stateful root (`open` / `onOpenChange`; controlled or uncontrolled via
 *   `defaultOpen`).
 * - `DialogTrigger` — opens the dialog; `asChild` to wrap a Button Seed.
 * - `DialogClose` — closes the dialog; `asChild` to wrap a Button (e.g. a footer "Cancel").
 * - `DialogContent` — the portalled card with a built-in `X` close affordance; owns focus trap,
 *   return-focus, scroll lock, and `Esc`-to-close (Radix).
 * - `DialogHeader` / `DialogFooter` — layout slots (stacked header; right-aligned action footer).
 * - `DialogTitle` — the accessible title (`text-h3`), wired as `aria-labelledby`.
 * - `DialogDescription` — muted supporting copy (`text-body-sm`), wired as `aria-describedby`.
 *
 * Enter/exit fade + zoom are gated with `motion-reduce:animate-none`, so a reduced-motion user
 * gets an instant show/hide. The named `animate-dialog-*` keyframes + utilities now ship from the
 * Roots **preset** (`@rogueoak/roots/tailwind-preset.css`, composing the `--duration-*`/`--ease-*`
 * motion tokens), so the motion works out of the box for any consumer importing the preset — no
 * longer consumer-provided. Centred modal only — drawer/sheet and `alertdialog` are later specs
 * (spec 0024, Out of scope).
 */
const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogClose = DialogPrimitive.Close;

/**
 * DialogOverlay — the full-viewport scrim. `bg-overlay/80` is the pre-provisioned `color-overlay`
 * semantic token (authored in 0004 "used at reduced opacity behind modals") at reduced opacity, so
 * the modal reads through it in both themes. Fades in/out via Radix's `data-[state]` hooks, gated
 * with `motion-reduce:animate-none`. **Module-internal:** `DialogContent` bakes in the scrim, so the
 * overlay is not exported — a public standalone overlay would be a double-scrim footgun.
 */
const DialogOverlay = React.forwardRef<
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
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

/**
 * DialogContent — the portalled content card. Rendered through `DialogPrimitive.Portal` (so it
 * escapes overflow/stacking contexts) over the `DialogOverlay`, centred in the viewport on the
 * raised-surface pattern (`bg-surface-raised` + `border border-border` + `rounded-lg` + the
 * primitive `shadow-lg`), `p-6`, capped at `max-w-lg`. Includes a built-in close affordance: an
 * `X`-icon `DialogClose` (inline SVG using `currentColor`, `aria-hidden`) with `aria-label="Close"`,
 * the `muted-raised` hover fill (the raised-surface lift) and the shared focus-visible ring. Enter/
 * exit zoom + fade is gated with `motion-reduce:animate-none`.
 *
 * We set `aria-modal="true"` explicitly: Radix marks the modal by `aria-hidden`-ing sibling content
 * (the `aria-hidden` lib) rather than emitting `aria-modal`, so we add the APG modal-dialog
 * attribute so the dialog advertises its modality directly to assistive tech.
 */
const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      aria-modal="true"
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-surface-raised p-6 text-text shadow-lg data-[state=open]:animate-dialog-content-in data-[state=closed]:animate-dialog-content-out motion-reduce:animate-none',
        className,
      )}
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
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

/**
 * DialogHeader — the stacked header region (title + description). Text-left, a small vertical gap.
 * `pr-6` keeps a long title clear of the absolutely-positioned close `X` in the top-right corner.
 */
const DialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 pr-6 text-left', className)} {...props} />
  ),
);
DialogHeader.displayName = 'DialogHeader';

/**
 * DialogFooter — the action region. Stacks reversed on mobile (the primary action ends up on top)
 * and becomes a right-aligned row on `sm+`, mirroring the shadcn footer layout.
 */
const DialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  ),
);
DialogFooter.displayName = 'DialogFooter';

/**
 * DialogTitle — the accessible title (`DialogPrimitive.Title`), in the `text-h3` role; Radix wires
 * it as the dialog's `aria-labelledby`.
 */
const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-h3', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

/**
 * DialogDescription — muted supporting copy (`DialogPrimitive.Description`), `text-body-sm` on the
 * muted text token; Radix wires it as the dialog's `aria-describedby`.
 */
const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-text-muted text-body-sm', className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

export type DialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
export type DialogTriggerProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
export type DialogCloseProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
export type DialogContentProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;
export type DialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type DialogFooterProps = React.HTMLAttributes<HTMLDivElement>;
export type DialogTitleProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
export type DialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Description
>;
