import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from './Empty';

describe('Empty', () => {
  it('renders each part and its children, composed inside the container', () => {
    render(
      <Empty>
        <EmptyMedia data-testid="media">
          <svg aria-hidden focusable="false" />
        </EmptyMedia>
        <EmptyTitle>No results</EmptyTitle>
        <EmptyDescription>Try a different search term.</EmptyDescription>
        <EmptyContent>
          <button type="button">Clear filters</button>
        </EmptyContent>
      </Empty>,
    );

    expect(screen.getByRole('heading', { name: 'No results' })).toBeInTheDocument();
    expect(screen.getByText('Try a different search term.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument();
    expect(screen.getByTestId('media')).toBeInTheDocument();
  });

  it('centres the container in a text-center column with vertical padding', () => {
    render(
      <Empty data-testid="empty">
        <EmptyTitle>Nothing here</EmptyTitle>
      </Empty>,
    );
    const empty = screen.getByTestId('empty');
    expect(empty).toHaveClass('flex', 'flex-col', 'items-center', 'text-center', 'py-12');
  });

  it('renders EmptyTitle as a real heading at the default level (h3) on the text token', () => {
    render(<EmptyTitle>Inbox zero</EmptyTitle>);
    const heading = screen.getByRole('heading', { name: 'Inbox zero' });
    expect(heading.tagName).toBe('H3');
    expect(heading).toHaveClass('text-h3', 'text-text');
  });

  it('overrides the heading element via asChild for outline correctness', () => {
    render(
      <EmptyTitle asChild>
        <h2>Section empty</h2>
      </EmptyTitle>,
    );
    const heading = screen.getByRole('heading', { name: 'Section empty', level: 2 });
    expect(heading.tagName).toBe('H2');
    // The title role classes still ride on the provided element.
    expect(heading).toHaveClass('text-h3', 'text-text');
  });

  it('renders EmptyDescription as a muted paragraph', () => {
    render(<EmptyDescription data-testid="desc">Supporting copy.</EmptyDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc.tagName).toBe('P');
    expect(desc).toHaveClass('text-text-muted', 'text-body-sm');
  });

  it('hides EmptyMedia from assistive tech by default (decorative icon)', () => {
    render(
      <EmptyMedia data-testid="media">
        <svg />
      </EmptyMedia>,
    );
    expect(screen.getByTestId('media')).toHaveAttribute('aria-hidden', 'true');
  });

  it('allows the aria-hidden default to be overridden', () => {
    render(
      <EmptyMedia data-testid="media" aria-hidden={false}>
        <svg />
      </EmptyMedia>,
    );
    // Caller override wins over the built-in decorative default.
    expect(screen.getByTestId('media')).toHaveAttribute('aria-hidden', 'false');
  });

  it('wraps a caller-supplied element via asChild, keeping the decorative default and media token', () => {
    render(
      <EmptyMedia asChild data-testid="icon">
        <svg role="img" aria-label="Empty inbox" />
      </EmptyMedia>,
    );
    const icon = screen.getByTestId('icon');
    // asChild renders the provided element (no extra wrapper div), carrying the media class...
    expect(icon.tagName.toLowerCase()).toBe('svg');
    expect(icon).toHaveClass('text-text-subtle');
    // ...and the aria-hidden default merges onto it.
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });

  it('lays out EmptyContent action children in a centred wrapping row', () => {
    render(
      <EmptyContent data-testid="content">
        <button type="button">Primary</button>
        <button type="button">Secondary</button>
      </EmptyContent>,
    );
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('flex', 'flex-wrap', 'items-center', 'justify-center', 'gap-2');
    expect(content.querySelectorAll('button')).toHaveLength(2);
  });

  it('merges a caller className via cn(), overriding a conflicting default', () => {
    render(
      <Empty data-testid="empty" className="py-0">
        <EmptyTitle>x</EmptyTitle>
      </Empty>,
    );
    const empty = screen.getByTestId('empty');
    // cn() de-dupes the conflicting padding: the caller's `py-0` wins over `py-12`.
    expect(empty).toHaveClass('py-0');
    expect(empty).not.toHaveClass('py-12');
    // Non-conflicting base classes are preserved.
    expect(empty).toHaveClass('flex', 'flex-col', 'items-center', 'text-center');
  });

  it('forwards refs to the underlying elements of each part', () => {
    let containerEl: HTMLDivElement | null = null;
    let mediaEl: HTMLDivElement | null = null;
    let titleEl: HTMLHeadingElement | null = null;
    let descEl: HTMLParagraphElement | null = null;
    let contentEl: HTMLDivElement | null = null;
    render(
      <Empty ref={(el) => (containerEl = el)}>
        <EmptyMedia ref={(el) => (mediaEl = el)}>
          <svg />
        </EmptyMedia>
        <EmptyTitle ref={(el) => (titleEl = el)}>Titled</EmptyTitle>
        <EmptyDescription ref={(el) => (descEl = el)}>Copy</EmptyDescription>
        <EmptyContent ref={(el) => (contentEl = el)}>
          <button type="button">Go</button>
        </EmptyContent>
      </Empty>,
    );
    expect(containerEl).toBeInstanceOf(HTMLDivElement);
    expect(mediaEl).toBeInstanceOf(HTMLDivElement);
    expect(titleEl).toBeInstanceOf(HTMLHeadingElement);
    expect(descEl).toBeInstanceOf(HTMLParagraphElement);
    expect(contentEl).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads native props onto each part', () => {
    render(
      <Empty data-testid="empty" aria-label="No projects" role="region">
        <EmptyContent data-testid="content" id="actions">
          <button type="button">Create</button>
        </EmptyContent>
      </Empty>,
    );
    const empty = screen.getByTestId('empty');
    expect(empty).toHaveAttribute('aria-label', 'No projects');
    expect(empty).toHaveAttribute('role', 'region');
    expect(screen.getByTestId('content')).toHaveAttribute('id', 'actions');
  });
});
