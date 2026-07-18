import { createRef } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './Pagination';

/** A representative pager used by several structural / a11y assertions (page 2 of 10, elided). */
function Pager() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#prev" />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#1">1</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#2" isActive>
            2
          </PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#3">3</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <PaginationLink href="#10">10</PaginationLink>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href="#next" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe('Pagination', () => {
  it('renders a labelled navigation landmark wrapping a list', () => {
    render(<Pager />);
    const nav = screen.getByRole('navigation', { name: 'pagination' });
    expect(nav.tagName).toBe('NAV');
    // The list is a real <ul> so the set of pages is conveyed to assistive tech.
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('UL');
    // Each control sits in its own <li>.
    expect(within(list).getAllByRole('listitem').length).toBeGreaterThan(0);
  });

  it('overrides the landmark label via aria-label', () => {
    render(
      <Pagination aria-label="Search results pages">
        <PaginationContent />
      </Pagination>,
    );
    expect(
      screen.getByRole('navigation', { name: 'Search results pages' }),
    ).toBeInTheDocument();
  });

  it('marks only the active link with aria-current="page"', () => {
    render(<Pager />);
    // Exactly one link carries aria-current, and it is the active page (2).
    const current = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('2');
    // An inactive numbered link does not carry aria-current at all (not "false").
    const inactive = screen.getByRole('link', { name: '1' });
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('styles the active link as outline and inactive links as ghost (buttonVariants)', () => {
    render(<Pager />);
    // Active -> outline: gains the outline border token; inactive -> ghost: transparent, no border.
    const active = screen.getByRole('link', { name: '2' });
    expect(active).toHaveClass('border-border-strong');
    expect(active).toHaveClass('bg-transparent');

    const inactive = screen.getByRole('link', { name: '1' });
    expect(inactive).toHaveClass('bg-transparent');
    expect(inactive).not.toHaveClass('border-border-strong');
    // Both carry the shared Button focus-visible ring for free.
    expect(inactive).toHaveClass('focus-visible:ring-ring');
  });

  it('defaults numbered links to the square icon size but honours an explicit size', () => {
    const { rerender } = render(
      <PaginationLink href="#" data-testid="link">
        1
      </PaginationLink>,
    );
    // Default size is `icon` (square) for the numbered links.
    expect(screen.getByTestId('link')).toHaveClass('h-10', 'w-10');

    rerender(
      <PaginationLink href="#" size="sm" data-testid="link">
        1
      </PaginationLink>,
    );
    const link = screen.getByTestId('link');
    expect(link).toHaveClass('h-8', 'px-3');
    expect(link).not.toHaveClass('w-10');
  });

  it('gives Previous/Next their default aria-labels and a chevron on the correct side', () => {
    render(<Pager />);
    const prev = screen.getByRole('link', { name: 'Go to previous page' });
    const next = screen.getByRole('link', { name: 'Go to next page' });
    // Both are the wider `md` size (they fit a text label) rather than the square `icon` size.
    expect(prev).toHaveClass('h-10', 'px-4');
    expect(next).toHaveClass('h-10', 'px-4');
    // The visible text label sits beside a decorative chevron.
    expect(prev).toHaveTextContent('Previous');
    expect(next).toHaveTextContent('Next');
    expect(prev.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(next.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // Previous: chevron leads the label; Next: chevron trails it. The DOM order encodes the side.
    const prevKids = Array.from(prev.childNodes);
    const nextKids = Array.from(next.childNodes);
    expect((prevKids[0] as Element).tagName).toBe('svg');
    expect((nextKids[nextKids.length - 1] as Element).tagName).toBe('svg');
  });

  it('lets the caller override the Previous/Next aria-label and visible label', () => {
    render(
      <>
        <PaginationPrevious href="#" aria-label="Older">
          <span>Older</span>
        </PaginationPrevious>
        <PaginationNext href="#" aria-label="Newer">
          <span>Newer</span>
        </PaginationNext>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Older' })).toHaveTextContent('Older');
    expect(screen.getByRole('link', { name: 'Newer' })).toHaveTextContent('Newer');
  });

  it('honours the disabled-end idiom: aria-disabled with no href is not a navigable link', () => {
    render(
      <PaginationPrevious aria-disabled="true" data-testid="prev-disabled">
        <span>Previous</span>
      </PaginationPrevious>,
    );
    const prev = screen.getByTestId('prev-disabled');
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    // No href, so it is not exposed as a real (navigable) link with that name.
    expect(prev).not.toHaveAttribute('href');
    expect(screen.queryByRole('link', { name: 'Go to previous page' })).not.toBeInTheDocument();
  });

  it('announces the ellipsis gap: sr-only label present, glyph aria-hidden, wrapper not hidden', () => {
    render(<PaginationEllipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId('ellipsis');
    // The dots glyph is decorative...
    expect(ellipsis.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // ...but the wrapper itself is NOT hidden, so its "More pages" label reaches a screen reader
    // (the bug fixed in feedback 0012: an aria-hidden wrapper prunes the sr-only label to nobody).
    expect(ellipsis).not.toHaveAttribute('aria-hidden');
    const label = within(ellipsis).getByText('More pages');
    expect(label).toHaveClass('sr-only');
    expect(label.closest('[aria-hidden="true"]')).toBeNull();
    // The ellipsis is non-interactive: it is not a link.
    expect(within(ellipsis).queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders PaginationLink as the child element via asChild (no nested anchor)', () => {
    render(
      <PaginationLink asChild isActive>
        <a href="/custom" data-testid="router-link">
          7
        </a>
      </PaginationLink>,
    );
    const link = screen.getByTestId('router-link');
    // The single provided <a> carries the link classes and the active hook - not wrapped again.
    expect(link.tagName).toBe('A');
    expect(link).toHaveClass('border-border-strong');
    expect(link).toHaveAttribute('aria-current', 'page');
    expect(link.querySelector('a')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('forwards asChild onto the caller child for Previous/Next (chevron stays a sibling)', () => {
    render(
      <>
        <PaginationPrevious asChild>
          <a href="/prev" data-testid="prev-link">
            Older
          </a>
        </PaginationPrevious>
        <PaginationNext asChild>
          <a href="/next" data-testid="next-link">
            Newer
          </a>
        </PaginationNext>
      </>,
    );
    // The Slot forwards onto the single caller <a> (no double-child throw) - it is a real link
    // carrying the link classes, the visible label, and the decorative chevron as a sibling.
    const prev = screen.getByTestId('prev-link');
    expect(prev.tagName).toBe('A');
    expect(prev).toHaveAttribute('href', '/prev');
    expect(prev).toHaveClass('bg-transparent');
    expect(prev).toHaveTextContent('Older');
    expect(prev.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(prev.querySelector('a')).toBeNull();

    const next = screen.getByTestId('next-link');
    expect(next.tagName).toBe('A');
    expect(next).toHaveAttribute('href', '/next');
    expect(next).toHaveTextContent('Newer');
    expect(next.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');

    // No wrapping anchor was introduced: exactly the two caller links exist.
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('fires the caller click handler on a link', () => {
    const onClick = vi.fn();
    render(
      <PaginationLink href="#3" onClick={onClick}>
        3
      </PaginationLink>,
    );
    fireEvent.click(screen.getByRole('link', { name: '3' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is keyboard-focusable via the native anchor', () => {
    render(
      <PaginationLink href="#1" data-testid="link">
        1
      </PaginationLink>,
    );
    const link = screen.getByTestId('link');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('merges a caller className via cn(), overriding a default variant class', () => {
    render(
      <PaginationLink href="#" className="bg-primary" data-testid="link">
        1
      </PaginationLink>,
    );
    const link = screen.getByTestId('link');
    // cn() de-dupes the conflicting background: the caller's `bg-primary` wins over `bg-transparent`.
    expect(link).toHaveClass('bg-primary');
    expect(link).not.toHaveClass('bg-transparent');
  });

  it('forwards refs to the underlying element of each part', () => {
    const nav = createRef<HTMLElement>();
    const content = createRef<HTMLUListElement>();
    const item = createRef<HTMLLIElement>();
    const link = createRef<HTMLAnchorElement>();
    const prev = createRef<HTMLAnchorElement>();
    const next = createRef<HTMLAnchorElement>();
    const ellipsis = createRef<HTMLSpanElement>();
    render(
      <Pagination ref={nav}>
        <PaginationContent ref={content}>
          <PaginationItem ref={item}>
            <PaginationLink ref={link} href="#1">
              1
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationPrevious ref={prev} href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext ref={next} href="#" />
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis ref={ellipsis} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(nav.current).toBeInstanceOf(HTMLElement);
    expect(content.current).toBeInstanceOf(HTMLUListElement);
    expect(item.current).toBeInstanceOf(HTMLLIElement);
    expect(link.current).toBeInstanceOf(HTMLAnchorElement);
    expect(prev.current).toBeInstanceOf(HTMLAnchorElement);
    expect(next.current).toBeInstanceOf(HTMLAnchorElement);
    expect(ellipsis.current).toBeInstanceOf(HTMLSpanElement);
  });
});
