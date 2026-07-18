import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { buttonVariants } from '../seeds/Button';
import { cn } from '../lib/cn';

/**
 * AlertDialog - the confirmation sibling to `Dialog` (0024), built on
 * `@radix-ui/react-alert-dialog` (spec 0053). Where a `Dialog` is dismissable by design (scrim
 * click, `Esc`, corner `X`), an **AlertDialog** is **blocking**: it interrupts the user before a
 * destructive or otherwise irreversible action and only lets them out through an explicit
 * `AlertDialogCancel` or a deliberate `AlertDialogAction`.
 *
 * Radix ships those differences in the dedicated primitive rather than as a `Dialog` variant:
 * `AlertDialog.Content` emits `role="alertdialog"` (not `dialog`) and, unlike a regular Dialog, does
 * **not** close on pointer-down-outside and ships no `X`. Radix's alert-dialog still closes on `Esc`
 * out of the box, so `AlertDialogContent` suppresses that one path (see below) to make the alert
 * fully blocking - the only way out is Action or Cancel. Radix also supplies
 * the focus trap, return-focus, scroll lock, and the `aria-labelledby` / `aria-describedby` wiring
 * from Title/Description, and focuses `Cancel` on open so the safe choice is the default.
 *
 * Styling reuses the established Dialog surface: the scrim is the pre-provisioned `color-overlay`
 * token at reduced opacity (`bg-overlay/80`), the card sits on the raised-surface pattern
 * (`bg-surface-raised` + `border border-border` + `rounded-lg` + the primitive `shadow-lg`), and
 * motion reuses the shared `animate-dialog-*` keyframes gated with `motion-reduce:animate-none` - so
 * this Branch adds NO new token and NO new keyframe. There is NO `dark:` on the common path:
 * light/dark flips through the token layer (spec 0004), and because `.dark` lives on `<html>`, the
 * portalled overlay + content (mounted under `<body>`) theme correctly too.
 *
 * The family mirrors the shadcn/Radix surface:
 * - `AlertDialog` - the stateful root (`open` / `onOpenChange`; controlled or uncontrolled via
 *   `defaultOpen`).
 * - `AlertDialogTrigger` - opens the dialog; `asChild` to wrap a Button Seed.
 * - `AlertDialogContent` - the portalled blocking card (no `X`); owns the focus trap, return-focus,
 *   scroll lock (Radix); does not dismiss on outside-click or `Esc`.
 * - `AlertDialogHeader` / `AlertDialogFooter` - layout slots (stacked header; right-aligned footer).
 * - `AlertDialogTitle` - the accessible title (`text-h3`), wired as `aria-labelledby`.
 * - `AlertDialogDescription` - muted supporting copy (`text-body-sm`), wired as `aria-describedby`.
 * - `AlertDialogAction` - the affirmative (destructive) control, styled with the 0005 `destructive`
 *   Button tokens; overridable via `className`.
 * - `AlertDialogCancel` - the safe control, styled with the 0005 `outline` Button tokens; Radix
 *   focuses it on open.
 */
const AlertDialog = AlertDialogPrimitive.Root;

const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

/**
 * AlertDialogOverlay - the full-viewport scrim. `bg-overlay/80` is the pre-provisioned
 * `color-overlay` semantic token at reduced opacity, so the modal reads through it in both themes.
 * Fades in/out via Radix's `data-[state]` hooks, gated with `motion-reduce:animate-none`.
 * **Module-internal:** `AlertDialogContent` bakes in the scrim, so the overlay is not exported - a
 * public standalone overlay would be a double-scrim footgun (mirrors `DialogOverlay`).
 */
const AlertDialogOverlay = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-dialog-overlay-in data-[state=closed]:animate-dialog-overlay-out motion-reduce:animate-none',
      className,
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

/**
 * AlertDialogContent - the portalled blocking card. Rendered through `AlertDialogPrimitive.Portal`
 * (so it escapes overflow/stacking contexts) over the `AlertDialogOverlay`, centred in the viewport
 * on the raised-surface pattern (`bg-surface-raised` + `border border-border` + `rounded-lg` + the
 * primitive `shadow-lg`), `p-6`, capped at `max-w-lg`. Unlike `DialogContent` there is **no** `X`
 * close affordance: the only way out is `AlertDialogAction` or `AlertDialogCancel`. Enter/exit zoom
 * + fade is gated with `motion-reduce:animate-none`.
 *
 * We set `aria-modal="true"` explicitly (matching `DialogContent`): Radix marks the modal by
 * `aria-hidden`-ing sibling content rather than emitting `aria-modal`, so we add the APG
 * modal-dialog attribute directly. The primitive supplies `role="alertdialog"` and the
 * no-interact-outside-close default; we `preventDefault` `onEscapeKeyDown` so `Esc` cannot dismiss
 * either, completing the blocking contract.
 */
const AlertDialogContent = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, onEscapeKeyDown, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      aria-modal="true"
      // Blocking by default: Radix's AlertDialog.Content closes on `Esc` out of the box, so we
      // suppress the default dismissal to honour the spec's blocking contract (the only way out is
      // Action or Cancel). A caller's own `onEscapeKeyDown` still runs first, and can `preventDefault`
      // itself; if it does not, we prevent it, so `Esc` never closes the alert.
      onEscapeKeyDown={(event) => {
        onEscapeKeyDown?.(event);
        event.preventDefault();
      }}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-surface-raised p-6 text-text shadow-lg data-[state=open]:animate-dialog-content-in data-[state=closed]:animate-dialog-content-out motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

/**
 * AlertDialogHeader - the stacked header region (title + description). Text-left, a small vertical
 * gap. No `pr-6` is needed since there is no corner `X` to clear (unlike `DialogHeader`).
 */
const AlertDialogHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 text-left', className)} {...props} />
  ),
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

/**
 * AlertDialogFooter - the action region. Stacks reversed on mobile (the primary action ends up on
 * top) and becomes a right-aligned row on `sm+`, mirroring the shadcn footer layout.
 */
const AlertDialogFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  ),
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

/**
 * AlertDialogTitle - the accessible title (`AlertDialogPrimitive.Title`), in the `text-h3` role;
 * Radix wires it as the dialog's `aria-labelledby`.
 */
const AlertDialogTitle = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn('text-h3', className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

/**
 * AlertDialogDescription - muted supporting copy (`AlertDialogPrimitive.Description`), `text-body-sm`
 * on the muted text token; Radix wires it as the dialog's `aria-describedby`.
 */
const AlertDialogDescription = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-text-muted text-body-sm', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

/**
 * AlertDialogAction - the affirmative control (`AlertDialogPrimitive.Action`), which closes the
 * dialog when clicked (Radix). Styled with the 0005 `destructive` Button tokens (full literal, so
 * Tailwind v4's scanner emits them), since the alert's affirmative choice is the risky one. The
 * `buttonVariants` string comes first so a caller's `className` still wins via `cn()` (e.g. to
 * override to a non-destructive action). Branches importing a Seed is the allowed direction.
 */
const AlertDialogAction = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants({ variant: 'destructive' }), className)}
    {...props}
  />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

/**
 * AlertDialogCancel - the safe control (`AlertDialogPrimitive.Cancel`), which closes the dialog when
 * clicked (Radix) and is the default-focused control on open, so the safe path is the default.
 * Styled with the 0005 `outline` Button tokens; caller `className` wins via `cn()`.
 */
const AlertDialogCancel = React.forwardRef<
  React.ComponentRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(buttonVariants({ variant: 'outline' }), className)}
    {...props}
  />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};

export type AlertDialogProps = React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Root>;
export type AlertDialogTriggerProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Trigger
>;
export type AlertDialogContentProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Content
>;
export type AlertDialogHeaderProps = React.HTMLAttributes<HTMLDivElement>;
export type AlertDialogFooterProps = React.HTMLAttributes<HTMLDivElement>;
export type AlertDialogTitleProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Title
>;
export type AlertDialogDescriptionProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Description
>;
export type AlertDialogActionProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Action
>;
export type AlertDialogCancelProps = React.ComponentPropsWithoutRef<
  typeof AlertDialogPrimitive.Cancel
>;
