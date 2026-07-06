import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';

/**
 * Breadcrumb - the trail-of-ancestors navigation Twig (spec 0029). It shows where the current
 * page sits in a hierarchy (`Home / Docs / Components / Breadcrumb`) and lets a user step back up
 * it. API-shaped after shadcn's Base UI Breadcrumb, retargeted onto Canopy's tokens and the
 * `asChild` (Radix `Slot`) polymorphism convention.
 *
 * Layer note: Breadcrumb renders a `<nav>` landmark like the navigation Branches (TopNav/SideNav),
 * but the layer split here is by INTERACTION CLASS, not domain - a Branch owns interaction state
 * and/or a portal, and Breadcrumb owns NEITHER. It is pure, static, presentational structure, which
 * is the Card (0022) precedent: a structural compound Twig. So it ships on `@rogueoak/canopy/twigs`.
 *
 * The family follows the 0020 Twigs recipe: each part is a small `forwardRef` element that spreads
 * native props and merges `className` via `cn()`, with FULL LITERAL Tailwind class strings so
 * Tailwind v4's scanner emits each utility. Styled with SEMANTIC TOKENS ONLY - no palette, no
 * `dark:`, no new token - so light/dark flips through the token layer (spec 0004). No React context
 * is needed (unlike FormField): there is no cross-part shared state - each part is independent
 * markup, so this is a structural compound like Card, not a stateful one.
 *
 * Accessibility is the point of the component and drives the design:
 * - `Breadcrumb` is a `<nav aria-label="breadcrumb">` landmark wrapping an ordered list, so the
 *   sequence is conveyed and the landmark is discoverable.
 * - `BreadcrumbPage` marks the current location with `aria-current="page"` and is non-interactive.
 * - `BreadcrumbSeparator` / `BreadcrumbEllipsis` are decorative (`role="presentation"` +
 *   `aria-hidden`), so a screen reader announces "Home, link. Docs, link. Breadcrumb, current page"
 *   with no separator noise. The glyphs are hand-rolled inline `currentColor` SVGs (the
 *   Dialog-close / Checkbox-tick precedent) so they inherit text colour and add no dependency.
 */
export type BreadcrumbProps = React.ComponentPropsWithoutRef<'nav'>;

/**
 * Breadcrumb - the root landmark. Renders `<nav aria-label="breadcrumb">` (label overridable via
 * `aria-label`). Wraps the `BreadcrumbList`.
 */
export const Breadcrumb = React.forwardRef<HTMLElement, BreadcrumbProps>(
  ({ 'aria-label': ariaLabel = 'breadcrumb', ...props }, ref) => (
    <nav ref={ref} aria-label={ariaLabel} {...props} />
  ),
);
Breadcrumb.displayName = 'Breadcrumb';

export type BreadcrumbListProps = React.ComponentPropsWithoutRef<'ol'>;

/**
 * BreadcrumbList - the ordered list of crumbs. Renders `<ol>` as a wrapping `flex items-center`
 * row with a small gap, in the muted `body-sm` role (individual links/pages re-assert their own
 * colour). The `<ol>` conveys the sequence to assistive tech.
 */
export const BreadcrumbList = React.forwardRef<HTMLOListElement, BreadcrumbListProps>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn(
        'flex flex-wrap items-center gap-1.5 break-words text-body-sm text-text-muted',
        className,
      )}
      {...props}
    />
  ),
);
BreadcrumbList.displayName = 'BreadcrumbList';

export type BreadcrumbItemProps = React.ComponentPropsWithoutRef<'li'>;

/**
 * BreadcrumbItem - wraps a single crumb (a `BreadcrumbLink` or the `BreadcrumbPage`). Renders
 * `<li>` as an inline `flex items-center` group with a gap.
 */
export const BreadcrumbItem = React.forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
  ),
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export interface BreadcrumbLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  /**
   * Render as the single child element (Radix `Slot`) instead of the default `<a>`, merging the
   * link classes/props onto it. Use this to wrap a router `<Link>` so Canopy stays router-agnostic
   * (the same pattern as `TopNavLink`); keep the child a real interactive link element.
   */
  asChild?: boolean;
}

/**
 * BreadcrumbLink - an interactive ancestor link. Renders `<a>` by default, or the single child via
 * `asChild` (Radix `Slot`). Muted (`text-text-muted`) with a `hover:text-text` lift and the shared
 * focus-visible ring, so it reads as secondary to the current page.
 */
export const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        className={cn(
          'rounded-sm text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          className,
        )}
        {...props}
      />
    );
  },
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

export type BreadcrumbPageProps = React.ComponentPropsWithoutRef<'span'>;

/**
 * BreadcrumbPage - the current page (the trail's destination). Renders a non-interactive `<span>`
 * carrying `aria-current="page"` (the "you are here" hook) plus `role="link"` + `aria-disabled`
 * (so it presents as the same kind of element as its sibling links, but disabled). Un-muted
 * `text-text` at normal weight so it reads as the current location.
 */
export const BreadcrumbPage = React.forwardRef<HTMLSpanElement, BreadcrumbPageProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-normal text-text', className)}
      {...props}
    />
  ),
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

export type BreadcrumbSeparatorProps = React.ComponentPropsWithoutRef<'li'>;

/**
 * BreadcrumbSeparator - the divider between two crumbs. Renders `<li role="presentation"
 * aria-hidden="true">` (decorative, so assistive tech skips it and it stays out of the accessible
 * name) holding a default chevron - a hand-rolled inline `currentColor` SVG (no icon dependency,
 * the Dialog-close / Checkbox-tick precedent). Pass `children` to override the glyph (e.g. a `/`).
 */
export const BreadcrumbSeparator = React.forwardRef<HTMLLIElement, BreadcrumbSeparatorProps>(
  ({ className, children, ...props }, ref) => (
    <li
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn('inline-flex items-center [&>svg]:h-3.5 [&>svg]:w-3.5', className)}
      {...props}
    >
      {children ?? (
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </li>
  ),
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

export type BreadcrumbEllipsisProps = React.ComponentPropsWithoutRef<'span'>;

/**
 * BreadcrumbEllipsis - the collapsed-trail affordance, for when a long trail is truncated in the
 * middle (the consumer places it where they cut the trail; Breadcrumb does not auto-collapse).
 * Renders a decorative `<span role="presentation" aria-hidden="true">` with an inline
 * horizontal-dots SVG plus an `sr-only` "More" label so the truncation is still describable.
 */
export const BreadcrumbEllipsis = React.forwardRef<HTMLSpanElement, BreadcrumbEllipsisProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="presentation"
      aria-hidden="true"
      className={cn('inline-flex h-5 w-5 items-center justify-center', className)}
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
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
      <span className="sr-only">More</span>
    </span>
  ),
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';
