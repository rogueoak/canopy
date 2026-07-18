import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup';

describe('ToggleGroup', () => {
  describe('grouping role', () => {
    it('exposes radiogroup semantics in single mode', () => {
      render(
        <ToggleGroup type="single" aria-label="Text alignment">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            C
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radiogroup', { name: 'Text alignment' })).toBeInTheDocument();
      // Members read as radios in single mode.
      expect(screen.getAllByRole('radio')).toHaveLength(2);
    });

    it('exposes a non-radiogroup grouping (toolbar) with the members as plain toggles in multiple mode', () => {
      render(
        <ToggleGroup type="multiple" aria-label="Formatting">
          <ToggleGroupItem value="bold" aria-label="Bold">
            B
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            I
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      // In multiple mode Radix does NOT expose radiogroup semantics (that is single-mode only); the
      // container is a plain grouping (toolbar) and each member stays a real button with aria-pressed.
      expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
      expect(screen.getByRole('toolbar', { name: 'Formatting' })).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('single mode selection', () => {
    it('selects at most one item and switching selection deselects the prior (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            C
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const left = screen.getByRole('radio', { name: 'Left' });
      const center = screen.getByRole('radio', { name: 'Center' });

      await user.click(left);
      expect(left).toHaveAttribute('data-state', 'on');
      expect(center).toHaveAttribute('data-state', 'off');

      await user.click(center);
      expect(left).toHaveAttribute('data-state', 'off');
      expect(center).toHaveAttribute('data-state', 'on');
    });

    it('honours defaultValue (uncontrolled) in single mode', () => {
      render(
        <ToggleGroup type="single" defaultValue="center" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            C
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('data-state', 'off');
      expect(screen.getByRole('radio', { name: 'Center' })).toHaveAttribute('data-state', 'on');
    });

    it('reflects a controlled value and fires onValueChange with the next value (single)', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="single" value="left" onValueChange={onValueChange} aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            C
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const center = screen.getByRole('radio', { name: 'Center' });
      await user.click(center);
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('center');
      // Controlled: stays on `left` until the parent updates `value`.
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('data-state', 'on');
      expect(center).toHaveAttribute('data-state', 'off');
    });

    it('updates when a controlling parent applies the new value (single)', async () => {
      const user = userEvent.setup();
      function Controlled() {
        const [value, setValue] = useState('left');
        return (
          <ToggleGroup type="single" value={value} onValueChange={setValue} aria-label="Align">
            <ToggleGroupItem value="left" aria-label="Left">
              L
            </ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Center">
              C
            </ToggleGroupItem>
          </ToggleGroup>
        );
      }
      render(<Controlled />);
      await user.click(screen.getByRole('radio', { name: 'Center' }));
      expect(screen.getByRole('radio', { name: 'Center' })).toHaveAttribute('data-state', 'on');
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveAttribute('data-state', 'off');
    });
  });

  describe('multiple mode selection', () => {
    it('toggles items independently so several can be on at once (uncontrolled)', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="multiple" aria-label="Format">
          <ToggleGroupItem value="bold" aria-label="Bold">
            B
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            I
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const bold = screen.getByRole('button', { name: 'Bold' });
      const italic = screen.getByRole('button', { name: 'Italic' });

      await user.click(bold);
      await user.click(italic);
      expect(bold).toHaveAttribute('data-state', 'on');
      expect(italic).toHaveAttribute('data-state', 'on');

      await user.click(bold);
      expect(bold).toHaveAttribute('data-state', 'off');
      expect(italic).toHaveAttribute('data-state', 'on');
    });

    it('honours defaultValue (uncontrolled array) in multiple mode', () => {
      render(
        <ToggleGroup type="multiple" defaultValue={['bold', 'italic']} aria-label="Format">
          <ToggleGroupItem value="bold" aria-label="Bold">
            B
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            I
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Underline">
            U
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute('data-state', 'on');
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('data-state', 'on');
      expect(screen.getByRole('button', { name: 'Underline' })).toHaveAttribute(
        'data-state',
        'off',
      );
    });

    it('reflects a controlled value array and fires onValueChange (multiple)', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup
          type="multiple"
          value={['bold']}
          onValueChange={onValueChange}
          aria-label="Format"
        >
          <ToggleGroupItem value="bold" aria-label="Bold">
            B
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            I
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      await user.click(screen.getByRole('button', { name: 'Italic' }));
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith(['bold', 'italic']);
      // Controlled: italic stays off until the parent updates `value`.
      expect(screen.getByRole('button', { name: 'Italic' })).toHaveAttribute('data-state', 'off');
    });
  });

  describe('variant / size shared via context', () => {
    it('shares the root variant on-state tokens to every item (default)', () => {
      render(
        <ToggleGroup type="single" variant="default" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass(
        'data-[state=on]:bg-accent',
        'data-[state=on]:text-accent-foreground',
      );
    });

    it('shares the root outline variant border + on-state tokens to every item', () => {
      render(
        <ToggleGroup type="single" variant="outline" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass(
        'border-border',
        'bg-surface',
        'data-[state=on]:bg-muted',
        'data-[state=on]:border-border-strong',
      );
    });

    it('shares the root size to every item', () => {
      render(
        <ToggleGroup type="single" size="lg" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass('h-12', 'text-base');
    });

    it('lets an item override the root variant / size locally', () => {
      render(
        <ToggleGroup type="single" variant="default" size="sm" aria-label="Align">
          <ToggleGroupItem value="left" variant="outline" size="lg" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const item = screen.getByRole('radio', { name: 'Left' });
      expect(item).toHaveClass('border-border', 'h-12');
      expect(item).not.toHaveClass('h-8');
    });
  });

  describe('joined segmented layout', () => {
    it('rounds only the outer corners and overlaps the shared border seam', () => {
      render(
        <ToggleGroup type="single" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radio', { name: 'Left' })).toHaveClass(
        'rounded-none',
        'first:rounded-l-md',
        'last:rounded-r-md',
        '[&:not(:first-child)]:-ml-px',
      );
    });
  });

  describe('keyboard (roving tabindex)', () => {
    it('gives the group one tab stop and moves focus with arrow keys, toggling on Enter', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="single" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Center">
            C
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Right">
            R
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const left = screen.getByRole('radio', { name: 'Left' });
      const center = screen.getByRole('radio', { name: 'Center' });

      // One tab stop: Tab lands on the first item.
      await user.tab();
      expect(left).toHaveFocus();

      // Arrow moves focus to the next item within the group.
      await user.keyboard('{ArrowRight}');
      expect(center).toHaveFocus();

      // The focused item toggles on Enter.
      await user.keyboard('{Enter}');
      expect(center).toHaveAttribute('data-state', 'on');
    });

    it('toggles the focused item on Space', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="multiple" aria-label="Format">
          <ToggleGroupItem value="bold" aria-label="Bold">
            B
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const bold = screen.getByRole('button', { name: 'Bold' });
      bold.focus();
      await user.keyboard(' ');
      expect(bold).toHaveAttribute('data-state', 'on');
    });
  });

  describe('disabled (inert)', () => {
    it('renders a disabled group inert (no toggle) and carries the opacity treatment', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <ToggleGroup type="single" disabled onValueChange={onValueChange} aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const left = screen.getByRole('radio', { name: 'Left' });
      expect(left).toBeDisabled();
      await user.click(left);
      expect(onValueChange).not.toHaveBeenCalled();
      expect(left).toHaveAttribute('data-state', 'off');
      expect(left).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('renders a single disabled item inert while its siblings stay interactive', async () => {
      const user = userEvent.setup();
      render(
        <ToggleGroup type="multiple" aria-label="Format">
          <ToggleGroupItem value="bold" disabled aria-label="Bold">
            B
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            I
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const bold = screen.getByRole('button', { name: 'Bold' });
      const italic = screen.getByRole('button', { name: 'Italic' });
      expect(bold).toBeDisabled();
      await user.click(bold);
      expect(bold).toHaveAttribute('data-state', 'off');
      // Sibling still toggles.
      await user.click(italic);
      expect(italic).toHaveAttribute('data-state', 'on');
    });
  });

  describe('className merge (caller wins)', () => {
    it('merges a caller className over the root defaults', () => {
      render(
        <ToggleGroup type="single" className="gap-4" aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(screen.getByRole('radiogroup')).toHaveClass('inline-flex', 'gap-4');
    });

    it('merges a caller className over the item defaults (caller wins the conflict)', () => {
      render(
        <ToggleGroup type="single" aria-label="Align">
          <ToggleGroupItem value="left" className="rounded-full" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      const item = screen.getByRole('radio', { name: 'Left' });
      // tailwind-merge lets the caller win the radius conflict.
      expect(item).toHaveClass('rounded-full');
      expect(item).not.toHaveClass('rounded-none');
    });
  });

  describe('ref forwarding', () => {
    it('forwards a ref to the underlying root element', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <ToggleGroup type="single" ref={ref} aria-label="Align">
          <ToggleGroupItem value="left" aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(ref.current).toBeInstanceOf(HTMLElement);
      expect(ref.current).toHaveAttribute('role', 'radiogroup');
    });

    it('forwards a ref to the underlying item button', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <ToggleGroup type="single" aria-label="Align">
          <ToggleGroupItem value="left" ref={ref} aria-label="Left">
            L
          </ToggleGroupItem>
        </ToggleGroup>,
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  it('renders icon/text children on items', () => {
    render(
      <ToggleGroup type="single" aria-label="Align">
        <ToggleGroupItem value="left" aria-label="Left">
          Left
        </ToggleGroupItem>
      </ToggleGroup>,
    );
    expect(screen.getByRole('radio', { name: 'Left' })).toHaveTextContent('Left');
  });
});
