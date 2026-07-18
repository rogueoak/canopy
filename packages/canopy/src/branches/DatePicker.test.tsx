import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { DateRange } from 'react-day-picker';
import { DatePicker } from './DatePicker';

// Radix Popover drives open / close on Pointer Events and positions its content with a
// ResizeObserver; react-day-picker scrolls focus into view. jsdom implements none of these, so
// these stubs let the real Radix + react-day-picker interaction run under jsdom (the standard
// workaround, matching Combobox.test.tsx).
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

/** Query the calendar grid (react-day-picker renders a `role="grid"`). */
function getGrid() {
  return screen.queryByRole('grid');
}

/** Click a specific day-of-month button inside the open calendar grid. */
async function pickDay(user: ReturnType<typeof userEvent.setup>, day: number) {
  const grid = screen.getByRole('grid');
  const cell = screen.getAllByRole('gridcell').find((c) => c.textContent?.trim() === String(day));
  // The interactive target is the day button inside the cell.
  const button = cell?.querySelector('button') ?? cell;
  void grid;
  await user.click(button as Element);
}

describe('DatePicker (single)', () => {
  it('renders a trigger showing the placeholder when unset', () => {
    render(<DatePicker aria-label="Due date" placeholder="Pick a day" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('Pick a day');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('carries the Input-parity field token classes on the trigger', () => {
    render(<DatePicker aria-label="Due date" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveClass('border-border', 'bg-surface', 'text-text', 'rounded-md', 'h-10');
  });

  it('opens the calendar popover on trigger click', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Due date" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(getGrid()).not.toBeInTheDocument();
    await user.click(trigger);
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens the calendar popover via the keyboard (Enter)', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Due date" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('picking a day sets the formatted value, fires onValueChange, and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due date"
        defaultValue={new Date(2024, 5, 1)}
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Due date' });
    await user.click(trigger);
    await screen.findByRole('grid');
    await pickDay(user, 15);
    expect(onValueChange).toHaveBeenCalledTimes(1);
    const picked = onValueChange.mock.calls[0][0] as Date;
    expect(picked).toBeInstanceOf(Date);
    expect(picked.getDate()).toBe(15);
    // Trigger now shows the date-fns-formatted date (PPP includes the year).
    expect(trigger).toHaveTextContent('2024');
    await waitFor(() => {
      expect(getGrid()).not.toBeInTheDocument();
    });
  });

  it('honours a caller-provided format string in the trigger label', () => {
    render(<DatePicker aria-label="Due date" value={new Date(2024, 5, 15)} format="yyyy-MM-dd" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('2024-06-15');
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Due date" disabled />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(getGrid()).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('applies the danger classes when aria-invalid', () => {
    render(<DatePicker aria-label="Due date" aria-invalid />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });

  it('Escape closes the popover and restores focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<DatePicker aria-label="Due date" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    await user.click(trigger);
    await screen.findByRole('grid');
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(getGrid()).not.toBeInTheDocument();
    });
    expect(trigger).toHaveFocus();
  });

  it('merges a caller className over the trigger defaults (cn / tailwind-merge)', () => {
    render(<DatePicker aria-label="Due date" className="px-10" />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveClass('px-10');
    expect(trigger).not.toHaveClass('px-3');
  });

  it('forwards a ref to the trigger element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<DatePicker aria-label="Due date" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('DatePicker (range)', () => {
  it('shows the formatted range with the default separator when both ends are set', () => {
    render(
      <DatePicker
        mode="range"
        aria-label="Span"
        value={{ from: new Date(2024, 5, 9), to: new Date(2024, 5, 14) }}
        format="yyyy-MM-dd"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Span' });
    expect(trigger).toHaveTextContent('2024-06-09 - 2024-06-14');
  });

  it('shows only the start (no separator) while the range is partial', () => {
    render(
      <DatePicker
        mode="range"
        aria-label="Span"
        value={{ from: new Date(2024, 5, 9), to: undefined }}
        format="yyyy-MM-dd"
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Span' });
    expect(trigger).toHaveTextContent('2024-06-09');
    expect(trigger).not.toHaveTextContent(' - ');
  });

  it('honours a caller-provided rangeSeparator', () => {
    render(
      <DatePicker
        mode="range"
        aria-label="Span"
        value={{ from: new Date(2024, 5, 9), to: new Date(2024, 5, 14) }}
        format="yyyy-MM-dd"
        rangeSeparator=" to "
      />,
    );
    expect(screen.getByRole('button', { name: 'Span' })).toHaveTextContent(
      '2024-06-09 to 2024-06-14',
    );
  });

  it('stays open after the first pick and closes once the range is complete', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<DatePicker mode="range" aria-label="Span" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Span' });
    await user.click(trigger);
    await screen.findByRole('grid');

    // Days 10 and 15 exist in every month, so this is stable regardless of the current date.
    // First pick sets the start; popover stays open (range incomplete).
    await pickDay(user, 10);
    expect(getGrid()).toBeInTheDocument();

    // Second pick completes the range and closes.
    await pickDay(user, 15);
    await waitFor(() => {
      expect(getGrid()).not.toBeInTheDocument();
    });
    const lastCall = onValueChange.mock.calls.at(-1)?.[0] as DateRange;
    expect(lastCall.from).toBeInstanceOf(Date);
    expect(lastCall.to).toBeInstanceOf(Date);
  });

  it('keeps the popover open when the second click lands on the start day', async () => {
    const user = userEvent.setup();
    render(<DatePicker mode="range" aria-label="Span" onValueChange={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: 'Span' });
    await user.click(trigger);
    await screen.findByRole('grid');

    // First pick sets the start. react-day-picker reports `{ from: d, to: d }`.
    await pickDay(user, 10);
    expect(getGrid()).toBeInTheDocument();

    // Second click on the SAME day is still a partial range (to === from), so the popover must
    // stay open - this pins the `to.getTime() !== from.getTime()` boundary the source special-cases.
    await pickDay(user, 10);
    expect(getGrid()).toBeInTheDocument();
  });

  it('shows the muted placeholder when unset', () => {
    render(<DatePicker mode="range" aria-label="Span" placeholder="Pick a range" />);
    const trigger = screen.getByRole('button', { name: 'Span' });
    expect(trigger).toHaveTextContent('Pick a range');
  });
});

describe('DatePicker (controlled + uncontrolled)', () => {
  it('controlled: the trigger label is driven by the value prop, not internal state', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DatePicker
        aria-label="Due date"
        value={new Date(2024, 5, 1)}
        format="yyyy-MM-dd"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('2024-06-01');

    // Picking fires the callback but does NOT change the display until the parent updates `value`.
    await user.click(trigger);
    await screen.findByRole('grid');
    await pickDay(user, 20);
    expect(onValueChange).toHaveBeenCalled();
    expect(trigger).toHaveTextContent('2024-06-01');

    rerender(
      <DatePicker
        aria-label="Due date"
        value={new Date(2024, 5, 20)}
        format="yyyy-MM-dd"
        onValueChange={onValueChange}
      />,
    );
    expect(trigger).toHaveTextContent('2024-06-20');
  });

  it('uncontrolled: internal state drives the display after a pick', async () => {
    const user = userEvent.setup();
    render(
      <DatePicker aria-label="Due date" defaultValue={new Date(2024, 5, 1)} format="yyyy-MM-dd" />,
    );
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('2024-06-01');
    await user.click(trigger);
    await screen.findByRole('grid');
    await pickDay(user, 25);
    await waitFor(() => {
      expect(trigger).toHaveTextContent('2024-06-25');
    });
  });

  it('controlledness is latched when a controlled parent later holds undefined', async () => {
    const user = userEvent.setup();
    function Wrapper() {
      const [value, setValue] = useState<Date | undefined>(new Date(2024, 5, 1));
      return (
        <>
          <button type="button" onClick={() => setValue(undefined)}>
            clear
          </button>
          <DatePicker
            aria-label="Due date"
            value={value}
            format="yyyy-MM-dd"
            onValueChange={setValue}
          />
        </>
      );
    }
    render(<Wrapper />);
    const trigger = screen.getByRole('button', { name: 'Due date' });
    expect(trigger).toHaveTextContent('2024-06-01');
    await user.click(screen.getByRole('button', { name: 'clear' }));
    expect(trigger).toHaveTextContent('Pick a date');
  });
});
