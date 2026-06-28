import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';
import { Button } from '../seeds';

/**
 * TopNav — the second canopy Branch (organism, spec 0025), and the first **non-portalled,
 * stateful** Branch. Where Dialog (0024) leans on Radix for a portal + focus trap, TopNav owns its
 * interaction state directly: a hand-rolled disclosure (a menu button + `aria-expanded` /
 * `aria-controls`, an `Esc` + outside-click effect, and focus-return-to-toggle) coordinated through
 * a small `TopNavContext`. No Radix disclosure primitive, no new dependency, no new token — just the
 * Button Seed for the ☰ toggle and Radix `Slot` (already a dep) for `asChild` on Brand/Link.
 *
 * It is a **slot-based compound** rendered as a `<header>` + `<nav aria-label>` landmark:
 * - `TopNav` — the root bar (`h-14`, `border-b border-border`, `bg-surface`); provides the context
 *   and owns the Esc + outside-click effect with focus-return to the menu button.
 * - `TopNavBrand` — the leading brand/wordmark slot; `asChild` so it can be the consumer's `<a>`.
 * - `TopNavLinks` — ONE element that is an inline row on `md+` and a mobile disclosure panel below
 *   the bar when `open`; carries `id={panelId}` so the menu button's `aria-controls` agrees.
 * - `TopNavLink` — a single link; `active` → `aria-current="page"` + active styling (vs muted idle).
 *   `asChild` to wrap a router `<Link>`; closes the panel on click so a mobile tap dismisses.
 * - `TopNavActions` — the trailing, right-aligned (`ml-auto`) cluster for Buttons / Avatar /
 *   SearchBar.
 * - `TopNavMenuButton` — the ☰ toggle, `md:hidden`; composes the Button Seed, wired with
 *   `aria-expanded` / `aria-controls`, swapping a hamburger / X SVG with state.
 *
 * Active state is the consumer's, surfaced accessibly: the attribute (`aria-current`) and the
 * styling stay in lockstep, and the consumer drives `active` from their router so Canopy stays
 * router-agnostic. Semantic tokens only, both themes automatically; NO `dark:`. Full-literal classes
 * (including the responsive `md:hidden` / `md:flex` literals) so Tailwind's scanner emits them.
 */
interface TopNavContextValue {
  /** Whether the mobile disclosure panel is open. */
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Closes the panel (used by `Esc`, outside-click, and a link tap). */
  close: () => void;
  /** `React.useId` — shared by `TopNavMenuButton aria-controls` and `TopNavLinks id`. */
  panelId: string;
  /** The menu button's ref, registered by `TopNavMenuButton`, for focus-return on close. */
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
}

const TopNavContext = React.createContext<TopNavContextValue | null>(null);

function useTopNavContext(component: string): TopNavContextValue {
  const context = React.useContext(TopNavContext);
  if (!context) {
    throw new Error(`<${component}> must be used within a <TopNav>.`);
  }
  return context;
}

export interface TopNavProps extends React.HTMLAttributes<HTMLElement> {
  /** The accessible name of the `<nav>` landmark. Defaults to `"Main"`. */
  ariaLabel?: string;
}

/**
 * TopNav — the root. Renders a `<header>` banner wrapping the `<nav aria-label>` landmark that is
 * the styled bar; provides the `TopNavContext`, and owns the dismissal effect: while the panel is
 * open, a document `pointerdown` outside the nav closes it, and `Escape` closes it AND returns
 * focus to the menu button (mirroring Dialog's return-to-trigger, without the modal weight). The
 * public surface is the `<nav>`: `className`, the forwarded `ref`, and native props all land on
 * it (the element the caller styles), with the `<header>` a thin semantic wrapper.
 */
export const TopNav = React.forwardRef<HTMLElement, TopNavProps>(
  ({ className, children, ariaLabel = 'Main', ...props }, ref) => {
    const [open, setOpen] = React.useState(false);
    const panelId = React.useId();
    const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
    const navRef = React.useRef<HTMLElement | null>(null);

    React.useImperativeHandle(ref, () => navRef.current as HTMLElement);

    const close = React.useCallback(() => setOpen(false), []);

    // Hand-rolled dismiss (open-gated outside-pointerdown + Escape + focus-return). Kept inline
    // rather than extracted to a shared hook: TopNav is the only hand-rolled disclosure — SideNav
    // (0026) gets the same behaviour from Radix Dialog (its drawer), so there is no second consumer
    // to share with yet (extract on the rule of three, not before).
    React.useEffect(() => {
      if (!open) return;

      function onPointerDown(event: PointerEvent) {
        if (navRef.current && !navRef.current.contains(event.target as Node)) {
          close();
        }
      }
      function onKeyDown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          close();
          menuButtonRef.current?.focus();
        }
      }

      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.removeEventListener('pointerdown', onPointerDown);
        document.removeEventListener('keydown', onKeyDown);
      };
    }, [open, close]);

    const value = React.useMemo<TopNavContextValue>(
      () => ({ open, setOpen, close, panelId, menuButtonRef }),
      [open, close, panelId],
    );

    return (
      <TopNavContext.Provider value={value}>
        <header>
          <nav
            ref={navRef}
            aria-label={ariaLabel}
            className={cn(
              'relative flex h-14 w-full items-center gap-4 border-b border-border bg-surface px-4 text-text',
              className,
            )}
            {...props}
          >
            {children}
          </nav>
        </header>
      </TopNavContext.Provider>
    );
  },
);
TopNav.displayName = 'TopNav';

export interface TopNavBrandProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as the single child element (Radix `Slot`) — e.g. the consumer's `<a>` to home. */
  asChild?: boolean;
}

/**
 * TopNavBrand — the leading brand/wordmark slot. Default element is a `<span>` styled as a wordmark
 * (`font-semibold text-h4`); `asChild` swaps it for the consumer's element (typically an `<a href>`
 * to home), merging the brand classes/props onto it via Radix `Slot`.
 */
export const TopNavBrand = React.forwardRef<HTMLSpanElement, TopNavBrandProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'span';
    return (
      <Comp
        ref={ref}
        className={cn('mr-2 flex items-center text-h4 text-text', className)}
        {...props}
      />
    );
  },
);
TopNavBrand.displayName = 'TopNavBrand';

export type TopNavLinksProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * TopNavLinks — the primary-links container, and the responsive heart of TopNav: ONE element that is
 * an **inline row on `md+`** and a **mobile disclosure panel** anchored below the bar when `open`.
 * It carries `id={panelId}` so `TopNavMenuButton`'s `aria-controls` resolves to it. The `md:*`
 * literals override the mobile `hidden`/panel styling at the breakpoint; all classes are full
 * literals so Tailwind's scanner emits them.
 */
export const TopNavLinks = React.forwardRef<HTMLDivElement, TopNavLinksProps>(
  ({ className, ...props }, ref) => {
    const { open, panelId } = useTopNavContext('TopNavLinks');
    return (
      <div
        ref={ref}
        id={panelId}
        className={cn(
          'md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0 md:shadow-none',
          open
            ? 'absolute left-0 right-0 top-full z-40 flex flex-col gap-1 border-b border-border bg-surface p-2 shadow-md'
            : 'hidden',
          className,
        )}
        {...props}
      />
    );
  },
);
TopNavLinks.displayName = 'TopNavLinks';

export interface TopNavLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Marks the link as the current page: sets `aria-current="page"` AND the active token styling
   * (`text-text font-medium`), while an idle link stays muted (`text-text-muted hover:text-text`).
   * The consumer drives this from their router, so Canopy stays router-agnostic.
   */
  active?: boolean;
  /** Render as the single child element (Radix `Slot`) — e.g. a router `<Link>`. */
  asChild?: boolean;
}

/**
 * TopNavLink — a single nav link. `active` sets `aria-current="page"` and the active styling in
 * lockstep; idle links are muted with a hover lift. `asChild` wraps a router `<Link>` (default
 * element `<a>`). Clicking closes the mobile panel, so a tap navigates AND dismisses. Carries the
 * shared focus-visible ring.
 */
export const TopNavLink = React.forwardRef<HTMLAnchorElement, TopNavLinkProps>(
  ({ className, active = false, asChild = false, onClick, ...props }, ref) => {
    const { close } = useTopNavContext('TopNavLink');
    const Comp = asChild ? Slot : 'a';

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      onClick?.(event);
      // Respect a caller that cancels the event (the `composeEventHandlers` convention): only
      // dismiss the panel when the click wasn't prevented.
      if (!event.defaultPrevented) {
        close();
      }
    };

    return (
      <Comp
        ref={ref}
        aria-current={active ? 'page' : undefined}
        onClick={handleClick}
        className={cn(
          'rounded-md px-3 py-2 text-body-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          active ? 'font-medium text-text' : 'text-text-muted hover:text-text',
          className,
        )}
        {...props}
      />
    );
  },
);
TopNavLink.displayName = 'TopNavLink';

export type TopNavActionsProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * TopNavActions — the trailing, right-aligned (`ml-auto`) cluster for the consumer's Buttons /
 * Avatar / SearchBar.
 */
export const TopNavActions = React.forwardRef<HTMLDivElement, TopNavActionsProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('ml-auto flex items-center gap-2', className)} {...props} />
  ),
);
TopNavActions.displayName = 'TopNavActions';

export type TopNavMenuButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  'aria-expanded' | 'aria-controls'
>;

/**
 * TopNavMenuButton — the ☰ toggle, **only visible below the breakpoint** (`md:hidden`). Composes the
 * Button Seed (`variant="ghost" size="icon"`), wired with `aria-expanded={open}` and
 * `aria-controls={panelId}` (the `TopNavLinks` id), and a state-aware `aria-label`
 * (`"Open menu"` / `"Close menu"`). Registers its ref into context for focus-return, and swaps an
 * inline hamburger / X SVG (`currentColor`, `aria-hidden`) with the open state.
 */
export const TopNavMenuButton = React.forwardRef<HTMLButtonElement, TopNavMenuButtonProps>(
  ({ className, onClick, ...props }, ref) => {
    const { open, setOpen, panelId, menuButtonRef } = useTopNavContext('TopNavMenuButton');

    // Memoized so the merged ref callback is stable across renders — an inline ref would detach
    // (briefly nulling `menuButtonRef.current`) and reattach on every render, including each toggle.
    const setRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        menuButtonRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [menuButtonRef, ref],
    );

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      // Respect a caller that cancels the event before toggling (composeEventHandlers convention).
      if (!event.defaultPrevented) {
        setOpen((prev) => !prev);
      }
    };

    return (
      <Button
        ref={setRef}
        type="button"
        variant="ghost"
        size="icon"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={handleClick}
        className={cn('md:hidden', className)}
        {...props}
      >
        {open ? (
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
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
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
    );
  },
);
TopNavMenuButton.displayName = 'TopNavMenuButton';
