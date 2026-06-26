import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup, RadioGroupItem } from './RadioGroup';

/** A small reusable 3-option group; `groupProps` spreads onto the root (e.g. disabled, value). */
function Fixture({ onValueChange, ...groupProps }: React.ComponentProps<typeof RadioGroup>) {
  return (
    <RadioGroup aria-label="Plan" onValueChange={onValueChange} {...groupProps}>
      <RadioGroupItem value="seed" aria-label="Seed" />
      <RadioGroupItem value="sprout" aria-label="Sprout" />
      <RadioGroupItem value="tree" aria-label="Tree" />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('renders a radiogroup with one radio per item', () => {
    render(<Fixture />);
    expect(screen.getByRole('radiogroup', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('applies the container + item base token classes', () => {
    render(<Fixture />);
    expect(screen.getByRole('radiogroup')).toHaveClass('grid', 'gap-2');
    const [first] = screen.getAllByRole('radio');
    expect(first).toHaveClass('h-5', 'w-5', 'rounded-full', 'border-border-strong', 'bg-surface');
  });

  it('clicking an item selects it and fires onValueChange', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    const sprout = screen.getByRole('radio', { name: 'Sprout' });
    await user.click(sprout);
    expect(onValueChange).toHaveBeenCalledWith('sprout');
    expect(sprout).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Seed' })).not.toBeChecked();
  });

  it('roves focus with the arrow keys and selects the focused item from the keyboard', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture onValueChange={onValueChange} />);
    const seed = screen.getByRole('radio', { name: 'Seed' });
    const sprout = screen.getByRole('radio', { name: 'Sprout' });
    const tree = screen.getByRole('radio', { name: 'Tree' });

    // Tab moves into the group, landing on the first item (roving tabindex: only one item is
    // tabbable at a time).
    await user.tab();
    expect(seed).toHaveFocus();
    expect(seed).toHaveAttribute('tabindex', '0');
    expect(sprout).toHaveAttribute('tabindex', '-1');

    // ArrowDown rolls focus to the next item; ArrowUp rolls it back — the Radix roving model.
    // NOTE: WAI-ARIA also has arrow keys *select* (fire onValueChange) the focused radio. Radix
    // does this via a document-level keydown listener that, under jsdom's bubble-phase ordering,
    // runs after RovingFocus has already moved focus — so arrow-auto-select can't be asserted
    // here. It works in a real browser; cover that contract in a future Storybook play/e2e layer.
    await user.keyboard('{ArrowDown}');
    expect(sprout).toHaveFocus();
    expect(sprout).toHaveAttribute('tabindex', '0');
    expect(seed).toHaveAttribute('tabindex', '-1');

    await user.keyboard('{ArrowDown}');
    expect(tree).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(sprout).toHaveFocus();

    // Activating the focused item with the keyboard selects it.
    await user.keyboard(' ');
    expect(sprout).toBeChecked();
    expect(seed).not.toBeChecked();
    expect(onValueChange).toHaveBeenLastCalledWith('sprout');
  });

  it('does not select a disabled item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <RadioGroup aria-label="Plan" onValueChange={onValueChange}>
        <RadioGroupItem value="seed" aria-label="Seed" />
        <RadioGroupItem value="sprout" aria-label="Sprout" disabled />
      </RadioGroup>,
    );
    const sprout = screen.getByRole('radio', { name: 'Sprout' });
    expect(sprout).toBeDisabled();
    expect(sprout).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    await user.click(sprout);
    expect(sprout).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('a fully disabled group selects no item on click', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<Fixture disabled onValueChange={onValueChange} />);
    const [first] = screen.getAllByRole('radio');
    expect(first).toBeDisabled();
    await user.click(first);
    expect(first).not.toBeChecked();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('carries the focus-visible ring (a11y)', () => {
    render(<Fixture />);
    const [first] = screen.getAllByRole('radio');
    expect(first).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('selected item reflects aria-checked and the checked-state border class', () => {
    render(
      <RadioGroup aria-label="Plan" defaultValue="tree">
        <RadioGroupItem value="seed" aria-label="Seed" />
        <RadioGroupItem value="tree" aria-label="Tree" />
      </RadioGroup>,
    );
    const tree = screen.getByRole('radio', { name: 'Tree' });
    expect(tree).toHaveAttribute('aria-checked', 'true');
    expect(tree).toHaveClass('data-[state=checked]:border-primary');
    expect(screen.getByRole('radio', { name: 'Seed' })).toHaveAttribute('aria-checked', 'false');
  });

  it('merges a caller className over the item defaults (cn / tailwind-merge)', () => {
    render(
      <RadioGroup aria-label="Plan">
        <RadioGroupItem value="seed" aria-label="Seed" className="h-8 w-8" />
      </RadioGroup>,
    );
    const seed = screen.getByRole('radio', { name: 'Seed' });
    expect(seed).toHaveClass('h-8', 'w-8');
    expect(seed).not.toHaveClass('h-5', 'w-5');
  });

  it('forwards refs to the root and an item', () => {
    const rootRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLButtonElement>();
    render(
      <RadioGroup aria-label="Plan" ref={rootRef}>
        <RadioGroupItem value="seed" aria-label="Seed" ref={itemRef} />
      </RadioGroup>,
    );
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLButtonElement);
  });
});
