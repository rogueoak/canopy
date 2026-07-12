import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/cn';
import { useIsMobile } from '../lib/useMediaQuery';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './Dialog';

/**
 * ResponsiveDialog - the Dialog Branch's responsive form (spec 0031): ONE compound component whose
 * portalled surface is a centred modal on desktop and a bottom sheet on mobile, chosen at a single
 * breakpoint (`useIsMobile`, `max-width: 767px`). A phone can't comfortably reach or scroll a
 * centred `-translate-y-1/2` card; a sheet anchored to the bottom edge, sliding up into thumb reach,
 * is the platform-native form. Rather than ship both and toggle visibility (which would duplicate the
 * `role="dialog"` landmark), it mounts exactly one surface per breakpoint.
 *
 * The family mirrors Dialog one-for-one so a consumer swaps `Dialog*` → `ResponsiveDialog*` with no
 * other change:
 * - `ResponsiveDialog` / `ResponsiveDialogTrigger` / `ResponsiveDialogClose` are Radix Root/Trigger/
 *   Close (identical to Dialog) - the state machine, focus trap, scroll lock and ARIA contract are
 *   Radix's, shared by both forms.
 * - `ResponsiveDialogContent` is the only component that branches: desktop delegates to the canopy
 *   `DialogContent` verbatim (exact visual parity with a plain Dialog); mobile renders a bottom-anchored
 *   sheet (`bottom-sheet-*` motion from the Roots preset) with a grab-handle affordance and the same
 *   built-in `X` close.
 * - `ResponsiveDialogHeader` / `Footer` / `Title` / `Description` are the Dialog layout slots re-used
 *   unchanged - they compose correctly in both forms (the footer already stacks on mobile).
 *
 * `mobile` on the content is an explicit override (SSR/first paint, or a forced form in tests); when
 * omitted the breakpoint hook decides. Enter/exit motion is gated with `motion-reduce:animate-none`.
 */
const ResponsiveDialog = DialogPrimitive.Root;

const ResponsiveDialogTrigger = DialogPrimitive.Trigger;

const ResponsiveDialogClose = DialogPrimitive.Close;

/**
 * ResponsiveDialogOverlay - the mobile scrim. Identical to the (module-internal) Dialog overlay:
 * `bg-overlay/80` at reduced opacity, fading via Radix `data-[state]`, gated for reduced motion. The
 * desktop path reuses `DialogContent`, which bakes in its own overlay, so this is mobile-only.
 */
const ResponsiveDialogOverlay = React.forwardRef<
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
ResponsiveDialogOverlay.displayName = 'ResponsiveDialogOverlay';

export interface ResponsiveDialogContentProps extends React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> {
  /**
   * Force the rendered form regardless of viewport: `true` = bottom sheet, `false` = centred modal.
   * Omit to let the `useIsMobile()` breakpoint decide (the common case). Use it for an SSR/first-paint
   * override (mirrors SideNav's `mobile` prop) or to pin a form under test.
   */
  mobile?: boolean;
}

/**
 * ResponsiveDialogContent - the branch point. Desktop delegates to `DialogContent` verbatim (portal,
 * overlay, centred card, built-in close) so a wide viewport is pixel-identical to a plain Dialog.
 * Mobile renders a bottom-anchored sheet on the SAME `DialogPrimitive.Content`: full-width, capped at
 * `85vh` and scrollable, rounded only at the top, sliding up via `animate-bottom-sheet-in`. A centred
 * grab-handle bar signals the sheet affordance, and the same `X` close (Radix `Close`) sits top-right.
 */
const ResponsiveDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ResponsiveDialogContentProps
>(({ mobile: mobileOverride, className, children, ...props }, ref) => {
  const detected = useIsMobile();
  const mobile = mobileOverride ?? detected;

  if (!mobile) {
    return (
      <DialogContent ref={ref} className={className} {...props}>
        {children}
      </DialogContent>
    );
  }

  return (
    <DialogPrimitive.Portal>
      <ResponsiveDialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        aria-modal="true"
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col gap-4 overflow-y-auto rounded-t-lg border border-border bg-surface-raised p-6 pt-3 text-text shadow-lg data-[state=open]:animate-bottom-sheet-in data-[state=closed]:animate-bottom-sheet-out motion-reduce:animate-none',
          className,
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="mx-auto h-1.5 w-10 shrink-0 rounded-full bg-muted-raised"
        />
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
  );
});
ResponsiveDialogContent.displayName = 'ResponsiveDialogContent';

/** ResponsiveDialogHeader - the Dialog header slot, re-used unchanged (composes in both forms). */
const ResponsiveDialogHeader = DialogHeader;

/** ResponsiveDialogFooter - the Dialog footer slot; already stacks on mobile, right-aligns on `sm+`. */
const ResponsiveDialogFooter = DialogFooter;

/** ResponsiveDialogTitle - the Dialog accessible title (`aria-labelledby`), re-used unchanged. */
const ResponsiveDialogTitle = DialogTitle;

/** ResponsiveDialogDescription - the Dialog description (`aria-describedby`), re-used unchanged. */
const ResponsiveDialogDescription = DialogDescription;

export {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogFooter,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
};

export type ResponsiveDialogProps = React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
export type ResponsiveDialogTriggerProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Trigger
>;
export type ResponsiveDialogCloseProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Close
>;
