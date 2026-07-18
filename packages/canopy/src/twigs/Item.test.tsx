import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from './Item';

describe('Item', () => {
  it('renders every part with its children, composed inside the row', () => {
    render(
      <Item>
        <ItemMedia>
          <span data-testid="media">M</span>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Design review</ItemTitle>
          <ItemDescription>Due tomorrow at noon.</ItemDescription>
        </ItemContent>
        <ItemActions>
          <button type="button">Open</button>
        </ItemActions>
      </Item>,
    );

    expect(screen.getByTestId('media')).toBeInTheDocument();
    expect(screen.getByText('Design review')).toBeInTheDocument();
    expect(screen.getByText('Due tomorrow at noon.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument();
  });

  it('carries no ARIA role by default (a presentational row)', () => {
    render(
      <Item data-testid="row">
        <ItemContent>
          <ItemTitle>Plain row</ItemTitle>
        </ItemContent>
      </Item>,
    );
    const row = screen.getByTestId('row');
    expect(row.tagName).toBe('DIV');
    expect(row).not.toHaveAttribute('role');
  });

  it('defaults to the transparent `default` variant surface', () => {
    render(
      <Item data-testid="row">
        <ItemTitle>Default</ItemTitle>
      </Item>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('bg-transparent');
    expect(row).not.toHaveClass('border', 'bg-muted');
  });

  it('applies the `outline` variant surface (bordered)', () => {
    render(
      <Item data-testid="row" variant="outline">
        <ItemTitle>Outline</ItemTitle>
      </Item>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('border', 'border-border', 'bg-transparent');
    expect(row).not.toHaveClass('bg-muted');
  });

  it('applies the `muted` variant surface (filled)', () => {
    render(
      <Item data-testid="row" variant="muted">
        <ItemTitle>Muted</ItemTitle>
      </Item>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveClass('bg-muted');
    expect(row).not.toHaveClass('border', 'bg-transparent');
  });

  it('does NOT carry the clickable-row hover/focus affordance on a plain non-asChild row', () => {
    render(
      <Item data-testid="row">
        <ItemTitle>Presentational</ItemTitle>
      </Item>,
    );
    const row = screen.getByTestId('row');
    // A presentational `<div>` row must not signal clickability: CSS `:hover` fires on a `<div>`
    // too, so the hover highlight (and focus-visible ring) belong to the asChild path only.
    expect(row).not.toHaveClass('hover:bg-muted-raised');
    expect(row).not.toHaveClass('focus-visible:ring-2');
  });

  it('does NOT carry the hover affordance on a non-asChild outline row either', () => {
    render(
      <Item data-testid="row" variant="outline">
        <ItemTitle>Static outline</ItemTitle>
      </Item>,
    );
    expect(screen.getByTestId('row')).not.toHaveClass('hover:bg-muted-raised');
  });

  it('renders the whole row as an <a> via asChild, forwarding href and gaining the hover/focus affordance', () => {
    render(
      <Item asChild>
        <a href="/files/1">
          <ItemTitle>report.pdf</ItemTitle>
        </a>
      </Item>,
    );
    const link = screen.getByRole('link', { name: 'report.pdf' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/files/1');
    // The row's layout + clickable affordance ride onto the caller's element.
    expect(link).toHaveClass('flex', 'items-center', 'hover:bg-muted-raised');
    expect(link).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-ring');
  });

  it('renders the whole row as a <button> via asChild and fires its onClick', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Item asChild variant="outline">
        <button type="button" onClick={onClick}>
          <ItemTitle>Run action</ItemTitle>
        </button>
      </Item>,
    );
    const button = screen.getByRole('button', { name: 'Run action' });
    expect(button.tagName).toBe('BUTTON');
    // The variant surface still applies through the Slot.
    expect(button).toHaveClass('border', 'border-border');
    await user.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates the asChild button row from the keyboard', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Item asChild>
        <button type="button" onClick={onClick}>
          <ItemTitle>Keyboard row</ItemTitle>
        </button>
      </Item>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'Keyboard row' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('promotes ItemTitle to a real heading via asChild, keeping its typography role', () => {
    render(
      <ItemTitle asChild>
        <h3>Section title</h3>
      </ItemTitle>,
    );
    const heading = screen.getByRole('heading', { name: 'Section title', level: 3 });
    expect(heading.tagName).toBe('H3');
    // The `cn()` typography-role rule keeps BOTH classes on the provided element.
    expect(heading).toHaveClass('text-label', 'text-text');
  });

  it('renders ItemTitle as a non-heading <div> by default', () => {
    render(<ItemTitle>Not a heading</ItemTitle>);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Not a heading').tagName).toBe('DIV');
  });

  it('clips ItemDescription to one line by default, and lets a caller actually override to wrap', () => {
    render(
      <>
        <ItemDescription data-testid="clipped">Default clip</ItemDescription>
        <ItemDescription
          data-testid="wrapping"
          className="overflow-visible whitespace-normal text-body"
        >
          Overridden
        </ItemDescription>
      </>,
    );
    // Default: the clip is spelled out (not the atomic `truncate`) so a caller can undo it.
    const clipped = screen.getByTestId('clipped');
    expect(clipped).toHaveClass(
      'overflow-hidden',
      'text-ellipsis',
      'whitespace-nowrap',
      'text-body-sm',
      'text-text-muted',
    );
    // Override: the caller's `whitespace-normal overflow-visible` win the clip axes via cn(), so the
    // description genuinely wraps - the documented escape hatch produces the user-facing outcome.
    const wrapping = screen.getByTestId('wrapping');
    expect(wrapping).toHaveClass('whitespace-normal', 'overflow-visible', 'text-body');
    expect(wrapping).not.toHaveClass('whitespace-nowrap', 'overflow-hidden', 'text-body-sm');
  });

  it('keeps ItemMedia and ItemActions from shrinking, and flexes ItemContent', () => {
    render(
      <>
        <ItemMedia data-testid="media">i</ItemMedia>
        <ItemContent data-testid="content">c</ItemContent>
        <ItemActions data-testid="actions">a</ItemActions>
      </>,
    );
    expect(screen.getByTestId('media')).toHaveClass('shrink-0');
    expect(screen.getByTestId('content')).toHaveClass('min-w-0', 'flex-1');
    expect(screen.getByTestId('actions')).toHaveClass('ml-auto', 'shrink-0');
  });

  it('merges a caller className on Item via cn(), overriding a conflicting default (caller wins)', () => {
    render(
      <Item data-testid="row" className="rounded-none gap-6">
        <ItemTitle>Merged</ItemTitle>
      </Item>,
    );
    const row = screen.getByTestId('row');
    // cn() de-dupes the conflicting radius/gap: the caller's values win over the base.
    expect(row).toHaveClass('rounded-none', 'gap-6');
    expect(row).not.toHaveClass('rounded-lg', 'gap-3');
    // Non-conflicting base layout classes are preserved.
    expect(row).toHaveClass('flex', 'items-center');
  });

  it('forwards refs to the underlying elements of each part', () => {
    let itemEl: HTMLDivElement | null = null;
    let titleEl: HTMLDivElement | null = null;
    render(
      <Item ref={(el) => (itemEl = el)}>
        <ItemTitle ref={(el) => (titleEl = el)}>Titled</ItemTitle>
      </Item>,
    );
    expect(itemEl).toBeInstanceOf(HTMLDivElement);
    expect(titleEl).toBeInstanceOf(HTMLDivElement);
  });

  it('spreads native props onto each part', () => {
    render(
      <Item data-testid="row" aria-label="a file" title="hover text">
        <ItemActions data-testid="actions" aria-label="actions">
          <span>x</span>
        </ItemActions>
      </Item>,
    );
    const row = screen.getByTestId('row');
    expect(row).toHaveAttribute('aria-label', 'a file');
    expect(row).toHaveAttribute('title', 'hover text');
    expect(screen.getByTestId('actions')).toHaveAttribute('aria-label', 'actions');
  });
});
