import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Toast - the canopy transient-notification Branch (spec 0058), built on
 * `@radix-ui/react-toast`. A Branch owns interaction state and a portal: Radix supplies the
 * enqueue/dequeue queue, the auto-dismiss timers with hover/focus pause, swipe-to-dismiss, and -
 * critically - the portalled `Viewport` that is a managed ARIA **live region**, so screen readers
 * announce new toasts without us wiring `aria-live` by hand. This component is composition + token
 * styling, not a hand-rolled notification region.
 *
 * There is NO `dark:` on the common path: light/dark flips through the token layer (spec 0004), and
 * because `.dark` lives on `<html>`, the portalled viewport (mounted under `<body>`) themes
 * correctly too - the same note as `DialogContent` (0021). All class strings are FULL LITERALS so
 * Tailwind v4's scanner emits each utility - never build a class name dynamically.
 *
 * The family mirrors the shadcn-on-Radix toast surface area:
 * - `ToastProvider` - thin wrapper over `Toast.Provider`; owns `swipeDirection` (default `right`)
 *   and the default `duration` for every toast beneath it.
 * - `ToastViewport` - the fixed, corner-anchored region toasts stack into (the real ARIA live
 *   region managed by Radix); rendered once near the app root.
 * - `Toast` - a single notification with a `variant` of `default` / `success` / `danger`; slides
 *   in from the viewport edge, auto-dismisses after its duration, and is swipe-dismissable.
 * - `ToastTitle` / `ToastDescription` - the labelled title and supporting body, wired to the toast
 *   so assistive tech announces them together.
 * - `ToastAction` - an optional inline action button (e.g. "Undo"), carrying the `altText` Radix
 *   requires for the announced accessible action.
 * - `ToastClose` - a labelled dismiss control (an "x") that closes the toast immediately.
 *
 * For the common case there is an imperative layer: `useToast()` returns `toast({...})` (enqueue,
 * returns an id) and `dismiss(id?)`, and the `Toaster` convenience mounts the provider + viewport
 * and maps the queue to `Toast` instances - so `const { toast } = useToast(); toast({ title })`
 * needs no hand-written JSX. Promise/async toasts, rich content slots, and multi-viewport
 * placement are later specs (spec 0058, Out of scope).
 */
const ToastProvider = ToastPrimitive.Provider;

/**
 * ToastViewport - `Toast.Viewport` styled as a fixed, corner-anchored `z-50` stack: pinned to the
 * bottom-right on `sm+` (top on mobile so it clears the thumb zone), a small `gap`, `p-4`, and a
 * capped `max-w-sm` so a long toast wraps instead of stretching. Portalled under `<body>` by Radix,
 * it inherits `.dark` from `<html>` (same note as `DialogContent`), so there is no per-portal theme
 * wiring. Radix makes this element the announced live region - we do not re-implement `aria-live`.
 */
const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed top-0 z-50 flex max-h-screen w-full flex-col gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-sm',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

/**
 * toastVariants - the cva recipe mapping `variant` onto full-literal semantic-token utilities. The
 * base carries the raised-surface card layout (a raised surface floats above the page), the
 * `rounded-md border shadow-md p-4` frame, the two-column grid (text + trailing action/close), and
 * the slide/fade motion keyed off Radix's `data-state` / `data-swipe` attributes - all gated with
 * `motion-reduce:animate-none` so reduced-motion users get an instant, static toast.
 *
 * `default` is the raised neutral surface (`bg-surface-raised` per the raised-surface rule) with a
 * hairline border and the default text token; `success` / `danger` are the solid status fills with
 * their paired `*-foreground` text and a transparent border (the fill carries the meaning), matching
 * the Alert (0040) role idiom - the title/description parts inherit this foreground via `text-current`
 * so the variant colour reaches the text.
 */
export const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-md data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out data-[swipe=end]:animate-fade-out motion-reduce:animate-none data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
  {
    variants: {
      variant: {
        default: 'border-border bg-surface-raised text-text',
        success: 'border-transparent bg-success text-success-foreground',
        danger: 'border-transparent bg-danger text-danger-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface ToastProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

/**
 * Toast - `Toast.Root`, the single notification. `forwardRef` + a full native prop spread, `cn()`
 * merge with the caller `className` winning. The `variant` maps through `toastVariants`; Radix owns
 * the open/close state, the auto-dismiss timer (`duration`), hover/focus pause, and swipe-to-dismiss.
 */
const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  ToastProps
>(({ className, variant, ...props }, ref) => (
  <ToastPrimitive.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
));
Toast.displayName = ToastPrimitive.Root.displayName;

/**
 * ToastTitle - the accessible title (`Toast.Title`) at the `label` typography role. It INHERITS the
 * root's variant foreground (`text-current`) rather than pinning a fixed colour, so it reads on the
 * `success` / `danger` fills as well as the neutral surface. Radix wires it into the announced
 * message.
 */
const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Title
    ref={ref}
    className={cn('text-label font-medium text-current', className)}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitive.Title.displayName;

/**
 * ToastDescription - the supporting body (`Toast.Description`) at `body-sm`. It INHERITS the root's
 * variant foreground (`text-current`) and expresses the muted step as `opacity-90` rather than
 * pinning `text-text-muted` (a grey that only pairs with the page surface), so it reads against every
 * fill - matching the Alert (0040) idiom. Radix announces it with the title.
 */
const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Description
    ref={ref}
    className={cn('text-body-sm text-current opacity-90', className)}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitive.Description.displayName;

/**
 * ToastAction - `Toast.Action`, an optional inline action button (e.g. "Undo"), styled as a compact
 * outline affordance with the shared focus-visible ring. Radix REQUIRES `altText` so the action is
 * described when the toast is announced; it is a real prop passed straight through. `forwardRef` +
 * native prop spread; `cn()` caller-wins merge.
 */
const ToastAction = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Action
    ref={ref}
    className={cn(
      'inline-flex h-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-strong bg-transparent px-3 text-sm font-medium text-current transition-colors hover:bg-muted-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitive.Action.displayName;

/**
 * ToastClose - `Toast.Close` as a labelled icon `button` (an "x") that dismisses the toast
 * immediately. Defaults `aria-label` to `Close` (overridable via a caller `aria-label`, applied
 * after so the caller wins). The close glyph is an inline `currentColor` SVG marked `aria-hidden`,
 * so the button's accessible name comes only from the label. Uses the raised-surface `muted-raised`
 * hover lift and the shared focus-visible ring.
 */
const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Close
    ref={ref}
    aria-label="Close"
    className={cn(
      'inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-current opacity-70 transition-opacity hover:bg-muted-raised hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset',
      className,
    )}
    {...props}
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
  </ToastPrimitive.Close>
));
ToastClose.displayName = ToastPrimitive.Close.displayName;

/* ------------------------------------------------------------------ imperative */

/**
 * ToastOptions - the payload for the imperative `toast(...)` enqueue. Everything but the message is
 * optional: a `variant` (default `default`), a `duration` (falls back to the provider default), and
 * an optional `action` (its `label` + `altText` + `onClick`) rendered as a `ToastAction`.
 */
export interface ToastActionOptions {
  /** The visible action label (e.g. "Undo"). */
  label: React.ReactNode;
  /** Radix-required text describing the action for the announced message (e.g. "Undo the delete"). */
  altText: string;
  /** Fired when the action is activated. */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export interface ToastOptions {
  /** The toast title (the primary line). */
  title?: React.ReactNode;
  /** Supporting body copy under the title. */
  description?: React.ReactNode;
  /** Colour role: `default` neutral, `success` positive, `danger` error. */
  variant?: VariantProps<typeof toastVariants>['variant'];
  /** Per-toast auto-dismiss in ms; falls back to the provider default when omitted. */
  duration?: number;
  /** An optional inline action (e.g. "Undo") with its Radix-required `altText`. */
  action?: ToastActionOptions;
}

/** A queued toast: the caller options plus the generated id and its current open state. */
interface QueuedToast extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextValue {
  toasts: QueuedToast[];
  toast: (options: ToastOptions) => string;
  dismiss: (id?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

let toastCount = 0;
function nextToastId(): string {
  toastCount += 1;
  return `toast-${toastCount}`;
}

/**
 * useToast - the imperative hook. Returns `toast({ title, description, variant, action, duration })`
 * (enqueues a toast from anywhere under a `Toaster`, returns its id) and `dismiss(id?)` (closes one
 * toast by id, or every open toast when called with no argument). Must be used within a `Toaster`.
 */
function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext);
  if (context == null) {
    throw new Error('useToast must be used within a <Toaster> (or ToastContext provider).');
  }
  return context;
}

export interface ToasterProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Provider> {
  /** Extra classes for the rendered `ToastViewport`. */
  viewportClassName?: string;
}

/**
 * Toaster - the convenience wrapper. Mounts `ToastProvider` + `ToastViewport` and owns the queue,
 * mapping each enqueued item to a styled `Toast` (with its `ToastTitle` / `ToastDescription` /
 * optional `ToastAction` / `ToastClose`). Drop one `<Toaster />` near the app root; anywhere beneath
 * it `const { toast } = useToast()` fires notifications with no hand-written JSX. Provider props
 * (`swipeDirection`, default `duration`, `label`) pass straight through.
 *
 * A closed toast is removed from the queue on Radix's `onOpenChange(false)` (which fires after the
 * exit animation / swipe / timeout), so the DOM does not accumulate dismissed toasts.
 */
function Toaster({ children, viewportClassName, ...providerProps }: ToasterProps) {
  const [toasts, setToasts] = React.useState<QueuedToast[]>([]);

  const toast = React.useCallback((options: ToastOptions): string => {
    const id = nextToastId();
    setToasts((current) => [...current, { ...options, id, open: true }]);
    return id;
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    setToasts((current) =>
      current.map((item) => (id == null || item.id === id ? { ...item, open: false } : item)),
    );
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss }),
    [toasts, toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastProvider {...providerProps}>
        {children}
        {toasts.map(({ id, title, description, variant, duration, action, open }) => (
          <Toast
            key={id}
            variant={variant}
            duration={duration}
            open={open}
            onOpenChange={(next) => {
              if (!next) {
                dismiss(id);
                remove(id);
              }
            }}
          >
            <div className="flex min-w-0 flex-col gap-1">
              {title != null ? <ToastTitle>{title}</ToastTitle> : null}
              {description != null ? <ToastDescription>{description}</ToastDescription> : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {action != null ? (
                <ToastAction altText={action.altText} onClick={action.onClick}>
                  {action.label}
                </ToastAction>
              ) : null}
              <ToastClose />
            </div>
          </Toast>
        ))}
        <ToastViewport className={viewportClassName} />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  Toaster,
  useToast,
};

export type ToastProviderProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Provider>;
export type ToastViewportProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>;
export type ToastTitleProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>;
export type ToastDescriptionProps = React.ComponentPropsWithoutRef<
  typeof ToastPrimitive.Description
>;
export type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>;
export type ToastCloseProps = React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>;
