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
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerTitle } from './Drawer';

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
 *
 * **Two roots, one state (the 0067 refactor).** The mobile sheet now consumes canopy's `Drawer`
 * (0067, `direction="bottom"`) - built on `vaul` - so the sheet gains the swipe-to-close gesture. Both
 * a Radix `Dialog.Root` (desktop + the shared state owner) and a `vaul` `Drawer.Root` (mobile) mount
 * at the top, driven by ONE controllable open state in the `ResponsiveDialog` root, so the single
 * `ResponsiveDialogTrigger` opens whichever surface the breakpoint selects and any dismiss (button /
 * `Esc` / outside-click / swipe) closes both in lock-step. `ResponsiveDialogContent` still branches
 * per breakpoint - desktop delegates to `DialogContent` verbatim; mobile renders a bottom `DrawerContent`
 * - and the Title / Description / Close parts dispatch to the matching primitive (Radix on desktop,
 * vaul on mobile) via an internal context, so `aria-labelledby` / `aria-describedby` wire in the
 * surface's own dialog scope. The public surface is unchanged: a consumer still swaps `Dialog*` ->
 * `ResponsiveDialog*` with no other change.
 */

/**
 * Internal context carrying the resolved `mobile` form to the Title / Description / Close parts, which
 * must dispatch to vaul (mobile) or Radix (desktop) so their ARIA wires in the active dialog scope.
 * `ResponsiveDialogContent` provides it (it owns the `mobile` decision); the root seeds a default so
 * a stray Close/Trigger outside a Content still resolves to the breakpoint.
 */
interface ResponsiveDialogFormContextValue {
  mobile: boolean;
}
const ResponsiveDialogFormContext = React.createContext<ResponsiveDialogFormContextValue | null>(
  null,
);

function useResponsiveDialogForm(): ResponsiveDialogFormContextValue {
  return React.useContext(ResponsiveDialogFormContext) ?? { mobile: false };
}

/** A tiny controlled/uncontrolled boolean state hook (the standard React pattern). */
function useControllableOpen(
  value: boolean | undefined,
  defaultValue: boolean,
  onChange?: (next: boolean) => void,
): [boolean, (next: boolean) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? value : uncontrolled;
  const setState = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [state, setState];
}

/**
 * ResponsiveDialog - the root. Owns ONE controllable open state and mounts both a Radix `Dialog.Root`
 * and a `vaul` `Drawer.Root` (`direction="bottom"`) synced to it, so the single Trigger opens whichever
 * form the breakpoint selects and any dismiss closes both. Accepts the Radix `Dialog.Root` prop
 * surface (`open` / `defaultOpen` / `onOpenChange` / `modal` / children) unchanged.
 */
const ResponsiveDialog = ({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  modal,
  children,
}: ResponsiveDialogProps) => {
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);
  // Seed the form context from the active breakpoint so a `ResponsiveDialogClose` (or Trigger)
  // rendered OUTSIDE a `ResponsiveDialogContent` still dispatches to the surface the breakpoint
  // actually shows - without this default a sibling Close on a mobile viewport would target the
  // hidden desktop Radix scope instead of the visible vaul sheet. A Close nested inside Content still
  // wins via the Content-provided context (nearest provider). `useIsMobile()` returns `false` on the
  // server/first paint, matching the previous plain-Radix `Close` behaviour there.
  const mobile = useIsMobile();
  const rootFormValue = React.useMemo(() => ({ mobile }), [mobile]);
  return (
    <ResponsiveDialogFormContext.Provider value={rootFormValue}>
      <DialogPrimitive.Root open={open} onOpenChange={setOpen} modal={modal}>
        {/*
          Both roots mount driven by the same `open` state, but only ONE surface renders per
          breakpoint. On desktop the centred Radix `DialogContent` shows and no `DrawerContent`
          mounts, yet the vaul root still runs its root-level `usePositionFixed`/`useScaleBackground`;
          on Safari/iOS `usePositionFixed` would set `document.body.style.position = 'fixed'` on open,
          stacking a body lock on top of Radix's own scroll lock (a scroll-position jump). Pass
          `noBodyStyles` while desktop is active so the inert vaul root can never touch the body; the
          mobile branch (where the sheet actually shows) keeps vaul's body handling. We gate on the
          root's own `useIsMobile()` rather than the vaul open state so the `open` prop stays
          unconditional - the Content `mobile` OVERRIDE (used in tests / SSR hints) drives which
          surface renders, and must not be able to leave the vaul root closed while a `DrawerContent`
          mounts. jsdom stubs matchMedia to non-Safari, so this guards a real-browser-only path.
        */}
        <Drawer
          open={open}
          onOpenChange={setOpen}
          direction="bottom"
          modal={modal}
          noBodyStyles={!mobile}
        >
          {children}
        </Drawer>
      </DialogPrimitive.Root>
    </ResponsiveDialogFormContext.Provider>
  );
};
ResponsiveDialog.displayName = 'ResponsiveDialog';

/**
 * ResponsiveDialogTrigger - opens the dialog. Stays the Radix `Dialog.Trigger`: it drives the shared
 * open state (which is mirrored to the vaul root), so one trigger opens whichever surface the
 * breakpoint selects. `asChild` to wrap a Button Seed.
 */
const ResponsiveDialogTrigger = DialogPrimitive.Trigger;

/**
 * ResponsiveDialogClose - closes the dialog. Dispatches to the vaul `DrawerClose` on the mobile sheet
 * and the Radix `Dialog.Close` on the desktop modal, so the close resolves in the surface's own dialog
 * scope. `asChild` to wrap a Button (e.g. a footer "Cancel").
 */
const ResponsiveDialogClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>((props, ref) => {
  const { mobile } = useResponsiveDialogForm();
  return mobile ? (
    <DrawerClose ref={ref} {...props} />
  ) : (
    <DialogPrimitive.Close ref={ref} {...props} />
  );
});
ResponsiveDialogClose.displayName = 'ResponsiveDialogClose';

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
 * Mobile renders the canopy `Drawer` bottom sheet (0067, `vaul`): full-width, capped at `85vh` and
 * scrollable, rounded only at the top, sliding up via `animate-bottom-sheet-in`, now **swipe-to-close**.
 * A centred grab-handle bar signals the sheet affordance (baked into `DrawerContent`), and the same `X`
 * close sits top-right. It provides the `mobile` form to the child Title / Description / Close parts so
 * their ARIA wires in the active dialog scope (vaul's on mobile, Radix's on desktop).
 */
const ResponsiveDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  ResponsiveDialogContentProps
>(({ mobile: mobileOverride, className, children, ...props }, ref) => {
  const detected = useIsMobile();
  const mobile = mobileOverride ?? detected;
  const formValue = React.useMemo(() => ({ mobile }), [mobile]);

  if (!mobile) {
    return (
      <ResponsiveDialogFormContext.Provider value={formValue}>
        <DialogContent ref={ref} className={className} {...props}>
          {children}
        </DialogContent>
      </ResponsiveDialogFormContext.Provider>
    );
  }

  return (
    <ResponsiveDialogFormContext.Provider value={formValue}>
      <DrawerContent
        ref={ref}
        direction="bottom"
        showHandle
        className={cn('gap-4 overflow-y-auto p-6 pt-3', className)}
        {...props}
      >
        {children}
        <ResponsiveDialogClose
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
        </ResponsiveDialogClose>
      </DrawerContent>
    </ResponsiveDialogFormContext.Provider>
  );
});
ResponsiveDialogContent.displayName = 'ResponsiveDialogContent';

/** ResponsiveDialogHeader - the Dialog header slot, re-used unchanged (composes in both forms). */
const ResponsiveDialogHeader = DialogHeader;

/** ResponsiveDialogFooter - the Dialog footer slot; already stacks on mobile, right-aligns on `sm+`. */
const ResponsiveDialogFooter = DialogFooter;

/**
 * ResponsiveDialogTitle - the accessible title (`aria-labelledby`). Dispatches to the vaul `DrawerTitle`
 * on the mobile sheet and the Radix `DialogTitle` on the desktop modal, so it registers in the surface's
 * own dialog scope. Same `text-h3` role in both forms (the desktop `DialogTitle`; the vaul title is
 * given the matching role here).
 */
const ResponsiveDialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogTitle>,
  React.ComponentPropsWithoutRef<typeof DialogTitle>
>(({ className, ...props }, ref) => {
  const { mobile } = useResponsiveDialogForm();
  return mobile ? (
    <DrawerTitle ref={ref} className={cn('text-h3', className)} {...props} />
  ) : (
    <DialogTitle ref={ref} className={className} {...props} />
  );
});
ResponsiveDialogTitle.displayName = 'ResponsiveDialogTitle';

/**
 * ResponsiveDialogDescription - the description (`aria-describedby`). Dispatches to the vaul
 * `DrawerDescription` (mobile) or the Radix `DialogDescription` (desktop) so it registers in the active
 * dialog scope. Same muted `text-body-sm` role in both forms.
 */
const ResponsiveDialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogDescription>,
  React.ComponentPropsWithoutRef<typeof DialogDescription>
>(({ className, ...props }, ref) => {
  const { mobile } = useResponsiveDialogForm();
  return mobile ? (
    <DrawerDescription ref={ref} className={className} {...props} />
  ) : (
    <DialogDescription ref={ref} className={className} {...props} />
  );
});
ResponsiveDialogDescription.displayName = 'ResponsiveDialogDescription';

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
