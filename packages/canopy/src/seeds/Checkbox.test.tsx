import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('renders with role checkbox and the base token classes', () => {
    render(<Checkbox aria-label="Accept" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept' });
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveClass('h-5', 'w-5', 'rounded-sm', 'border-border-strong', 'bg-surface');
  });

  it('defaults to unchecked and toggles on click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Checkbox aria-label="Accept" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('respects a controlled checked value and fires onCheckedChange', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Accept" checked={false} onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');
    // Controlled: stays false until the parent flips it, but the change handler fires.
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    await user.click(checkbox);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects a controlled checked=true value', () => {
    render(<Checkbox aria-label="Accept" checked onCheckedChange={() => {}} />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('renders the indeterminate (mixed) state', () => {
    render(<Checkbox aria-label="Accept" checked="indeterminate" onCheckedChange={() => {}} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
    // The fill swaps to the primary ramp for indeterminate as well as checked.
    expect(checkbox).toHaveClass(
      'data-[state=indeterminate]:bg-primary',
      'data-[state=indeterminate]:border-primary',
    );
    // The DASH icon (not the check) is the one wired to show for indeterminate — pin the
    // swap so a crossed icon (dash wired to checked) is caught, not just the shared fill.
    const icons = Array.from(checkbox.querySelectorAll('svg'));
    const dPath = (el: Element) => el.querySelector('path')?.getAttribute('d');
    const dash = icons.find((s) => dPath(s) === 'M5 12h14');
    const check = icons.find((s) => dPath(s) === 'M20 6 9 17l-5-5');
    expect(dash).toHaveClass('group-data-[state=indeterminate]:block');
    expect(check).toHaveClass('group-data-[state=checked]:block');
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Checkbox aria-label="Accept" disabled onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    await user.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    expect(checkbox).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('includes the focus-visible ring (a11y)', () => {
    render(<Checkbox aria-label="Accept" />);
    expect(screen.getByRole('checkbox')).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Checkbox aria-label="Accept" className="rounded-full" />);
    const checkbox = screen.getByRole('checkbox');
    // tailwind-merge drops the default rounded-sm in favour of the caller's rounded-full
    expect(checkbox).toHaveClass('rounded-full');
    expect(checkbox).not.toHaveClass('rounded-sm');
  });

  it('spreads native props (id, name)', () => {
    render(<Checkbox aria-label="Accept" id="terms" name="terms" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'terms');
  });

  it('forwards a ref to the underlying control', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Checkbox aria-label="Accept" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });
});
