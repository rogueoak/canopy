import * as React from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cn } from '../lib/cn';

/**
 * NavigationMenu - the canopy horizontal navigation Branch (spec 0069), built on
 * `@radix-ui/react-navigation-menu` and the 0005 component recipe: full-literal semantic-token
 * Tailwind utilities (so Tailwind v4's scanner emits every class, including the responsive /
 * `data-state` literals), `cn()` class merge (caller wins), and `forwardRef` on every styled
 * wrapper with a full native prop spread. There is NO `dark:` on the common path - light/dark
 * flips through the token layer (spec 0004), and because `.dark` lives on `<html>` the portalled
 * `NavigationMenuViewport` (mounted under `<body>`) themes correctly too.
 *
 * It slots between `TopNav` (0025) and `SideNav` (0026) as the missing site-navigation primitive:
 * grouped destinations opening a dropdown / mega-menu panel with the correct WAI-ARIA
 * navigation-menu semantics. Radix owns the hard parts - roving focus and arrow-key traversal
 * between triggers, hover-intent + focus open/close, single-open coordination, the `Indicator`
 * that tracks the active trigger, and the portalled `Viewport` that positions and size-syncs to
 * the open content - so this component is composition + token styling.
 *
 * The family mirrors the Radix / shadcn surface area:
 * - `NavigationMenu` - the root `<nav>`; a thin `relative z-10 flex` wrapper that renders the
 *   `NavigationMenuViewport` after its list by default, so the portalled content has a positioned
 *   container.
 * - `NavigationMenuList` - a `flex` row (`gap-1`) of items.
 * - `NavigationMenuItem` - an unstyled list wrapper.
 * - `NavigationMenuTrigger` - a ghost nav control with a trailing chevron that rotates on
 *   `data-state="open"` (gated `motion-reduce:*`).
 * - `NavigationMenuContent` - the panel that mounts into the viewport; enter/leave use the
 *   existing pop/fade token animations gated `motion-reduce:animate-none`.
 * - `NavigationMenuLink` - a nav link; `active` drives `data-active` + `aria-current="page"` and
 *   the active token styling in lockstep, and `asChild` wraps a router `<Link>`.
 * - `NavigationMenuIndicator` - the arrow/underline that tracks the open trigger.
 * - `NavigationMenuViewport` - the portalled, size-synced container the active content renders
 *   into.
 */
const NavigationMenu = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, asChild = false, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    asChild={asChild}
    className={
      asChild
        ? className
        : cn('relative z-10 flex max-w-max flex-1 items-center justify-center', className)
    }
    {...props}
  >
    {/*
     * On the default (non-asChild) path we render the size-synced viewport after the list so the
     * portalled content has a positioned container. When a caller passes `asChild` (e.g. TopNav
     * merging the Root onto its own panel element), the Root slots onto that single child and the
     * caller owns the structure, so we hand `children` through untouched and skip the auto-viewport
     * (a caller composing custom structure adds its own viewport if it needs one).
     */}
    {asChild ? (
      children
    ) : (
      <>
        {children}
        <NavigationMenuViewport />
      </>
    )}
  </NavigationMenuPrimitive.Root>
));
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

/**
 * NavigationMenuList - the `flex` row of items (`gap-1`). Group your `NavigationMenuItem`s inside.
 */
const NavigationMenuList = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn('group flex flex-1 list-none items-center justify-center gap-1', className)}
    {...props}
  />
));
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

/**
 * NavigationMenuItem - an unstyled `<li>` wrapper for a trigger + content pair, or a bare link.
 */
const NavigationMenuItem = NavigationMenuPrimitive.Item;

/**
 * NavigationMenuTrigger - the button that opens its `NavigationMenuContent` on hover/focus/click.
 * Styled like a ghost nav control (`text-text-muted hover:text-text`, focus-visible ring,
 * `disabled:*` inert), with a trailing chevron that rotates on `data-state="open"` gated with
 * `motion-reduce:*` so a reduced-motion user gets an instant flip.
 */
const NavigationMenuTrigger = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'group inline-flex h-9 w-max items-center justify-center gap-1 rounded-md px-3 py-2 text-body-sm text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface data-[state=open]:text-text disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  >
    {children}
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="relative top-px h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </NavigationMenuPrimitive.Trigger>
));
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

/**
 * NavigationMenuContent - the panel that mounts into the `NavigationMenuViewport`. Any layout of
 * `NavigationMenuLink`s composes inside (a single column or a multi-column mega-menu grid).
 * Enter/leave use the existing pop/fade token animations gated `motion-reduce:animate-none`.
 */
const NavigationMenuContent = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-0 w-full p-4 data-[motion=from-start]:animate-fade-in data-[motion=from-end]:animate-fade-in data-[motion=to-start]:animate-fade-out data-[motion=to-end]:animate-fade-out motion-reduce:animate-none md:absolute md:w-auto',
      className,
    )}
    {...props}
  />
));
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

export interface NavigationMenuLinkProps
  extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link> {
  /**
   * Marks the link as the current page: sets `aria-current="page"` AND `data-active` (via Radix's
   * `active`) so the active token styling (`text-text font-medium`) and the attribute stay in
   * lockstep, while an idle link stays muted (`text-text-muted hover:text-text`). The consumer
   * drives this from their router, so Canopy stays router-agnostic.
   */
  active?: boolean;
}

/**
 * NavigationMenuLink - a nav link (mirrors `TopNavLink`'s active idiom). `active` sets
 * `aria-current="page"` and `data-active`, driving the active styling in lockstep; idle links are
 * muted with a hover lift. `asChild` wraps a router `<Link>` (default element `<a>`). Carries the
 * shared focus-visible ring.
 */
const NavigationMenuLink = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Link>,
  NavigationMenuLinkProps
>(({ className, active = false, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    active={active}
    aria-current={active ? 'page' : undefined}
    className={cn(
      'block select-none rounded-md px-3 py-2 text-body-sm transition-colors hover:bg-muted-raised hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised data-[active]:font-medium data-[active]:text-text',
      active ? 'font-medium text-text' : 'text-text-muted',
      className,
    )}
    {...props}
  />
));
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

/**
 * NavigationMenuIndicator - the arrow that tracks the open trigger. Radix positions it under the
 * active trigger; the rotated `bg-surface-raised` marker reads as the caret joining the trigger to
 * the portalled viewport, with a `bg-border` seam behind it. Fades in/out gated
 * `motion-reduce:animate-none`.
 */
const NavigationMenuIndicator = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      'top-full z-[1] flex h-2 items-end justify-center overflow-hidden data-[state=visible]:animate-fade-in data-[state=hidden]:animate-fade-out motion-reduce:animate-none',
      className,
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm border-l border-t border-border bg-surface-raised" />
  </NavigationMenuPrimitive.Indicator>
));
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName;

/**
 * NavigationMenuViewport - the portalled, size-and-position-synced container the active content
 * renders into (`bg-surface-raised border border-border rounded-md shadow-md`). Its width/height
 * are driven by the Radix `--radix-navigation-menu-viewport-*` CSS vars. Being portalled under
 * `<body>` with `.dark` on `<html>`, it themes correctly with no per-portal wiring. Rendered by
 * `NavigationMenu` automatically; exported for advanced positioning.
 */
const NavigationMenuViewport = React.forwardRef<
  React.ComponentRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn('absolute left-0 top-full flex justify-center')}>
    <NavigationMenuPrimitive.Viewport
      ref={ref}
      className={cn(
        'relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top-center overflow-hidden rounded-md border border-border bg-surface-raised text-text shadow-md data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out motion-reduce:animate-none md:w-[var(--radix-navigation-menu-viewport-width)]',
        className,
      )}
      {...props}
    />
  </div>
));
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
};

export type NavigationMenuProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Root
>;
export type NavigationMenuListProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.List
>;
export type NavigationMenuItemProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Item
>;
export type NavigationMenuTriggerProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Trigger
>;
export type NavigationMenuContentProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Content
>;
export type NavigationMenuIndicatorProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Indicator
>;
export type NavigationMenuViewportProps = React.ComponentPropsWithoutRef<
  typeof NavigationMenuPrimitive.Viewport
>;
