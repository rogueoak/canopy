import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './Breadcrumb';

/** A representative trail used by several structural / a11y assertions. */
function Trail() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

describe('Breadcrumb', () => {
  it('renders a labelled nav landmark wrapping an ordered list', () => {
    render(<Trail />);
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    expect(nav.tagName).toBe('NAV');
    // The list is a real <ol> so the sequence is conveyed to assistive tech.
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
  });

  it('overrides the landmark label via aria-label', () => {
    render(
      <Breadcrumb aria-label="You are here">
        <BreadcrumbList />
      </Breadcrumb>,
    );
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument();
  });

  it('marks the current page with aria-current and keeps it non-interactive', () => {
    render(<Trail />);
    const page = screen.getByText('Breadcrumb');
    expect(page).toHaveAttribute('aria-current', 'page');
    // Presented as a disabled link (shadcn's convention) - same element kind as its siblings,
    // but not navigable: aria-disabled and no href.
    expect(page).toHaveAttribute('aria-disabled', 'true');
    expect(page).not.toHaveAttribute('href');
    // Only the ancestor crumbs are real, navigable links (they carry an href).
    const navigable = screen.getAllByRole('link').filter((a) => a.hasAttribute('href'));
    expect(navigable.map((a) => a.textContent)).toEqual(['Home', 'Docs']);
  });

  it('renders ancestor links as real anchors pointing at their href', () => {
    render(<Trail />);
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toHaveAttribute('href', '/');
    expect(home).toHaveClass('text-text-muted');
  });

  it('keeps separators decorative and out of the accessible name', () => {
    render(<Trail />);
    // Two separators exist in the DOM as presentational, aria-hidden nodes...
    const nav = screen.getByRole('navigation', { name: 'breadcrumb' });
    const separators = nav.querySelectorAll('[role="presentation"][aria-hidden="true"]');
    expect(separators).toHaveLength(2);
    // ...so no "separator" role is exposed and the default chevron is an aria-hidden svg.
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('renders a default separator glyph but lets children override it', () => {
    const { rerender } = render(<BreadcrumbSeparator data-testid="sep" />);
    // Default: an inline svg chevron.
    expect(screen.getByTestId('sep').querySelector('svg')).toBeInTheDocument();

    rerender(<BreadcrumbSeparator data-testid="sep">/</BreadcrumbSeparator>);
    const sep = screen.getByTestId('sep');
    expect(sep).toHaveTextContent('/');
    expect(sep.querySelector('svg')).not.toBeInTheDocument();
    // The decorative contract must hold on the override path too, so a caller's custom glyph (the
    // "/") can never leak into the accessible name.
    expect(sep).toHaveAttribute('role', 'presentation');
    expect(sep).toHaveAttribute('aria-hidden', 'true');
  });

  it('exposes the ellipsis truncation to assistive tech (label is reachable, not aria-hidden)', () => {
    render(<BreadcrumbEllipsis data-testid="ellipsis" />);
    const ellipsis = screen.getByTestId('ellipsis');
    // The dots glyph is decorative...
    expect(ellipsis.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    // ...but the ellipsis itself is NOT hidden from the accessibility tree, so its "More" label
    // actually reaches a screen reader (the bug fixed in feedback 0012: an aria-hidden wrapper
    // pruned the sr-only label to nobody).
    expect(ellipsis).not.toHaveAttribute('aria-hidden');
    const label = within(ellipsis).getByText('More');
    expect(label).toHaveClass('sr-only');
    expect(label.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('renders BreadcrumbLink as the child element via asChild (no nested anchor)', () => {
    render(
      <BreadcrumbLink asChild>
        <a href="/custom" data-testid="router-link">
          Custom
        </a>
      </BreadcrumbLink>,
    );
    const link = screen.getByTestId('router-link');
    // The single provided <a> carries the link classes - it is not wrapped in a second anchor.
    expect(link.tagName).toBe('A');
    expect(link).toHaveClass('text-text-muted');
    expect(link.querySelector('a')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('merges a caller className via cn(), overriding a default', () => {
    render(
      <BreadcrumbLink href="/" className="text-primary" data-testid="link">
        Home
      </BreadcrumbLink>,
    );
    const link = screen.getByTestId('link');
    // cn() de-dupes the conflicting colour: the caller's `text-primary` wins over `text-text-muted`.
    expect(link).toHaveClass('text-primary');
    expect(link).not.toHaveClass('text-text-muted');
  });

  it('forwards refs to the underlying element of each part', () => {
    const refs = {
      nav: null as HTMLElement | null,
      list: null as HTMLOListElement | null,
      item: null as HTMLLIElement | null,
      link: null as HTMLAnchorElement | null,
      page: null as HTMLSpanElement | null,
      separator: null as HTMLLIElement | null,
      ellipsis: null as HTMLSpanElement | null,
    };
    render(
      <Breadcrumb ref={(el) => (refs.nav = el)}>
        <BreadcrumbList ref={(el) => (refs.list = el)}>
          <BreadcrumbItem ref={(el) => (refs.item = el)}>
            <BreadcrumbLink ref={(el) => (refs.link = el)} href="/">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator ref={(el) => (refs.separator = el)} />
          <BreadcrumbItem>
            <BreadcrumbPage ref={(el) => (refs.page = el)}>Now</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbEllipsis ref={(el) => (refs.ellipsis = el)} />
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(refs.nav).toBeInstanceOf(HTMLElement);
    expect(refs.list).toBeInstanceOf(HTMLOListElement);
    expect(refs.item).toBeInstanceOf(HTMLLIElement);
    expect(refs.link).toBeInstanceOf(HTMLAnchorElement);
    expect(refs.page).toBeInstanceOf(HTMLSpanElement);
    expect(refs.separator).toBeInstanceOf(HTMLLIElement);
    expect(refs.ellipsis).toBeInstanceOf(HTMLSpanElement);
  });
});
