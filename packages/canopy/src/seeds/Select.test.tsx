import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';

// Radix Select drives its open/close on Pointer Events and scrolls the active item into view.
// jsdom implements neither, so without these stubs `user.click` on the trigger throws (no
// `hasPointerCapture`) and opening the listbox throws (no `scrollIntoView`). Stubbing them lets
// the real Radix interaction run under jsdom; this is the standard Radix-in-jsdom workaround.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function Basic({
  onValueChange,
  disabled = false,
}: {
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label="Fruit">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectItem value="grape">Grape</SelectItem>
      </SelectContent>
    </Select>
  );
}

describe('Select', () => {
  it('renders a trigger with role combobox showing the placeholder', () => {
    render(<Basic />);
    const trigger = screen.getByRole('combobox', { name: 'Fruit' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Pick a fruit');
  });

  it('carries the Input-parity field token classes on the trigger', () => {
    render(<Basic />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('border-border', 'bg-surface', 'text-text', 'rounded-md', 'h-10');
  });

  it('opens the listbox and shows the options on click', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Grape' })).toBeInTheDocument();
  });

  it('selecting an item updates the value and fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox');
    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Banana' }));
    expect(onValueChange).toHaveBeenCalledWith('banana');
    expect(trigger).toHaveTextContent('Banana');
  });

  it('opens and selects via the keyboard (open + arrow/typeahead + enter)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Basic onValueChange={onValueChange} />);
    const trigger = screen.getByRole('combobox');
    trigger.focus();
    // Space opens the listbox; type-ahead jumps to "Grape"; Enter commits it.
    await user.keyboard('{ }');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await user.keyboard('grape{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('grape');
    expect(trigger).toHaveTextContent('Grape');
  });

  it('does not open when disabled', async () => {
    const user = userEvent.setup();
    render(<Basic disabled />);
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
    await user.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('applies the danger classes when the trigger is aria-invalid', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Fruit" aria-invalid>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });

  it('merges a caller className over the trigger defaults (cn / tailwind-merge)', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Fruit" className="px-10">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger).toHaveClass('px-10');
    expect(trigger).not.toHaveClass('px-3');
  });

  it('forwards a ref to the underlying trigger element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Select>
        <SelectTrigger aria-label="Fruit" ref={ref}>
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
        </SelectContent>
      </Select>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute('role', 'combobox');
  });
});
