import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './Switch';

describe('Switch', () => {
  it('renders with the switch role and starts unchecked (aria-checked=false)', () => {
    render(<Switch aria-label="Notifications" />);
    const sw = screen.getByRole('switch', { name: 'Notifications' });
    expect(sw).toBeInTheDocument();
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('honours defaultChecked (uncontrolled on)', () => {
    render(<Switch defaultChecked aria-label="Notifications" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles on click (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles via the keyboard (focus + Space)', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Notifications" />);
    const sw = screen.getByRole('switch');
    await user.tab();
    expect(sw).toHaveFocus();
    await user.keyboard(' ');
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('fires onCheckedChange with the next value (controlled path)', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} aria-label="Notifications" />);
    const sw = screen.getByRole('switch');
    await user.click(sw);
    expect(onCheckedChange).toHaveBeenCalledTimes(1);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // Controlled: stays off until the parent updates `checked`.
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects a controlled checked prop', () => {
    render(<Switch checked onCheckedChange={() => {}} aria-label="Notifications" />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch disabled onCheckedChange={onCheckedChange} aria-label="Notifications" />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    await user.click(sw);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('includes the focus-visible ring (a11y)', () => {
    render(<Switch aria-label="Notifications" />);
    expect(screen.getByRole('switch')).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('applies the track token classes (border off → primary on)', () => {
    render(<Switch aria-label="Notifications" />);
    expect(screen.getByRole('switch')).toHaveClass(
      'bg-border',
      'data-[state=checked]:bg-primary',
      'rounded-full',
    );
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Switch aria-label="Notifications" className="bg-muted" />);
    const sw = screen.getByRole('switch');
    // tailwind-merge lets the caller win the background conflict.
    expect(sw).toHaveClass('bg-muted');
    expect(sw).not.toHaveClass('bg-border');
  });

  it('pairs with a label via htmlFor → id (accessible name)', () => {
    render(
      <>
        <label htmlFor="wifi">Wi-Fi</label>
        <Switch id="wifi" />
      </>,
    );
    expect(screen.getByRole('switch', { name: 'Wi-Fi' })).toBeInTheDocument();
  });

  it('spreads native props (id) onto the control', () => {
    render(<Switch id="dnd" aria-label="Do not disturb" />);
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'dnd');
  });

  it('forwards a ref to the underlying control', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Switch ref={ref} aria-label="Notifications" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute('role', 'switch');
  });
});
