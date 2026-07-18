import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { buttonVariants } from '../seeds/Button';
import { cn } from '../lib/cn';

/**
 * Pagination - the paged-list navigation Twig (spec 0047). It moves a user *through* a paged list
 * (a data table, a search-results page, a blog index) with numbered page links, previous/next
 * controls, and an ellipsis for the elided middle. API-shaped after shadcn's Pagination family,
 * retargeted onto Canopy's tokens and the `buttonVariants` recipe (spec 0005).
 *
 * Layer note: like `Breadcrumb` (0029), Pagination renders a `<nav>` landmark but owns NO
 * interaction state and NO portal - it is pure, static, presentational structure, so it ships on
 * `@rogueoak/canopy/twigs` (the Card / Breadcrumb precedent), not a Branch. Twigs may import Seeds,
 * so `PaginationLink` composes the existing `buttonVariants` from `../seeds/Button` for its styling
 * (Twigs -> Seeds is the allowed layering direction).
 *
 * Presentational, caller-owned wiring (key decision): Pagination computes NOTHING - no page math,
 * no active-page state, no total-count arithmetic. The caller passes `href`s / `onClick`, decides
 * which `PaginationItem`s (numbers and ellipses) to render, and sets `isActive` on the current
 * page. This keeps the Twig framework-agnostic (any router, a plain `<a>`, or a `<button>` via
 * `asChild`) and mirrors how `Breadcrumb` leaves the trail contents to the caller.
 *
 * The family follows the 0005 recipe: each part is a small `forwardRef` element that spreads native
 * props and merges `className` via `cn()`, with FULL LITERAL Tailwind class strings so Tailwind
 * v4's scanner emits each utility. Styled with SEMANTIC TOKENS ONLY (through `buttonVariants`) -
 * no palette, no `dark:` on the common path - so light/dark flips through the token layer (0004).
 * The chevron / ellipsis glyphs are hand-rolled inline `currentColor` SVGs (the `Breadcrumb`
 * precedent) so they inherit text colour and add NO new dependency.
 */
export type PaginationProps = React.ComponentPropsWithoutRef<'nav'>;

/**
 * Pagination - the root landmark. Renders `<nav aria-label="pagination">` (label overridable via
 * `aria-label`) as a centered `flex` row. Wraps the `PaginationContent`.
 */
export const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  ({ className, 'aria-label': ariaLabel = 'pagination', ...props }, ref) => (
    <nav
      ref={ref}
      aria-label={ariaLabel}
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  ),
);
Pagination.displayName = 'Pagination';

export type PaginationContentProps = React.ComponentPropsWithoutRef<'ul'>;

/**
 * PaginationContent - the `<ul>` list of page controls, a `flex items-center` row with a small gap.
 * The `<ul>`/`<li>` structure conveys the list to assistive tech.
 */
export const PaginationContent = React.forwardRef<HTMLUListElement, PaginationContentProps>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn('flex flex-row items-center gap-1', className)} {...props} />
  ),
);
PaginationContent.displayName = 'PaginationContent';

export type PaginationItemProps = React.ComponentPropsWithoutRef<'li'>;

/**
 * PaginationItem - the `<li>` wrapper for a single page control (a `PaginationLink`, `Previous`,
 * `Next`, or `Ellipsis`).
 */
export const PaginationItem = React.forwardRef<HTMLLIElement, PaginationItemProps>(
  ({ className, ...props }, ref) => <li ref={ref} className={cn(className)} {...props} />,
);
PaginationItem.displayName = 'PaginationItem';

/** The Button `size` scale reused for page links; `icon` (square) is the default for numbers. */
type PaginationLinkSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export interface PaginationLinkProps extends React.ComponentPropsWithoutRef<'a'> {
  /**
   * Marks this link as the current page: it gains `aria-current="page"` (the single authoritative
   * "you are here" signal) and reads as the `outline` "current" state; inactive links read as
   * `ghost`. The caller owns which page is active - Pagination holds no state.
   */
  isActive?: boolean;
  /** The Button `size` scale; defaults to `icon` for the square numbered links. */
  size?: PaginationLinkSize;
  /**
   * Render as the single child element (Radix `Slot`) instead of the default `<a>`, merging the
   * link classes/props onto it. Use this to wrap a router `<Link>` so Canopy stays router-agnostic
   * (the `BreadcrumbLink` / `TopNavLink` pattern); keep the child a real interactive link element.
   */
  asChild?: boolean;
}

/**
 * PaginationLink - a numbered page link. Renders `<a>` by default, or the single child via
 * `asChild` (Radix `Slot`). Styling comes from `buttonVariants({ variant: isActive ? 'outline' :
 * 'ghost', size })` so it reads exactly like a canopy Button (and carries the shared Button
 * focus-visible ring for free); the active link additionally sets `aria-current="page"`.
 */
export const PaginationLink = React.forwardRef<HTMLAnchorElement, PaginationLinkProps>(
  ({ className, isActive = false, size = 'icon', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'a';
    return (
      <Comp
        ref={ref}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          buttonVariants({ variant: isActive ? 'outline' : 'ghost', size }),
          className,
        )}
        {...props}
      />
    );
  },
);
PaginationLink.displayName = 'PaginationLink';

export type PaginationPreviousProps = PaginationLinkProps;

/**
 * PaginationPrevious - a `PaginationLink` pre-wired with a leading chevron + "Previous" label and a
 * default `aria-label` "Go to previous page" so the icon-with-text control is fully named. It is
 * inactive (never the current page) and uses the wider `md` size to fit the label. At the first
 * page the caller renders it with `aria-disabled="true"` and no `href`/handler (the disabled-end
 * idiom - native `disabled` does not apply to an `<a>`).
 */
export const PaginationPrevious = React.forwardRef<HTMLAnchorElement, PaginationPreviousProps>(
  ({ className, 'aria-label': ariaLabel = 'Go to previous page', children, ...props }, ref) => (
    <PaginationLink
      ref={ref}
      aria-label={ariaLabel}
      size="md"
      className={cn('gap-1 pl-2.5', className)}
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
        <path d="m15 18-6-6 6-6" />
      </svg>
      {children ?? <span>Previous</span>}
    </PaginationLink>
  ),
);
PaginationPrevious.displayName = 'PaginationPrevious';

export type PaginationNextProps = PaginationLinkProps;

/**
 * PaginationNext - a `PaginationLink` pre-wired with a "Next" label + trailing chevron and a default
 * `aria-label` "Go to next page". Inactive, `md` size. At the last page the caller renders it with
 * `aria-disabled="true"` and no `href`/handler (the disabled-end idiom).
 */
export const PaginationNext = React.forwardRef<HTMLAnchorElement, PaginationNextProps>(
  ({ className, 'aria-label': ariaLabel = 'Go to next page', children, ...props }, ref) => (
    <PaginationLink
      ref={ref}
      aria-label={ariaLabel}
      size="md"
      className={cn('gap-1 pr-2.5', className)}
      {...props}
    >
      {children ?? <span>Next</span>}
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
        <path d="m9 18 6-6-6-6" />
      </svg>
    </PaginationLink>
  ),
);
PaginationNext.displayName = 'PaginationNext';

export type PaginationEllipsisProps = React.ComponentPropsWithoutRef<'span'>;

/**
 * PaginationEllipsis - the elided-range affordance. A non-interactive `<span>` holding a decorative
 * (`aria-hidden`) three-dots SVG PLUS an `sr-only` "More pages" label, so a screen reader announces
 * the gap rather than skipping it silently (the `BreadcrumbEllipsis` fix from feedback 0012: do not
 * hide the whole wrapper, or the label is pruned to nobody).
 */
export const PaginationEllipsis = React.forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('flex h-10 w-10 items-center justify-center', className)}
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
      <span className="sr-only">More pages</span>
    </span>
  ),
);
PaginationEllipsis.displayName = 'PaginationEllipsis';
