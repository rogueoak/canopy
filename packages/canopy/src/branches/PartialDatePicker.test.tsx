import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, createRef, useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PartialDatePicker } from './PartialDatePicker';

// Radix Popover drives open / close on Pointer Events and positions its content with a
// ResizeObserver; react-day-picker scrolls focus into view. jsdom implements none of these, so
// these stubs let the real Radix + react-day-picker interaction run (matching DatePicker.test.tsx).
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

function field(): HTMLInputElement {
  return screen.getByRole('textbox');
}

function openButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Choose a date' });
}

/**
 * Open the popover and wait for focus to actually land in the grid. Waiting matters: a keyboard
 * test that types before focus has moved sends its keys to `<body>`, where they do nothing, and
 * then passes whatever the component does.
 */
async function openPanel(user: ReturnType<typeof userEvent.setup>) {
  await user.click(openButton());
  const grid = await screen.findByRole('grid');
  await waitFor(() => expect(grid.contains(document.activeElement)).toBe(true));
  return grid;
}

/** The label of whichever grid is showing - our own period, or react-day-picker's month. */
function gridLabel(): string | null {
  return screen.getByRole('grid').getAttribute('aria-label');
}

/** A cell in the year or month grid, whose accessible name is just its label. */
function cell(name: string | RegExp): HTMLElement {
  return within(screen.getByRole('grid')).getByRole('button', { name });
}

/**
 * A day cell in the composed `Calendar`. react-day-picker gives its day buttons a full spoken date
 * as the accessible name ("Tuesday, May 14th, 1968"), so they are found by their visible number.
 */
function dayCell(day: number): HTMLElement {
  const cells = within(screen.getByRole('grid')).getAllByRole('gridcell');
  const match = cells.find((td) => td.textContent?.trim() === String(day));
  if (!match) throw new Error(`no day cell ${day} in the calendar`);
  return match.querySelector('button') as HTMLElement;
}

/** The single always-mounted live region under the field. */
function liveRegion(): HTMLElement {
  return screen.getByRole('status');
}

describe('PartialDatePicker: the value is only ever a partial date', () => {
  it('renders an empty field with the format in the placeholder', () => {
    render(<PartialDatePicker aria-label="Birthday" />);
    expect(field()).toHaveValue('');
    // Examples, not a schema: the placeholder is also where somebody learns a year alone is legal.
    expect(field()).toHaveAttribute('placeholder', '1968, 1968-05 or 1968-05-14');
  });

  it('emits exactly the year when a year is picked, inventing no month and no day', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(cell('1970'));

    expect(onValueChange).toHaveBeenCalledWith('1970');
    expect(onValueChange).not.toHaveBeenCalledWith('1970-01');
    expect(onValueChange).not.toHaveBeenCalledWith('1970-01-01');
    expect(field()).toHaveValue('1970');
  });

  it('emits exactly the year and month when a month is picked', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(cell('May'));

    expect(onValueChange).toHaveBeenLastCalledWith('1970-05');
    expect(field()).toHaveValue('1970-05');
  });

  it('emits the full date when a day is picked, and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(cell('May'));
    await user.click(dayCell(14));

    expect(onValueChange).toHaveBeenLastCalledWith('1970-05-14');
    expect(field()).toHaveValue('1970-05-14');
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
  });

  it('every value it ever emits matches the wire format', async () => {
    const user = userEvent.setup();
    const emitted: (string | undefined)[] = [];
    render(
      <PartialDatePicker
        aria-label="Birthday"
        defaultValue="1968"
        onValueChange={(v) => emitted.push(v)}
      />,
    );

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(cell('May'));
    await user.click(dayCell(14));
    await user.clear(field());
    await user.type(field(), '1970-3');

    expect(emitted.length).toBeGreaterThan(0);
    for (const value of emitted) {
      if (value === undefined) continue;
      expect(value, value).toMatch(/^\d{4}(-\d{2}(-\d{2})?)?$/);
    }
  });

  it('keeps the popover open after a year and after a month, because refining is still possible', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.click(cell('1970'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await user.click(cell('May'));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('truncates back to a year when the year is re-picked after a full date', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Birthday"
        defaultValue="1968-05-14"
        onValueChange={onValueChange}
      />,
    );

    // Zoom out day -> month -> year, then re-pick the same year.
    await openPanel(user);
    await user.click(screen.getByRole('button', { name: /May 1968/ }));
    await user.click(screen.getByRole('button', { name: /^1968/ }));
    await user.click(cell('1968'));

    expect(onValueChange).toHaveBeenLastCalledWith('1968');
    expect(field()).toHaveValue('1968');
  });
});

describe('PartialDatePicker: typing', () => {
  it('accepts each of the three shapes typed directly', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PartialDatePicker aria-label="Birthday" onValueChange={onValueChange} />);

    await user.type(field(), '1968');
    expect(onValueChange).toHaveBeenLastCalledWith('1968');

    await user.type(field(), '-05');
    expect(onValueChange).toHaveBeenLastCalledWith('1968-05');

    await user.type(field(), '-14');
    expect(onValueChange).toHaveBeenLastCalledWith('1968-05-14');
  });

  it('normalizes lenient punctuation and padding, and canonicalizes the text on blur', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PartialDatePicker aria-label="Birthday" onValueChange={onValueChange} />);

    await user.type(field(), '1968/5/4');
    expect(onValueChange).toHaveBeenLastCalledWith('1968-05-04');

    await user.tab();
    expect(field()).toHaveValue('1968-05-04');
  });

  it('does not flag an incomplete draft while typing', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await user.type(field(), '1968-');

    expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/Enter a year/)).not.toBeInTheDocument();
  });

  it('raises the format message on blur, not during typing', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await user.type(field(), 'sometime');
    expect(screen.queryByText(/Enter a year/)).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText(/Enter a year/)).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears the message on the next keystroke', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await user.type(field(), 'sometime');
    await user.tab();
    expect(screen.getByText(/Enter a year/)).toBeInTheDocument();

    await user.click(field());
    await user.type(field(), '1');
    expect(screen.queryByText(/Enter a year/)).not.toBeInTheDocument();
  });

  it('refuses a two-digit year rather than guessing a century', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PartialDatePicker aria-label="Birthday" onValueChange={onValueChange} />);

    await user.type(field(), '68');
    await user.tab();

    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    expect(onValueChange).not.toHaveBeenCalledWith('1968');
    expect(onValueChange).not.toHaveBeenCalledWith('2068');
    expect(screen.getByText(/Enter a year/)).toBeInTheDocument();
  });

  it('distinguishes an out-of-range date from an unreadable one', async () => {
    const user = userEvent.setup();
    render(
      <PartialDatePicker aria-label="Memory date" min="1900" max="2026-08-11" locale="en-GB" />,
    );

    await user.type(field(), '2027');
    await user.tab();

    // The default names the bounds rather than only refusing.
    expect(screen.getByText('Enter a date between 1900 and 11 August 2026.')).toBeInTheDocument();
    expect(screen.queryByText(/Enter a year/)).not.toBeInTheDocument();
  });

  it('names only the bound that exists', async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <PartialDatePicker aria-label="d" max="2026-08-11" locale="en-GB" />,
    );
    await user.type(field(), '2027');
    await user.tab();
    expect(screen.getByText('Enter a date no later than 11 August 2026.')).toBeInTheDocument();
    unmount();

    render(<PartialDatePicker aria-label="d" min="1900" locale="en-GB" />);
    await user.type(field(), '1899');
    await user.tab();
    expect(screen.getByText('Enter a date no earlier than 1900.')).toBeInTheDocument();
  });

  it('lets a caller replace the range message', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="d" max="2026" outOfRangeMessage="Not in the future." />);

    await user.type(field(), '2027');
    await user.tab();

    expect(screen.getByText('Not in the future.')).toBeInTheDocument();
  });

  it('emits undefined while the draft does not name a date, so the parent never holds a stale value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await user.clear(field());

    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it('rejects an impossible date that is nonetheless well punctuated', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PartialDatePicker aria-label="Birthday" onValueChange={onValueChange} />);

    await user.type(field(), '1969-02-29');
    await user.tab();

    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    expect(screen.getByText(/Enter a year/)).toBeInTheDocument();
  });

  it('leaves an empty field valid and empty on blur', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await user.click(field());
    await user.tab();

    expect(field()).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText(/Enter a year/)).not.toBeInTheDocument();
  });
});

describe('PartialDatePicker: which grid opens', () => {
  it('opens on the year grid when there is no value, putting a year-only answer one tap away', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    const grid = await openPanel(user);

    expect(within(grid).getByRole('button', { name: '2020' })).toBeInTheDocument();
    expect(grid).toHaveAttribute('aria-label', expect.stringMatching(/^\d{4} - \d{4}$/));
  });

  it('opens at the precision of the value it already has', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    const grid = await openPanel(user);

    expect(grid).toHaveAttribute('aria-label', '1968');
    expect(within(grid).getByRole('button', { name: 'May' })).toBeInTheDocument();
  });

  it('opens on the day grid for a day-precision value', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05-14" />);

    await openPanel(user);

    expect(screen.getByRole('button', { name: /May 1968/ })).toBeInTheDocument();
    expect(dayCell(14)).toBeInTheDocument();
  });

  it('honours defaultView for a field whose dates are usually recent', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" defaultView="day" />);

    await openPanel(user);

    expect(screen.getAllByRole('gridcell').length).toBeGreaterThan(20);
  });

  it('reopens where the value is, not where the last visit wandered to', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);
    await user.click(screen.getByRole('button', { name: /^1968/ }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', expect.stringContaining('-'));

    await user.keyboard('{Escape}');
    await openPanel(user);

    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1968');
  });
});

describe('PartialDatePicker: bounds', () => {
  it('admits a coarse value whose interval overlaps the bound', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Memory date" max="2026-08-11" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    // 2026 has partly happened, so a year-only answer of 2026 is not a claim about a future day.
    const year2026 = cell('2026');
    expect(year2026).not.toHaveAttribute('aria-disabled', 'true');
    await user.click(year2026);

    expect(onValueChange).toHaveBeenCalledWith('2026');
  });

  it('marks an out-of-range year unavailable and ignores activation on it', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Memory date" max="2026-08-11" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    const year2027 = cell('2027');
    expect(year2027).toHaveAttribute('aria-disabled', 'true');

    await user.click(year2027);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('uses aria-disabled rather than the disabled attribute, so the cell stays reachable', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" max="2026-08-11" />);

    await openPanel(user);
    const year2027 = cell('2027');

    expect(year2027).toHaveAttribute('aria-disabled', 'true');
    expect(year2027).not.toBeDisabled();
  });

  it('marks an out-of-range month unavailable', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" max="2026-08-11" defaultValue="2026-01" />);

    await openPanel(user);

    expect(cell('Aug')).not.toHaveAttribute('aria-disabled', 'true');
    expect(cell('Sep')).toHaveAttribute('aria-disabled', 'true');
  });

  it('passes the bounds down to the day grid', async () => {
    const user = userEvent.setup();
    render(
      <PartialDatePicker aria-label="Memory date" max="2026-08-11" defaultValue="2026-08-10" />,
    );

    await openPanel(user);

    expect(dayCell(11)).not.toBeDisabled();
    expect(dayCell(12)).toBeDisabled();
  });

  it('disables the step control at the bound', async () => {
    const user = userEvent.setup();
    render(
      <PartialDatePicker aria-label="Memory date" min="1900" max="1980" defaultValue="1975" />,
    );

    await openPanel(user);

    // The year page holding 1975 is 1960-1979; the next page (1980-1999) still holds 1980.
    expect(screen.getByRole('button', { name: 'Next' })).not.toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('refuses an out-of-range year the keyboard can still land on', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Memory date"
        max="2026-08-11"
        defaultValue="2026"
        onValueChange={onValueChange}
      />,
    );

    await openPanel(user);
    // Arrowing onto an unavailable cell is deliberately possible - it is `aria-disabled`, not
    // `disabled` - so activation is what has to refuse.
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(cell('2027')).toHaveFocus());
    await user.keyboard('{Enter}');

    expect(onValueChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('2026');
  });

  it('refuses an out-of-range month when its cell is activated', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Memory date"
        max="2026-08-11"
        defaultValue="2026-01"
        onValueChange={onValueChange}
      />,
    );

    await openPanel(user);
    await user.click(cell('Sep'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue('2026-01');
  });

  it('never emits an out-of-range date that was typed', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Memory date" max="2026-08-11" onValueChange={onValueChange} />,
    );

    await user.type(field(), '2027-03-05');

    expect(onValueChange).not.toHaveBeenCalledWith('2027');
    expect(onValueChange).not.toHaveBeenCalledWith('2027-03');
    expect(onValueChange).not.toHaveBeenCalledWith('2027-03-05');
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
  });

  it('disables the step-back control at the lower bound', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" min="1900" defaultValue="1900" />);

    await openPanel(user);

    expect(screen.getByRole('button', { name: 'Previous' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('anchors an empty field on a page it is allowed to pick from', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" max="1980" />);

    await openPanel(user);

    // Today's year is out of range, so opening there would show a page of dead cells.
    expect(cell('1980')).toBeInTheDocument();
    expect(cell('1980')).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('keeps the day grid inside the bounds when react-day-picker navigates it', async () => {
    const user = userEvent.setup();

    // First prove the navigation is live, or the assertion below passes on a key that did nothing.
    const unbounded = render(
      <PartialDatePicker aria-label="Memory date" defaultValue="1968-05-14" />,
    );
    await openPanel(user);
    expect(gridLabel()).toBe('May 1968');
    await user.keyboard('{PageUp}');
    await waitFor(() => expect(gridLabel()).toBe('April 1968'));
    unbounded.unmount();

    render(<PartialDatePicker aria-label="Memory date" min="1968-05" defaultValue="1968-05-14" />);
    await openPanel(user);
    expect(gridLabel()).toBe('May 1968');
    await user.keyboard('{PageUp}');

    // The same keystroke that moved an unbounded grid must not move this one past its floor.
    await waitFor(() => expect(gridLabel()).toBe('May 1968'));
    await user.keyboard('{PageDown}');
    await waitFor(() => expect(gridLabel()).toBe('June 1968'));
  });

  it('does not step the page past the bound', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" min="1900" defaultValue="1900" />);

    await openPanel(user);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1900 - 1919');

    await user.click(screen.getByRole('button', { name: 'Previous' }));

    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1900 - 1919');
  });
});

describe('PartialDatePicker: keyboard', () => {
  it('opens from the field with ArrowDown and puts focus in the grid', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await user.click(field());
    await user.keyboard('{ArrowDown}');

    await screen.findByRole('grid');
    await waitFor(() => expect(cell('1968')).toHaveFocus());
  });

  it('keeps exactly one cell tabbable (roving tabindex)', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    const grid = await openPanel(user);
    const tabbable = within(grid)
      .getAllByRole('button')
      .filter((button) => button.getAttribute('tabindex') === '0');

    expect(tabbable).toHaveLength(1);
    expect(tabbable[0]).toHaveTextContent('1968');
  });

  it('moves one year with Left and Right', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(cell('1969')).toHaveFocus());

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(cell('1967')).toHaveFocus());
  });

  it('moves a row of four with Up and Down', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(cell('1972')).toHaveFocus());

    await user.keyboard('{ArrowUp}');
    await waitFor(() => expect(cell('1968')).toHaveFocus());
  });

  it('moves to the ends of the row with Home and End', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1966" />);

    await openPanel(user);
    // The 1960-1979 page lays out four to a row, so 1966 sits in the row 1964-1967.
    await user.keyboard('{Home}');
    await waitFor(() => expect(cell('1964')).toHaveFocus());

    await user.keyboard('{End}');
    await waitFor(() => expect(cell('1967')).toHaveFocus());
  });

  it('moves a whole page of twenty years with PageUp and PageDown', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.keyboard('{PageDown}');
    await waitFor(() => expect(cell('1988')).toHaveFocus());

    await user.keyboard('{PageUp}');
    await waitFor(() => expect(cell('1968')).toHaveFocus());
  });

  it('selects the focused year with Enter', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.keyboard('{ArrowRight}{Enter}');

    expect(onValueChange).toHaveBeenLastCalledWith('1969');
  });

  it('selects the focused year with Space', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.keyboard('{ArrowLeft}[Space]');

    expect(onValueChange).toHaveBeenLastCalledWith('1967');
  });

  it('moves by one and by a row of three in the month grid', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(cell('Jun')).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(cell('Sep')).toHaveFocus());

    await user.keyboard('{Home}');
    await waitFor(() => expect(cell('Jul')).toHaveFocus());
  });

  it('steps a year with PageUp in the month grid', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);
    await user.keyboard('{PageUp}');

    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1967');
  });

  it('closes on Escape and returns focus to the field, not the trigger button', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
    await waitFor(() => expect(field()).toHaveFocus());
  });

  it('commits a month with Enter and with Space', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { unmount } = render(
      <PartialDatePicker
        aria-label="Birthday"
        defaultValue="1968-05"
        onValueChange={onValueChange}
      />,
    );

    await openPanel(user);
    await user.keyboard('{ArrowLeft}{Enter}');
    expect(onValueChange).toHaveBeenLastCalledWith('1968-04');
    unmount();

    const onValueChange2 = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Birthday"
        defaultValue="1968-05"
        onValueChange={onValueChange2}
      />,
    );
    await openPanel(user);
    await user.keyboard('{ArrowUp}[Space]');
    expect(onValueChange2).toHaveBeenLastCalledWith('1968-02');
  });

  it('covers the rest of the month grid map: End and PageDown', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);
    // May sits in the row Apr-May-Jun, so End is June.
    await user.keyboard('{End}');
    await waitFor(() => expect(cell('Jun')).toHaveFocus());

    await user.keyboard('{PageDown}');
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1969');
  });

  it('descends a level on Enter and lands focus in the grid below', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1968'));
    await waitFor(() => expect(document.activeElement?.tagName).toBe('BUTTON'));
  });
});

/**
 * The `Calendar` bridge is the one place a `Date` exists, so it is the one place the timezone bug
 * can come back. CI runs in UTC, where local and UTC calendar fields are identical by definition -
 * so without pinning the zone here, swapping the bridge to `Date.UTC` + `getUTC*` passes the whole
 * suite. Each test asserts its own trap is LIVE before asserting the component is not fooled.
 */
describe('PartialDatePicker: the Calendar bridge is read by fields, not by UTC', () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it('round-trips a day west of Greenwich, where a UTC-parsed month reads a month early', async () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(new Date('1974-06').getMonth(), 'the trap must be live').toBe(4);

    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Memory date"
        defaultValue="1974-06-15"
        onValueChange={onValueChange}
      />,
    );

    await openPanel(user);
    expect(gridLabel()).toBe('June 1974');
    await user.click(dayCell(3));

    expect(onValueChange).toHaveBeenLastCalledWith('1974-06-03');
  });

  it('round-trips a day east of Greenwich, where a UTC-serialized day reads a day early', async () => {
    process.env.TZ = 'Asia/Tokyo';
    expect(new Date(1974, 5, 3).toISOString().slice(0, 10), 'the trap must be live').toBe(
      '1974-06-02',
    );

    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker
        aria-label="Memory date"
        defaultValue="1974-06-15"
        onValueChange={onValueChange}
      />,
    );

    await openPanel(user);
    expect(gridLabel()).toBe('June 1974');
    await user.click(dayCell(3));

    expect(onValueChange).toHaveBeenLastCalledWith('1974-06-03');
  });

  it('shows the month the value names, not the one a UTC parse would land on', async () => {
    process.env.TZ = 'America/Los_Angeles';
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Memory date" defaultValue="1974-01-01" />);

    await openPanel(user);

    // A UTC-parsed 1974-01-01 renders as December 1973 in this zone.
    expect(gridLabel()).toBe('January 1974');
  });
});

describe('PartialDatePicker: closing by clicking away', () => {
  it('does not pull focus back to the field when the user deliberately clicks elsewhere', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">elsewhere</button>
        <PartialDatePicker aria-label="Birthday" defaultValue="1968" />
      </>,
    );

    await openPanel(user);
    const elsewhere = screen.getByRole('button', { name: 'elsewhere' });
    await user.click(elsewhere);

    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
    expect(field()).not.toHaveFocus();
  });

  it('still returns focus to the field on Escape after a previous click-away close', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">elsewhere</button>
        <PartialDatePicker aria-label="Birthday" defaultValue="1968" />
      </>,
    );

    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());

    // Reopening must clear the latched reason, or Escape declines to restore focus.
    await openPanel(user);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
    await waitFor(() => expect(field()).toHaveFocus());
  });

  it('reopens at the value precision when opened from the keyboard, not just the button', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    // Wander up to the year grid, close, then reopen with ArrowDown rather than the trigger.
    await openPanel(user);
    await user.click(screen.getByRole('button', { name: /^1968/ }));
    expect(gridLabel()).toBe('1960 - 1979');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());

    await user.click(field());
    await user.keyboard('{ArrowDown}');

    await screen.findByRole('grid');
    expect(gridLabel()).toBe('1968');
  });
});

describe('PartialDatePicker: accessibility', () => {
  it('labels each grid with the period it is showing', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1968');

    await user.click(screen.getByRole('button', { name: /^1968/ }));
    expect(screen.getByRole('grid')).toHaveAttribute('aria-label', '1960 - 1979');
  });

  it('marks the selected cell with aria-selected', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    const selected = screen
      .getAllByRole('gridcell')
      .filter((td) => td.getAttribute('aria-selected') === 'true');

    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('1968');
  });

  it('announces the selection with its precision', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" locale="en-GB" defaultValue="1968" />);

    await openPanel(user);
    await user.click(cell('1970'));
    expect(liveRegion()).toHaveTextContent('1970, year only');

    await user.click(cell('May'));
    expect(liveRegion()).toHaveTextContent('May 1970, month and year');

    await user.click(dayCell(14));
    expect(liveRegion()).toHaveTextContent('14 May 1970, full date');
  });

  it('mounts the live region before it has anything to say', () => {
    render(<PartialDatePicker aria-label="Birthday" />);

    expect(liveRegion()).toBeInTheDocument();
    expect(liveRegion()).toHaveTextContent('');
    expect(liveRegion()).toHaveClass('sr-only');
  });

  it('uses the one live region for the validation message, visibly', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await user.type(field(), 'sometime');
    await user.tab();

    expect(liveRegion()).toHaveTextContent(/Enter a year/);
    expect(liveRegion()).not.toHaveClass('sr-only');
    // One message, one element - the copy must not also exist somewhere else.
    expect(screen.getAllByText(/Enter a year/)).toHaveLength(1);
  });

  it('re-points the composed Calendar for the raised surface it is dropped onto', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05-14" />);

    await openPanel(user);
    const day = dayCell(14);

    // Calendar is tuned for the page canvas: base `muted` is DARKER than `surface-raised` in dark,
    // so its hover would recede here, and its ring offset would draw the canvas halo inside the
    // panel. jsdom resolves no CSS, so the class string is the only thing assertable - and it is
    // what actually regresses.
    expect(day).toHaveClass('hover:bg-muted-raised', 'focus-visible:ring-offset-surface-raised');
    expect(day).not.toHaveClass('hover:bg-muted', 'focus-visible:ring-offset-ring-offset');
    // and the phone tap target does not change scale between levels of the same panel
    expect(day).toHaveClass('h-11', 'w-11', 'md:h-9', 'md:w-9');
  });

  it('has exactly one live region at every level, including over the day grid', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    expect(screen.getAllByRole('status')).toHaveLength(1);

    await openPanel(user);
    expect(screen.getAllByRole('status')).toHaveLength(1);

    await user.click(cell('1970'));
    expect(screen.getAllByRole('status')).toHaveLength(1);

    // react-day-picker's own month caption is a `role="status"` live region. It must be removed,
    // not merely styled away, or a screen reader gets two things talking over each other.
    await user.click(cell('May'));
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('describes the field by the message region', () => {
    render(<PartialDatePicker aria-label="Birthday" />);

    expect(field().getAttribute('aria-describedby')).toBe(liveRegion().id);
  });

  it('keeps a caller aria-describedby alongside its own', () => {
    render(
      <>
        <span id="own-hint">Approximate is fine</span>
        <PartialDatePicker aria-label="Birthday" aria-describedby="own-hint" />
      </>,
    );

    expect(field().getAttribute('aria-describedby')).toBe(`own-hint ${liveRegion().id}`);
  });

  it('honours a caller aria-invalid', () => {
    render(<PartialDatePicker aria-label="Birthday" aria-invalid />);

    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });

  it('announces the clear', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(liveRegion()).toHaveTextContent('Date cleared');
  });

  it('carries the hint that stopping early is allowed', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await openPanel(user);

    expect(screen.getByText(/a year on its own is a complete answer/)).toBeInTheDocument();
  });
});

describe('PartialDatePicker: controlled and uncontrolled', () => {
  it('works uncontrolled from a defaultValue, normalizing it', () => {
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-5" />);

    expect(field()).toHaveValue('1968-05');
  });

  it('follows the value prop, and does not move when a controlled parent ignores the change', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<PartialDatePicker aria-label="Birthday" value="1968" onValueChange={onValueChange} />);

    await openPanel(user);
    await user.click(cell('1970'));

    expect(onValueChange).toHaveBeenCalledWith('1970');
    // The parent ignored it, so the field must still say what the parent says.
    expect(field()).toHaveValue('1968');
  });

  it('updates when the controlled parent does accept the change', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<string | undefined>('1968');
      return <PartialDatePicker aria-label="Birthday" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);

    await openPanel(user);
    await user.click(cell('1970'));

    expect(field()).toHaveValue('1970');
  });

  it('does not clobber a lenient draft when a controlled parent echoes the value back', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<string | undefined>();
      return <PartialDatePicker aria-label="Birthday" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);

    await user.type(field(), '1968-5');

    // The parent now holds '1968-05', but the draft the user is mid-way through typing stands.
    expect(field()).toHaveValue('1968-5');
  });

  it('stays controlled when the parent mounts it empty, which is the ordinary case here', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    // A birthday nobody knows starts as `value={undefined}`. Reading controlledness off the
    // VALUE rather than off the prop being passed would call this uncontrolled and then fight
    // the parent forever.
    render(
      <PartialDatePicker aria-label="Birthday" value={undefined} onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(cell(String(new Date().getFullYear())));

    expect(onValueChange).toHaveBeenCalled();
    expect(field()).toHaveValue('');
  });

  it('remembers an uncontrolled selection well enough to reopen on it', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());

    await openPanel(user);

    const selected = screen
      .getAllByRole('gridcell')
      .filter((td) => td.getAttribute('aria-selected') === 'true');
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent('1970');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('does not wipe an unreadable draft when its own undefined comes back', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [value, setValue] = useState<string | undefined>('1968');
      return <PartialDatePicker aria-label="Birthday" value={value} onValueChange={setValue} />;
    }
    render(<Controlled />);

    await user.clear(field());
    await user.type(field(), 'someti');

    expect(field()).toHaveValue('someti');
  });
});

describe('PartialDatePicker: the rest of the contract', () => {
  it('is inert when disabled and does not open', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" disabled />);

    expect(field()).toBeDisabled();
    expect(openButton()).toBeDisabled();

    await user.click(openButton());
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
  });

  it('can still be closed if it becomes disabled while open', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" />);

    await openPanel(user);
    rerender(<PartialDatePicker aria-label="Birthday" defaultValue="1968" disabled />);
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
  });

  it('clears the value and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onValueChange).toHaveBeenLastCalledWith(undefined);
    expect(field()).toHaveValue('');
    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
  });

  it('offers no Clear when there is nothing to clear', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" />);

    await openPanel(user);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('offers no Clear when the caller turned it off', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968" clearable={false} />);

    await openPanel(user);

    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
  });

  it('closes on Done, keeping whatever precision was reached', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <PartialDatePicker aria-label="Birthday" defaultValue="1968" onValueChange={onValueChange} />,
    );

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(() => expect(screen.queryByRole('grid')).not.toBeInTheDocument());
    expect(onValueChange).toHaveBeenLastCalledWith('1970');
    expect(field()).toHaveValue('1970');
  });

  it('merges a caller className onto the field frame, caller winning', () => {
    const { container } = render(
      <PartialDatePicker aria-label="Birthday" className="w-64 rounded-none" />,
    );
    const frame = container.querySelector('div[class*="border-border"]');

    expect(frame).toHaveClass('w-64', 'rounded-none');
    expect(frame).not.toHaveClass('rounded-md');
  });

  it('forwards the ref to the input, so a caller can focus the field', () => {
    const ref = createRef<HTMLInputElement>();
    render(<PartialDatePicker aria-label="Birthday" ref={ref} />);

    expect(ref.current).toBe(field());
    ref.current?.focus();
    expect(field()).toHaveFocus();
  });

  it('associates a label through a caller id', () => {
    render(
      <>
        <label htmlFor="birthday">Birthday</label>
        <PartialDatePicker id="birthday" />
      </>,
    );

    expect(screen.getByLabelText('Birthday')).toBe(field());
  });

  it('overrides every user-facing string', async () => {
    const user = userEvent.setup();
    render(
      <PartialDatePicker
        aria-label="Birthday"
        defaultValue="1968"
        locale="en-GB"
        placeholder="When?"
        openLabel="Open the picker"
        previousLabel="Back"
        nextLabel="Forward"
        zoomOutLabel="widen"
        clearLabel="Forget it"
        doneLabel="That will do"
        hint="Stop wherever you like."
        clearedLabel="Forgotten"
        precisionLabels={{ year: 'just the year' }}
      />,
    );

    expect(field()).toHaveAttribute('placeholder', 'When?');
    await user.click(screen.getByRole('button', { name: 'Open the picker' }));

    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forward' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'That will do' })).toBeInTheDocument();
    expect(screen.getByText('Stop wherever you like.')).toBeInTheDocument();

    // precisionLabels is the only MERGED prop, so a caller's partial override must win on the key
    // it names and fall back on the ones it does not.
    await user.click(cell('1970'));
    expect(liveRegion()).toHaveTextContent('1970, just the year');
    await user.click(cell('May'));
    expect(liveRegion()).toHaveTextContent('May 1970, month and year');

    await user.click(screen.getByRole('button', { name: /^May 1970/ }));
    await user.click(screen.getByRole('button', { name: /^1970/ }));
    await user.click(screen.getByRole('button', { name: 'Forget it' }));
    expect(liveRegion()).toHaveTextContent('Forgotten');
  });

  it('names the zoom-out affordance without running two sentences together', async () => {
    const user = userEvent.setup();
    render(<PartialDatePicker aria-label="Birthday" defaultValue="1968-05" />);

    await openPanel(user);

    // The comma matters: without it the name runs "1968 Choose a broader period" together.
    expect(screen.getByRole('button', { name: /^1968/ })).toHaveAccessibleName(
      /^1968\s*,\s*Choose a broader period$/,
    );
  });

  it('survives a StrictMode remount and still picks a date', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <StrictMode>
        <PartialDatePicker
          aria-label="Birthday"
          defaultValue="1968"
          onValueChange={onValueChange}
        />
      </StrictMode>,
    );

    await openPanel(user);
    await user.click(cell('1970'));
    await user.click(cell('May'));

    expect(onValueChange).toHaveBeenLastCalledWith('1970-05');
    expect(field()).toHaveValue('1970-05');
  });
});
