import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { DateRange } from 'react-day-picker';
import { Calendar } from './Calendar';

// A fixed month so day lookups are deterministic regardless of the machine's clock.
const JUNE_2024 = new Date(2024, 5, 15);

// react-day-picker renders each day's accessible name as the localized full date, e.g.
// "Wednesday, June 5th, 2024". Anchoring on ", <day><ordinal>, 2024" keeps the query unique
// (so "5th" never matches inside "15th") and stable across the selected/disabled suffixes.
const dayButton = (day: number) =>
  screen.getByRole('button', {
    name: new RegExp(`, June ${day}(st|nd|rd|th), 2024`, 'i'),
  });

// In react-day-picker v9 the `aria-selected` / `aria-disabled` state lives on the day cell
// (`<td role="gridcell">`), while the focusable `<button>` sits inside it - so selection/disabled
// assertions read the enclosing cell.
const dayCell = (day: number) => dayButton(day).closest('[role="gridcell"]') as HTMLElement;

describe('Calendar', () => {
  it('renders a month grid with gridcell days and a labelled caption', () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2024} />);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(27);
    // The month caption reads the visible month/year.
    expect(screen.getByText(/June 2024/i)).toBeInTheDocument();
  });

  it('single mode selects one day, reports it, and marks it selected', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    // react-day-picker's `onSelect` is a controlled callback: to see both the report AND the
    // selected state we hold the value in a wrapper (uncontrolled selection is covered below).
    const Demo = () => {
      const [selected, setSelected] = useState<Date>();
      return (
        <Calendar
          mode="single"
          defaultMonth={JUNE_2024}
          selected={selected}
          onSelect={(d) => {
            onSelect(d);
            setSelected(d);
          }}
        />
      );
    };
    render(<Demo />);
    await user.click(dayButton(10));
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [reported] = onSelect.mock.calls[0] as [Date];
    expect(reported.getDate()).toBe(10);
    expect(dayCell(10)).toHaveAttribute('aria-selected', 'true');
  });

  it('range mode reports a { from, to } span with the in-between highlighted', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const Demo = () => {
      const [range, setRange] = useState<DateRange>();
      return (
        <Calendar
          mode="range"
          defaultMonth={JUNE_2024}
          selected={range}
          onSelect={(r) => {
            onSelect(r);
            setRange(r);
          }}
        />
      );
    };
    render(<Demo />);
    await user.click(dayButton(10));
    await user.click(dayButton(14));
    expect(dayCell(10)).toHaveAttribute('aria-selected', 'true');
    expect(dayCell(14)).toHaveAttribute('aria-selected', 'true');
    // An in-between day is part of the selected range (the highlighted middle span).
    expect(dayCell(12)).toHaveAttribute('aria-selected', 'true');
    // The reported value is a `{ from, to }` object (not a Date[] or a swapped pair): the last
    // onSelect call closes the span from day 10 to day 14.
    const [reported] = onSelect.mock.lastCall as [DateRange];
    expect(reported.from?.getDate()).toBe(10);
    expect(reported.to?.getDate()).toBe(14);
  });

  it('multiple mode toggles days in the set', async () => {
    const user = userEvent.setup();
    const Demo = () => {
      const [days, setDays] = useState<Date[]>();
      return (
        <Calendar mode="multiple" defaultMonth={JUNE_2024} selected={days} onSelect={setDays} />
      );
    };
    render(<Demo />);
    await user.click(dayButton(10));
    await user.click(dayButton(12));
    expect(dayCell(10)).toHaveAttribute('aria-selected', 'true');
    expect(dayCell(12)).toHaveAttribute('aria-selected', 'true');
    // Re-picking a selected day removes it from the set.
    await user.click(dayButton(10));
    expect(dayCell(10)).not.toHaveAttribute('aria-selected', 'true');
    expect(dayCell(12)).toHaveAttribute('aria-selected', 'true');
  });

  it('next / prev buttons change the visible month', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="single" defaultMonth={JUNE_2024} />);
    expect(screen.getByText(/June 2024/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /next month/i }));
    expect(screen.getByText(/July 2024/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /previous month/i }));
    expect(screen.getByText(/June 2024/i)).toBeInTheDocument();
  });

  it('disabled dates are aria-disabled and not selectable', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Calendar
        mode="single"
        defaultMonth={JUNE_2024}
        disabled={[new Date(2024, 5, 10)]}
        onSelect={onSelect}
      />,
    );
    // react-day-picker v9 renders a disabled day as a native-`disabled` <button> (the correct
    // inert a11y primitive for a button) inside a `data-disabled` gridcell; the button carries a
    // ", disabled" accessible-name suffix. The state is thus observable and the day is inert.
    const disabledBtn = dayButton(10);
    expect(disabledBtn).toBeDisabled();
    expect(dayCell(10)).toHaveAttribute('data-disabled', 'true');
    await user.click(disabledBtn);
    expect(onSelect).not.toHaveBeenCalled();
    expect(dayCell(10)).not.toHaveAttribute('aria-selected', 'true');
  });

  it('carries the disabled opacity / cursor idiom on a disabled day cell', () => {
    render(<Calendar mode="single" defaultMonth={JUNE_2024} disabled={[new Date(2024, 5, 10)]} />);
    // The day cell (gridcell) wrapping the disabled button carries the toggle-style tokens.
    const cell = dayButton(10).closest('[role="gridcell"]');
    expect(cell).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('keyboard: arrow keys move focus and Enter selects', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar mode="single" defaultMonth={JUNE_2024} onSelect={onSelect} />);
    const start = dayButton(10);
    // Focusing the day updates react-day-picker's internal focus state, so wrap it in act().
    act(() => start.focus());
    expect(start).toHaveFocus();
    // Right arrow moves to the next day; Enter selects the focused day.
    await user.keyboard('{ArrowRight}');
    expect(dayButton(11)).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [selected] = onSelect.mock.calls[0] as [Date];
    expect(selected.getDate()).toBe(11);
  });

  it('keyboard: Space selects the focused day', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Calendar mode="single" defaultMonth={JUNE_2024} onSelect={onSelect} />);
    const day = dayButton(9);
    act(() => day.focus());
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(1);
    const [selected] = onSelect.mock.calls[0] as [Date];
    expect(selected.getDate()).toBe(9);
  });

  it('uncontrolled selection marks the picked day selected without a selected prop', async () => {
    const user = userEvent.setup();
    render(<Calendar mode="single" defaultMonth={JUNE_2024} />);
    await user.click(dayButton(12));
    expect(dayCell(12)).toHaveAttribute('aria-selected', 'true');
  });

  it('controlled selection reflects the selected prop and updates via onSelect', async () => {
    const user = userEvent.setup();
    const Controlled = () => {
      const [selected, setSelected] = useState<Date | undefined>(new Date(2024, 5, 5));
      return (
        <Calendar
          mode="single"
          defaultMonth={JUNE_2024}
          selected={selected}
          onSelect={setSelected}
        />
      );
    };
    render(<Controlled />);
    expect(dayCell(5)).toHaveAttribute('aria-selected', 'true');
    await user.click(dayButton(20));
    expect(dayCell(20)).toHaveAttribute('aria-selected', 'true');
    expect(dayCell(5)).not.toHaveAttribute('aria-selected', 'true');
  });

  it('merges a caller className onto the root (caller wins)', () => {
    const { container } = render(
      <Calendar mode="single" defaultMonth={JUNE_2024} className="p-8 border-2" />,
    );
    // tailwind-merge lets the caller p-8 override the default p-3; the root is the outermost div.
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('p-8', 'border-2');
    expect(root).not.toHaveClass('p-3');
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Calendar mode="single" defaultMonth={JUNE_2024} ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.querySelector('[role="grid"]')).toBeInTheDocument();
  });
});
