import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../seeds';
import { ButtonGroup } from './ButtonGroup';

describe('ButtonGroup', () => {
  it('renders its Button children in document order', () => {
    render(
      <ButtonGroup aria-label="Text alignment">
        <Button>Left</Button>
        <Button>Center</Button>
        <Button>Right</Button>
      </ButtonGroup>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Left', 'Center', 'Right']);
  });

  it('exposes the cluster as a labelled group (role=group + accessible name)', () => {
    render(
      <ButtonGroup aria-label="View mode">
        <Button>List</Button>
        <Button>Board</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group', { name: 'View mode' });
    expect(group).toBeInTheDocument();
    // The child buttons keep their own accessible names inside the group.
    expect(screen.getByRole('button', { name: 'List' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Board' })).toBeInTheDocument();
  });

  it('accepts aria-labelledby as the accessible name', () => {
    render(
      <>
        <span id="grp-label">Zoom</span>
        <ButtonGroup aria-labelledby="grp-label">
          <Button aria-label="Zoom out">-</Button>
          <Button aria-label="Zoom in">+</Button>
        </ButtonGroup>
      </>,
    );
    expect(screen.getByRole('group', { name: 'Zoom' })).toBeInTheDocument();
  });

  it('lays out horizontally by default with the row + start/end radius classes', () => {
    render(
      <ButtonGroup aria-label="H">
        <Button>a</Button>
        <Button>b</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('inline-flex', 'flex-row');
    expect(group).not.toHaveClass('flex-col');
    // outer radii for a row: leading child rounds left, trailing child rounds right
    expect(group).toHaveClass('[&>*:first-child]:rounded-l-md', '[&>*:last-child]:rounded-r-md');
    // flush neighbours collapse the horizontal seam
    expect(group).toHaveClass('[&>*:not(:first-child)]:-ml-px');
  });

  it('stacks vertically with the column + top/bottom radius classes when orientation=vertical', () => {
    render(
      <ButtonGroup aria-label="V" orientation="vertical">
        <Button>a</Button>
        <Button>b</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
    expect(group).not.toHaveClass('flex-row');
    // radii rotate to top/bottom, and the seam collapses on the vertical edge
    expect(group).toHaveClass('[&>*:first-child]:rounded-t-md', '[&>*:last-child]:rounded-b-md');
    expect(group).toHaveClass('[&>*:not(:first-child)]:-mt-px');
    // must not carry the horizontal seam/radius
    expect(group).not.toHaveClass('[&>*:not(:first-child)]:-ml-px');
  });

  it('squares the inner seams (children are rounded-none by default)', () => {
    render(
      <ButtonGroup aria-label="R">
        <Button>a</Button>
      </ButtonGroup>,
    );
    expect(screen.getByRole('group')).toHaveClass('[&>*]:rounded-none');
  });

  describe('separator (own derived logic)', () => {
    it('draws no divider by default', () => {
      render(
        <ButtonGroup aria-label="No sep">
          <Button>a</Button>
          <Button>b</Button>
        </ButtonGroup>,
      );
      const group = screen.getByRole('group');
      expect(group).not.toHaveClass('[&>*:not(:first-child)]:border-l');
      expect(group).not.toHaveClass('[&>*:not(:first-child)]:border-t');
    });

    it('draws the divider on the leading (left) edge for a horizontal group', () => {
      render(
        <ButtonGroup aria-label="Sep H" separator>
          <Button>a</Button>
          <Button>b</Button>
        </ButtonGroup>,
      );
      const group = screen.getByRole('group');
      expect(group).toHaveClass(
        '[&>*:not(:first-child)]:border-l',
        '[&>*:not(:first-child)]:border-l-border',
      );
      // the divider must rotate to the correct edge - never the vertical (top) edge here
      expect(group).not.toHaveClass('[&>*:not(:first-child)]:border-t');
    });

    it('rotates the divider to the top edge for a vertical group', () => {
      render(
        <ButtonGroup aria-label="Sep V" orientation="vertical" separator>
          <Button>a</Button>
          <Button>b</Button>
        </ButtonGroup>,
      );
      const group = screen.getByRole('group');
      expect(group).toHaveClass(
        '[&>*:not(:first-child)]:border-t',
        '[&>*:not(:first-child)]:border-t-border',
      );
      expect(group).not.toHaveClass('[&>*:not(:first-child)]:border-l');
    });
  });

  it('keeps a disabled child inert while its siblings stay clickable', async () => {
    const user = userEvent.setup();
    const onActive = vi.fn();
    const onDisabled = vi.fn();
    render(
      <ButtonGroup aria-label="States">
        <Button onClick={onActive}>Active</Button>
        <Button disabled onClick={onDisabled}>
          Off
        </Button>
      </ButtonGroup>,
    );
    const disabled = screen.getByRole('button', { name: 'Off' });
    expect(disabled).toBeDisabled();

    await user.click(disabled);
    expect(onDisabled).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Active' }));
    expect(onActive).toHaveBeenCalledTimes(1);
  });

  it('keeps each segment independently tabbable (no roving-tabindex)', async () => {
    const user = userEvent.setup();
    render(
      <ButtonGroup aria-label="Tab order">
        <Button>One</Button>
        <Button>Two</Button>
      </ButtonGroup>,
    );
    await user.tab();
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();
  });

  it('merges a caller className over the defaults (caller wins)', () => {
    render(
      <ButtonGroup aria-label="Merge" className="inline-grid gap-4">
        <Button>a</Button>
      </ButtonGroup>,
    );
    const group = screen.getByRole('group');
    // tailwind-merge drops the default inline-flex display in favour of the caller's inline-grid
    expect(group).toHaveClass('inline-grid');
    expect(group).not.toHaveClass('inline-flex');
    // a non-conflicting caller utility survives alongside the recipe classes
    expect(group).toHaveClass('gap-4', 'flex-row');
  });

  it('spreads native div props onto the container', () => {
    render(
      <ButtonGroup aria-label="Props" data-testid="grp" id="toolbar">
        <Button>a</Button>
      </ButtonGroup>,
    );
    const group = screen.getByTestId('grp');
    expect(group).toHaveAttribute('id', 'toolbar');
  });

  it('forwards a ref to the underlying container div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ButtonGroup aria-label="Ref" ref={ref}>
        <Button>a</Button>
      </ButtonGroup>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('role', 'group');
  });
});
