import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Toggle, toggleVariants } from './Toggle';

describe('Toggle', () => {
  it('renders a real button with aria-pressed, starting off', () => {
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button', { name: 'Bold' });
    expect(toggle).toBeInstanceOf(HTMLButtonElement);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('toggles the pressed state on click and flips data-state (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-state', 'off');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('honours defaultPressed (uncontrolled on)', () => {
    render(<Toggle defaultPressed aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('reflects a controlled pressed prop and fires onPressedChange with the next value', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle pressed={false} onPressedChange={onPressedChange} aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    await user.click(toggle);
    expect(onPressedChange).toHaveBeenCalledTimes(1);
    expect(onPressedChange).toHaveBeenCalledWith(true);
    // Controlled: stays off until the parent updates `pressed`.
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('reflects a controlled pressed=true prop', () => {
    render(<Toggle pressed onPressedChange={() => {}} aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles via the keyboard (Tab reaches it, Space toggles)', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles via the keyboard (Enter)', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not toggle when disabled (inert)', async () => {
    const user = userEvent.setup();
    const onPressedChange = vi.fn();
    render(<Toggle disabled onPressedChange={onPressedChange} aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onPressedChange).not.toHaveBeenCalled();
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('applies the default variant on-state fill tokens (bg-accent)', () => {
    render(<Toggle aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass(
      'bg-transparent',
      'hover:bg-muted',
      'data-[state=on]:bg-accent',
      'data-[state=on]:text-accent-foreground',
    );
  });

  it('applies the outline variant border + on-state fill tokens (bg-muted)', () => {
    render(<Toggle variant="outline" aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass(
      'border',
      'border-border',
      'bg-surface',
      'data-[state=on]:bg-muted',
      'data-[state=on]:border-border-strong',
    );
  });

  it('renders each size with its own height + type-scale token (lg steps up like Button)', () => {
    const { rerender } = render(<Toggle size="sm" aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveClass('h-8', 'text-sm');
    rerender(<Toggle size="md" aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'text-sm');
    rerender(<Toggle size="lg" aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveClass('h-12', 'text-base');
  });

  it('includes the focus-visible ring (a11y)', () => {
    render(<Toggle aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('merges a caller className over the defaults (cn / tailwind-merge, caller wins)', () => {
    render(<Toggle className="bg-primary" aria-label="Bold" />);
    const toggle = screen.getByRole('button');
    // tailwind-merge lets the caller win the background conflict.
    expect(toggle).toHaveClass('bg-primary');
    expect(toggle).not.toHaveClass('bg-transparent');
  });

  it('spreads native props (id) onto the control', () => {
    render(<Toggle id="bold" aria-label="Bold" />);
    expect(screen.getByRole('button')).toHaveAttribute('id', 'bold');
  });

  it('renders icon/text children', () => {
    render(<Toggle aria-label="Bold">B</Toggle>);
    expect(screen.getByRole('button', { name: 'Bold' })).toHaveTextContent('B');
  });

  it('forwards a ref to the underlying button', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Toggle ref={ref} aria-label="Bold" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    expect(ref.current).toHaveAttribute('aria-pressed', 'false');
  });

  describe('toggleVariants (own cva recipe - boundary cases)', () => {
    it('defaults to the default variant + md size when neither is supplied', () => {
      const cls = toggleVariants();
      expect(cls).toContain('data-[state=on]:bg-accent');
      expect(cls).toContain('h-10');
    });

    it('emits the outline border classes only for the outline variant', () => {
      expect(toggleVariants({ variant: 'outline' })).toContain('border-border');
      expect(toggleVariants({ variant: 'default' })).not.toContain('border-border');
    });

    it('maps each size to a distinct, single height utility', () => {
      expect(toggleVariants({ size: 'sm' })).toContain('h-8');
      expect(toggleVariants({ size: 'md' })).toContain('h-10');
      expect(toggleVariants({ size: 'lg' })).toContain('h-12');
    });

    it('always includes the shared base (focus ring + disabled treatment)', () => {
      const cls = toggleVariants({ variant: 'outline', size: 'lg' });
      expect(cls).toContain('focus-visible:ring-ring');
      expect(cls).toContain('disabled:opacity-50');
      expect(cls).toContain('disabled:pointer-events-none');
    });
  });
});
