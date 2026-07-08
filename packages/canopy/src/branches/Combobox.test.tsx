import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Combobox, type ComboboxOption } from './Combobox';

// Radix Popover drives open/close on Pointer Events and positions its content with a
// ResizeObserver; cmdk scrolls the active item into view. jsdom implements none of these, so
// without these stubs `user.click` on the trigger throws (no `hasPointerCapture`), opening the
// popover throws (no `ResizeObserver`), and keyboard nav throws (no `scrollIntoView`). Stubbing
// them lets the real Radix + cmdk interaction run under jsdom - the standard workaround.
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

const FRUITS: ComboboxOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Grape', value: 'grape' },
];

describe('Combobox (single)', () => {
  it('renders a trigger showing the placeholder', () => {
    render(<Combobox options={FRUITS} placeholder="Pick a fruit" aria-label="Fruit" />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveTextContent('Pick a fruit');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('carries the Input-parity field token classes on the trigger', () => {
    render(<Combobox options={FRUITS} aria-label="Fruit" />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveClass('border-border', 'bg-surface', 'text-text', 'rounded-md', 'h-10');
  });

  it('opens the listbox with the options and combobox role on click', async () => {
    const user = userEvent.setup();
    render(<Combobox options={FRUITS} aria-label="Fruit" />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    await user.click(trigger);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Grape' })).toBeInTheDocument();
  });

  it('filters the list as the user types', async () => {
    const user = userEvent.setup();
    render(<Combobox options={FRUITS} aria-label="Fruit" />);
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    await user.type(await screen.findByRole('combobox'), 'ban');
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Combobox options={FRUITS} aria-label="Fruit" emptyMessage="Nothing here" />);
    await user.click(screen.getByRole('button', { name: 'Fruit' }));
    await user.type(await screen.findByRole('combobox'), 'zzz');
    expect(await screen.findByText('Nothing here')).toBeInTheDocument();
  });

  it('selecting an option sets the label, fires onValueChange, and closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={FRUITS} aria-label="Fruit" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(trigger).toHaveTextContent('Banana');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Combobox options={FRUITS} aria-label="Fruit" disabled />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('applies the danger classes when aria-invalid', () => {
    render(<Combobox options={FRUITS} aria-label="Fruit" aria-invalid />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });

  it('merges a caller className over the trigger defaults (cn / tailwind-merge)', () => {
    render(<Combobox options={FRUITS} aria-label="Fruit" className="px-10" />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveClass('px-10');
    expect(trigger).not.toHaveClass('px-3');
  });

  it('forwards a ref to the trigger element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Combobox options={FRUITS} aria-label="Fruit" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});

describe('Combobox (multiple)', () => {
  it('marks the listbox aria-multiselectable', async () => {
    const user = userEvent.setup();
    render(<Combobox multiple options={FRUITS} aria-label="Fruits" />);
    await user.click(screen.getByRole('button', { name: 'Fruits' }));
    expect(await screen.findByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('picking options adds Badge chips, fires the array, and keeps the popover open', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox multiple options={FRUITS} aria-label="Fruits" onValueChange={onValueChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruits' }));
    const apple = await screen.findByRole('option', { name: 'Apple' });
    await user.click(apple);
    expect(onValueChange).toHaveBeenLastCalledWith(['apple']);
    // Popover stays open across picks.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    // A removable chip appears in the field.
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument();
    // The selected option renders a leading check glyph.
    expect(apple.querySelector('svg')).not.toBeNull();

    await user.click(await screen.findByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['apple', 'banana']);
  });

  it('re-picking a selected option de-selects it and removes the chip', async () => {
    const user = userEvent.setup();
    render(<Combobox multiple options={FRUITS} defaultValue={['apple']} aria-label="Fruits" />);
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fruits' }));
    await user.click(await screen.findByRole('option', { name: 'Apple' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove Apple' })).not.toBeInTheDocument();
    });
  });

  it('the chip remove button removes just that chip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        multiple
        options={FRUITS}
        defaultValue={['apple', 'banana']}
        aria-label="Fruits"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Apple' }));
    expect(onValueChange).toHaveBeenLastCalledWith(['banana']);
    expect(screen.queryByRole('button', { name: 'Remove Apple' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Banana' })).toBeInTheDocument();
  });

  it('Backspace in the empty search input removes the last chip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        multiple
        options={FRUITS}
        defaultValue={['apple', 'banana']}
        aria-label="Fruits"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruits' }));
    const input = await screen.findByRole('combobox');
    input.focus();
    await user.keyboard('{Backspace}');
    expect(onValueChange).toHaveBeenLastCalledWith(['apple']);
  });

  it('Backspace with a non-empty search does not remove a chip', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        multiple
        options={FRUITS}
        defaultValue={['apple', 'banana']}
        aria-label="Fruits"
        onValueChange={onValueChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Fruits' }));
    const input = await screen.findByRole('combobox');
    await user.type(input, 'gr');
    // Backspace here edits the search text (only the empty-search branch drops a chip).
    await user.keyboard('{Backspace}');
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Banana' })).toBeInTheDocument();
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Combobox multiple options={FRUITS} aria-label="Fruits" disabled />);
    const trigger = screen.getByRole('button', { name: 'Fruits' });
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('applies the danger classes to the field when aria-invalid', () => {
    const { container } = render(
      <Combobox multiple options={FRUITS} aria-label="Fruits" aria-invalid />,
    );
    const field = container.querySelector('[aria-invalid="true"]');
    expect(field).not.toBeNull();
    expect(field).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });
});

describe('Combobox (keyboard)', () => {
  it('opens, ArrowDown + Enter commits the active option, Escape closes', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Combobox options={FRUITS} aria-label="Fruit" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Fruit' });

    await user.click(trigger);
    const input = await screen.findByRole('combobox');
    input.focus();
    // cmdk makes the first item active on open; ArrowDown moves to the second, Enter commits it.
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(trigger).toHaveTextContent('Banana');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // Escape closes the popover without committing a new value.
    await user.click(trigger);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
});

describe('Combobox (controlled)', () => {
  it('single: the trigger label is driven by the value prop, not internal state', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Combobox
        options={FRUITS}
        aria-label="Fruit"
        placeholder="Pick"
        value="apple"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveTextContent('Apple');

    // Picking a new option fires the callback but does NOT change the display until the parent
    // updates `value` (controlled contract).
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Grape' }));
    expect(onValueChange).toHaveBeenCalledWith('grape');
    expect(trigger).toHaveTextContent('Apple');

    // Parent updates `value` -> the display follows.
    rerender(
      <Combobox
        options={FRUITS}
        aria-label="Fruit"
        placeholder="Pick"
        value="grape"
        onValueChange={onValueChange}
      />,
    );
    expect(trigger).toHaveTextContent('Grape');
  });

  it('single: controlledness is latched when value later becomes undefined', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Combobox
        options={FRUITS}
        aria-label="Fruit"
        placeholder="Pick"
        value="apple"
        onValueChange={onValueChange}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Fruit' });
    expect(trigger).toHaveTextContent('Apple');

    // Controlled parent clears the selection (value -> undefined). Still controlled: the display
    // reflects the (now empty) value prop, not any internal state.
    rerender(
      <Combobox
        options={FRUITS}
        aria-label="Fruit"
        placeholder="Pick"
        value={undefined}
        onValueChange={onValueChange}
      />,
    );
    expect(trigger).toHaveTextContent('Pick');

    // Picking still only fires the callback; the display stays put (would show "Banana" if the
    // component had wrongly fallen back to uncontrolled internal state).
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(trigger).toHaveTextContent('Pick');
  });

  it('multiple: chips are driven by the value prop', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Combobox
        multiple
        options={FRUITS}
        aria-label="Fruits"
        value={['apple']}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove Apple' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Grape' })).not.toBeInTheDocument();

    rerender(
      <Combobox
        multiple
        options={FRUITS}
        aria-label="Fruits"
        value={['apple', 'grape']}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole('button', { name: 'Remove Grape' })).toBeInTheDocument();
  });
});
