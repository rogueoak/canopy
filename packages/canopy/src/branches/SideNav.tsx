import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';
import { Button, type ButtonProps } from '../seeds/Button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../seeds/Tooltip';

/**
 * SideNav - the vertical side-navigation Branch (organism, spec 0026), the companion to TopNav
 * (0025) and the third Branch. A landmark organism that lists grouped navigation items (icon +
 * label, with an `active` affordance) down the side of an app shell, responsive in two axes:
 *
 * - **Collapsible (desktop):** a controlled/uncontrolled `collapsed` state shrinks the rail to an
 *   icon column (`w-60` → `w-16`); section + item labels hide and each item surfaces its label via
 *   a **Tooltip** Seed (0014) on hover/focus, so the rail stays usable without ever shipping an
 *   unlabelled link (the icon-only-controls-need-a-name a11y rule).
 * - **Off-canvas drawer (mobile):** below `768px` the rail becomes a left drawer built directly on
 *   **`@radix-ui/react-dialog`** - the Radix *primitive*, NOT canopy's centred `Dialog` component
 *   (whose centring / `max-w-lg` / baked close button would fight a side drawer). Reusing the Radix
 *   primitive (the spec's "reuse Dialog's pattern, don't re-invent modal mechanics") gives the focus
 *   trap, return-focus, scroll lock, `Esc` and outside-click dismiss for free; we style its
 *   `Overlay` as the `bg-overlay/80` scrim and its `Content` as a full-height left panel.
 *
 * A `useIsMobile()` matchMedia hook picks the wrapper so the single `<nav aria-label>` landmark
 * renders exactly **once** - no duplicated navigation landmark, no double `aria-current`. There is
 * NO `dark:` on the common path and NO new token: the rail/drawer/scrim/items style on existing
 * semantic tokens (`bg-surface`, `border-border`, `color-overlay`, `muted`, the text roles), and
 * light/dark flips through the token layer (spec 0004) - the Radix-portalled drawer (mounted under
 * `<body>`) themes correctly because `.dark` lives on `<html>`.
 *
 * The family:
 * - `SideNav` - the root: an `<aside>`/`<nav>` rail on desktop, a Radix-Dialog drawer on mobile;
 *   owns the `collapsed` + mobile-`open` state in a `SideNavContext` and wraps a `TooltipProvider`.
 * - `SideNavHeader` / `SideNavFooter` - optional top/bottom slots (brand, an Avatar, the toggle).
 * - `SideNavSection` - a group of items with an optional `label` that hides when collapsed.
 * - `SideNavItem` - a nav link (icon + label; `active` → `aria-current="page"` + active styling;
 *   `asChild` to wrap a router `<Link>`; collapsed → centred icon + Tooltip label).
 * - `SideNavTrigger` - the mobile menu Button that opens the drawer (`aria-expanded`/`-controls`).
 * - `SideNavCollapseToggle` - a Button that flips `collapsed` (desktop only).
 */

/* --------------------------------------------------------------- controllable state */

/**
 * A tiny controlled/uncontrolled state hook (the standard React pattern): when `value` is provided
 * the component is controlled (the prop owns the state, `onChange` reports intent); otherwise it
 * holds its own state seeded from `defaultValue`. Used for both `collapsed` and the mobile `open`.
 */
function useControllableState(
  value: boolean | undefined,
  defaultValue: boolean,
  onChange?: (next: boolean) => void,
): [boolean, (next: boolean) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue);
  const isControlled = value !== undefined;
  const state = isControlled ? value : uncontrolled;
  const setState = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolled(next);
      }
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [state, setState];
}

/**
 * useIsMobile - subscribes to `(max-width: 767px)` via `matchMedia`, so the rail switches between
 * its desktop and drawer forms at a single breakpoint. SSR/first render returns `false` (desktop)
 * since there is no `window`; the effect then reads `.matches` and tracks `change`. Returning one
 * boolean (rather than rendering both forms behind `md:` visibility utilities) is what keeps the
 * `<nav>` landmark single.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mql = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return isMobile;
}

/* ------------------------------------------------------------------------- context */

interface SideNavContextValue {
  /** Whether the desktop rail is collapsed to an icon column (always `false` on mobile). */
  collapsed: boolean;
  /** Flip the collapse state (the `SideNavCollapseToggle` calls this). */
  setCollapsed: (next: boolean) => void;
  /** Whether the mobile drawer is open. */
  open: boolean;
  /** Open/close the mobile drawer. */
  setOpen: (next: boolean) => void;
  /** Whether the viewport is below the breakpoint (the rail is a drawer). */
  mobile: boolean;
  /** Close the mobile drawer (no-op on desktop). */
  closeDrawer: () => void;
}

const SideNavContext = React.createContext<SideNavContextValue | null>(null);

function useSideNavContext(component: string): SideNavContextValue {
  const context = React.useContext(SideNavContext);
  if (!context) {
    throw new Error(`<${component}> must be used within a <SideNav>.`);
  }
  return context;
}

/* ---------------------------------------------------------------------------- root */

export interface SideNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Controlled collapse state (desktop): `true` shrinks the rail to an icon column. */
  collapsed?: boolean;
  /** Uncontrolled initial collapse state (desktop). Default `false` (expanded). */
  defaultCollapsed?: boolean;
  /** Called with the next collapse state when the built-in toggle flips it. */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Controlled open state for the mobile drawer. */
  open?: boolean;
  /** Uncontrolled initial open state for the mobile drawer. Default `false` (closed). */
  defaultOpen?: boolean;
  /** Called with the next open state when the mobile drawer opens/closes. */
  onOpenChange?: (open: boolean) => void;
  /**
   * SSR/first-paint override for the responsive form. By default SideNav reads `useIsMobile()` (a
   * `matchMedia` hook) which returns `false` (desktop) on the server and first client render, then
   * corrects after mount - so an app whose first paint should be the drawer briefly flashes the
   * desktop rail. Pass `mobile` (e.g. from a server-side user-agent / viewport hint) to **override**
   * that detection and render the correct form on first paint. Omit it to let `useIsMobile()` decide.
   */
  mobile?: boolean;
}

/**
 * SideNav - the root. On desktop it renders a static `<aside>` rail wrapping the `<nav aria-label>`
 * landmark, sized `w-60` (expanded) / `w-16` (collapsed) with a `transition-[width]`. On mobile it
 * renders the `@radix-ui/react-dialog` left drawer: a `bg-overlay/80` `Overlay` scrim (fading with
 * the shared `animate-dialog-overlay-*`) + a left-anchored full-height `Content` panel that **slides
 * in/out** (`animate-drawer-in`/`-out`, from the Roots preset) and sits on the raised-surface lift
 * (`bg-surface-raised` + `shadow-lg` + `border-r`), holding an sr-only `DialogPrimitive.Title` (Radix
 * requires a Title for the dialog's accessible name), a visible `X` close affordance, and the `<nav>`
 * landmark. Either way exactly one `<nav>` renders.
 *
 * The **public surface lands on the rail panel** in both forms - the forwarded `ref`, `className`,
 * and native `{...props}` go to the styled `<aside>` on desktop and to `DialogPrimitive.Content` (the
 * drawer panel, a `div`) on mobile, so a caller's `className` styles the same conceptual element
 * regardless of viewport. The inner `<nav aria-label>` is a static landmark wrapper in both forms.
 * Note the forwarded **ref is `null` while the mobile drawer is closed** (the panel is unmounted).
 *
 * Everything is wrapped in a `TooltipProvider` so collapsed item Tooltips work with no consumer
 * setup. The `collapsed`/`open` state lives in a `SideNavContext` the parts consume.
 */
export const SideNav = React.forwardRef<HTMLElement, SideNavProps>(
  (
    {
      className,
      children,
      id,
      collapsed: collapsedProp,
      defaultCollapsed = false,
      onCollapsedChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      mobile: mobileProp,
      'aria-label': ariaLabel = 'Main',
      ...props
    },
    ref,
  ) => {
    const detectedMobile = useIsMobile();
    // An explicit `mobile` prop overrides the matchMedia detection (SSR/first-paint correctness).
    const mobile = mobileProp ?? detectedMobile;
    const [collapsed, setCollapsed] = useControllableState(
      collapsedProp,
      defaultCollapsed,
      onCollapsedChange,
    );
    const [open, setOpen] = useControllableState(openProp, defaultOpen, onOpenChange);
    const generatedId = React.useId();
    const drawerId = id ?? generatedId;
    // The element focused when the drawer opened, so we can return focus there on close.
    const openerRef = React.useRef<HTMLElement | null>(null);
    // Closes the mobile drawer; a no-op on desktop (there is no drawer to close).
    const closeDrawer = React.useCallback(() => {
      if (mobile) setOpen(false);
    }, [mobile, setOpen]);

    // On mobile the rail is always expanded (the drawer has room for labels); the underlying
    // collapse state is preserved for when the viewport returns to desktop.
    const effectiveCollapsed = mobile ? false : collapsed;

    const contextValue = React.useMemo<SideNavContextValue>(
      () => ({
        collapsed: effectiveCollapsed,
        setCollapsed,
        open,
        setOpen,
        mobile,
        closeDrawer,
      }),
      [effectiveCollapsed, setCollapsed, open, setOpen, mobile, closeDrawer],
    );

    return (
      <SideNavContext.Provider value={contextValue}>
        <TooltipProvider>
          {mobile ? (
            <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
              <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-overlay/80 data-[state=open]:animate-dialog-overlay-in data-[state=closed]:animate-dialog-overlay-out motion-reduce:animate-none" />
                <DialogPrimitive.Content
                  ref={ref as React.Ref<HTMLDivElement>}
                  id={drawerId}
                  // No Radix `DialogTrigger` is rendered (the `SideNavTrigger` is a decoupled sibling
                  // in the app bar), so Radix's `onCloseAutoFocus` would focus a *null* `triggerRef`
                  // and `preventDefault()` the FocusScope restore - losing focus to `<body>`. This is
                  // NOT redundant with Radix: we manually capture the opener in `onOpenAutoFocus`
                  // (which fires while `document.activeElement` is still the element that opened the
                  // drawer, before focus moves in) and restore it in `onCloseAutoFocus`
                  // (`preventDefault()` + `openerRef.focus()`), which is what returns focus to the
                  // external trigger that Radix can't reach.
                  onOpenAutoFocus={() => {
                    openerRef.current = (document.activeElement as HTMLElement | null) ?? null;
                  }}
                  onCloseAutoFocus={(event) => {
                    event.preventDefault();
                    openerRef.current?.focus();
                  }}
                  className={cn(
                    'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-surface-raised p-0 text-text shadow-lg data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out motion-reduce:animate-none',
                    className,
                  )}
                  {...props}
                >
                  <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
                  <DialogPrimitive.Close
                    aria-label="Close navigation"
                    className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-muted-raised hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:pointer-events-none"
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
                  <nav
                    aria-label={ariaLabel}
                    className="flex h-full flex-col gap-1 overflow-y-auto p-2"
                  >
                    {children}
                  </nav>
                </DialogPrimitive.Content>
              </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
          ) : (
            <aside
              ref={ref as React.Ref<HTMLElement>}
              id={drawerId}
              className={cn(
                'flex h-full flex-col border-r border-border bg-surface text-text transition-[width]',
                effectiveCollapsed ? 'w-16' : 'w-60',
                className,
              )}
              {...props}
            >
              <nav
                aria-label={ariaLabel}
                className="flex h-full flex-col gap-1 overflow-y-auto p-2"
              >
                {children}
              </nav>
            </aside>
          )}
        </TooltipProvider>
      </SideNavContext.Provider>
    );
  },
);
SideNav.displayName = 'SideNav';

/**
 * useSideNavCollapsed - read the rail's `{ collapsed, mobile }` from context, for a custom
 * (`asChild`) `SideNavItem` that needs to adapt to the collapsed icon-rail itself (e.g. render its
 * own Tooltip surfacing the label, since the default `<a>` path's collapsed treatment isn't applied
 * to an `asChild` element). Throws the same "must be used within a <SideNav>" error if called outside
 * a `<SideNav>`.
 */
export function useSideNavCollapsed(): { collapsed: boolean; mobile: boolean } {
  const { collapsed, mobile } = useSideNavContext('useSideNavCollapsed');
  return { collapsed, mobile };
}

/* -------------------------------------------------------------------- header/footer */

export type SideNavHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/** SideNavHeader - an optional top slot (brand, a collapse toggle). A flush row with a small gap. */
export const SideNavHeader = React.forwardRef<HTMLDivElement, SideNavHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 p-2', className)} {...props} />
  ),
);
SideNavHeader.displayName = 'SideNavHeader';

export type SideNavFooterProps = React.HTMLAttributes<HTMLDivElement>;

/** SideNavFooter - an optional bottom slot (a user Avatar, the toggle), pushed down with `mt-auto`. */
export const SideNavFooter = React.forwardRef<HTMLDivElement, SideNavFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-auto flex items-center gap-2 p-2', className)} {...props} />
  ),
);
SideNavFooter.displayName = 'SideNavFooter';

/* ------------------------------------------------------------------------- section */

export interface SideNavSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** An optional muted group heading (`text-caption`), hidden when the rail is collapsed. */
  label?: React.ReactNode;
}

/**
 * SideNavSection - a `role="group"` of items with an optional muted `label` heading. When the rail
 * is collapsed the heading is hidden (icons only); the items stack with a small gap.
 */
export const SideNavSection = React.forwardRef<HTMLDivElement, SideNavSectionProps>(
  ({ className, label, children, ...props }, ref) => {
    const { collapsed } = useSideNavContext('SideNavSection');
    return (
      <div ref={ref} role="group" className={cn('flex flex-col gap-1 py-2', className)} {...props}>
        {label && !collapsed ? (
          <div className="px-3 py-1 text-caption text-text-muted">{label}</div>
        ) : null}
        {children}
      </div>
    );
  },
);
SideNavSection.displayName = 'SideNavSection';

/* ---------------------------------------------------------------------------- item */

export interface SideNavItemProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /** The leading icon, rendered in a fixed `h-5 w-5` box (pass an inline SVG or an Icon Seed). */
  icon?: React.ReactNode;
  /**
   * Marks the item as the current page: sets `aria-current="page"` AND the active token styling
   * (`bg-muted text-text`). Driven by the consumer's router - styling is never inferred.
   */
  active?: boolean;
  /**
   * Render as the single child element instead of an `<a>` (Radix `Slot`) - e.g. a router `<Link>`.
   * In `asChild` mode SideNavItem applies the item styling, `aria-current`, and the drawer-closing
   * click handler to your element, but does **not** inject the `icon` box or the collapsed
   * `sr-only`/Tooltip label treatment - compose the item's inner content (icon + label) inside your
   * link so the layout stays yours. The default (`<a>`) path provides all of that for you. To adapt
   * a custom item to the collapsed icon-rail (e.g. render your own Tooltip), read the rail state with
   * the exported {@link useSideNavCollapsed} hook.
   */
  asChild?: boolean;
}

const itemClasses = (collapsed: boolean, active: boolean, mobile: boolean, className?: string) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2 text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    collapsed && 'justify-center',
    // ≥44px touch target in the mobile drawer (the desktop rail uses the denser default height).
    mobile && 'min-h-11',
    active
      ? // A collapsed-active item shows only its icon, so brand-colour it (`text-primary`) - distinct
        // from a merely-hovered idle item, which also lifts to `bg-muted` but stays `text-text`.
        cn('bg-muted font-medium', collapsed ? 'text-primary' : 'text-text')
      : 'text-text-muted hover:bg-muted hover:text-text',
    className,
  );

/**
 * SideNavItem - a navigation link: a leading `icon` slot + the label (children). `active` sets both
 * `aria-current="page"` and the active fill; an idle item is muted with a hover lift. When the rail
 * is **collapsed** the icon centres, the label is visually hidden (`sr-only`, so the link keeps its
 * accessible name) and the item is wrapped in a **Tooltip** that surfaces the label on hover/focus.
 * Clicking an item closes the mobile drawer. `asChild` (Radix `Slot`) styles a router `<Link>` you
 * provide instead (see the prop note). Default `<a>` otherwise.
 */
export const SideNavItem = React.forwardRef<HTMLAnchorElement, SideNavItemProps>(
  ({ className, icon, active = false, asChild = false, children, onClick, ...props }, ref) => {
    const { collapsed, mobile, closeDrawer } = useSideNavContext('SideNavItem');

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      // Respect a caller that cancels the event (the `composeEventHandlers` convention): only close
      // the drawer when the click wasn't prevented (matches TopNavLink).
      if (!event.defaultPrevented) {
        closeDrawer();
      }
    };

    // asChild: merge styling + wiring onto the consumer's element; they own the inner content.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          aria-current={active ? 'page' : undefined}
          className={itemClasses(collapsed, active, mobile, className)}
          onClick={handleClick}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    const item = (
      <a
        ref={ref}
        aria-current={active ? 'page' : undefined}
        className={itemClasses(collapsed, active, mobile, className)}
        onClick={handleClick}
        {...props}
      >
        {icon ? (
          <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className={cn(collapsed && 'sr-only')}>{children}</span>
      </a>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{item}</TooltipTrigger>
          <TooltipContent side="right">{children}</TooltipContent>
        </Tooltip>
      );
    }

    return item;
  },
);
SideNavItem.displayName = 'SideNavItem';

/* ------------------------------------------------------------------------- trigger */

export type SideNavTriggerProps = ButtonProps;

/**
 * SideNavTrigger - the mobile menu Button (a ghost icon Button, `md:hidden` so it only shows below
 * the breakpoint) that opens the drawer. It is intentionally **decoupled** from SideNav: the trigger
 * lives in the app bar (a sibling of SideNav, not a descendant), so it can't share a React context
 * with the rail. The consumer owns the drawer's `open` state and wires this button to it - open it
 * on click, and pass `aria-expanded`/`aria-controls` for the disclosure relationship:
 *
 * ```tsx
 * const [open, setOpen] = useState(false);
 * <SideNavTrigger aria-expanded={open} aria-controls="app-nav" onClick={() => setOpen(true)} />
 * <SideNav id="app-nav" open={open} onOpenChange={setOpen}>…</SideNav>
 * ```
 *
 * The trigger supplies the ghost-icon styling, the `md:hidden` visibility, a default hamburger icon
 * (override via children), and the accessible name "Open navigation". SideNav itself returns focus
 * to whatever opened the drawer when it closes, so no trigger ref wiring is needed.
 */
export const SideNavTrigger = React.forwardRef<HTMLButtonElement, SideNavTriggerProps>(
  ({ className, children, 'aria-label': ariaLabel, ...props }, ref) => (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel ?? 'Open navigation'}
      className={cn('md:hidden', className)}
      {...props}
    >
      {children ?? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-5 w-5"
        >
          <path d="M3 12h18" />
          <path d="M3 6h18" />
          <path d="M3 18h18" />
        </svg>
      )}
    </Button>
  ),
);
SideNavTrigger.displayName = 'SideNavTrigger';

/* ------------------------------------------------------------------ collapse toggle */

export type SideNavCollapseToggleProps = ButtonProps;

/**
 * SideNavCollapseToggle - a ghost icon Button that flips the desktop `collapsed` state, for
 * composing into the header or footer. Its accessible name reflects the action it will perform
 * ("Collapse sidebar" when expanded, "Expand sidebar" when collapsed); the chevron rotates with the
 * state. Hidden on mobile (`max-md:hidden`), where the rail is always the expanded drawer.
 */
export const SideNavCollapseToggle = React.forwardRef<
  HTMLButtonElement,
  SideNavCollapseToggleProps
>(({ className, onClick, children, 'aria-label': ariaLabel, ...props }, ref) => {
  const { collapsed, setCollapsed } = useSideNavContext('SideNavCollapseToggle');
  return (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size="icon"
      aria-label={ariaLabel ?? (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
      className={cn('max-md:hidden', className)}
      onClick={(event) => {
        onClick?.(event);
        setCollapsed(!collapsed);
      }}
      {...props}
    >
      {children ?? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')}
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      )}
    </Button>
  );
});
SideNavCollapseToggle.displayName = 'SideNavCollapseToggle';
