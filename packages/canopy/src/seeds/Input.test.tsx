import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Input } from './Input';

describe('Input', () => {
  it('renders a native text input', () => {
    render(<Input aria-label="Field" />);
    const input = screen.getByRole('textbox', { name: 'Field' });
    expect(input.tagName).toBe('INPUT');
    // type defaults to 'text'
    expect(input).toHaveAttribute('type', 'text');
  });

  it('applies the default size classes (md) plus the base token classes', () => {
    render(<Input aria-label="Field" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-10');
    expect(input).toHaveClass('border', 'border-border', 'bg-surface', 'text-text', 'rounded-md');
  });

  it('typing updates the value', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Field" />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    await user.type(input, 'maple');
    expect(input.value).toBe('maple');
  });

  it('fires onChange for each keystroke (controlled path)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input aria-label="Field" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'oak');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Field" disabled />);
    const input = screen.getByRole<HTMLInputElement>('textbox');
    expect(input).toBeDisabled();
    await user.type(input, 'maple');
    expect(input.value).toBe('');
    expect(input).toHaveClass('disabled:bg-disabled', 'disabled:text-disabled-foreground');
  });

  it('applies the danger classes when aria-invalid is set', () => {
    render(<Input aria-label="Field" aria-invalid />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });

  it('includes the focus-visible ring (a11y)', () => {
    render(<Input aria-label="Field" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ] as const)('maps the %s size to %s', (size, expected) => {
    render(<Input aria-label="Field" size={size} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(expected);
  });

  it('the sm size does not carry the md height', () => {
    render(<Input aria-label="Field" size="sm" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-8');
    expect(input).not.toHaveClass('h-10');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Input aria-label="Field" className="px-10" />);
    const input = screen.getByRole('textbox');
    // tailwind-merge drops the default px-3 in favour of the caller's px-10
    expect(input).toHaveClass('px-10');
    expect(input).not.toHaveClass('px-3');
  });

  it('spreads native props (type, placeholder, name)', () => {
    render(<Input aria-label="Email" type="email" placeholder="you@oak" name="email" />);
    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveAttribute('placeholder', 'you@oak');
    expect(input).toHaveAttribute('name', 'email');
  });

  it('forwards a ref to the underlying input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input aria-label="Field" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
