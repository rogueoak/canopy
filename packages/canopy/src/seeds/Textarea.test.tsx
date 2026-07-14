import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a native textarea', () => {
    render(<Textarea aria-label="Field" />);
    const textarea = screen.getByRole('textbox', { name: 'Field' });
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('applies the base token classes', () => {
    render(<Textarea aria-label="Field" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(
      'border',
      'border-border',
      'bg-surface',
      'text-text',
      'rounded-md',
      'min-h-20',
      'resize-y',
    );
  });

  it('renders at 16px on mobile and 14px from md up (iOS anti-zoom, feedback 0017)', () => {
    render(<Textarea aria-label="Field" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('text-base', 'md:text-sm');
    expect(textarea).not.toHaveClass('text-sm');
  });

  it('typing updates the value', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Field" />);
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
    await user.type(textarea, 'maple');
    expect(textarea.value).toBe('maple');
  });

  it('fires onChange for each keystroke (controlled path)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Textarea aria-label="Field" onChange={onChange} />);
    await user.type(screen.getByRole('textbox'), 'oak');
    expect(onChange).toHaveBeenCalledTimes(3);
  });

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Field" disabled />);
    const textarea = screen.getByRole<HTMLTextAreaElement>('textbox');
    expect(textarea).toBeDisabled();
    await user.type(textarea, 'maple');
    expect(textarea.value).toBe('');
    expect(textarea).toHaveClass('disabled:bg-disabled', 'disabled:text-disabled-foreground');
  });

  it('applies the danger classes when aria-invalid is set', () => {
    render(<Textarea aria-label="Field" aria-invalid />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('aria-invalid', 'true');
    expect(textarea).toHaveClass('aria-invalid:border-danger', 'aria-invalid:ring-danger');
  });

  it('includes the focus-visible ring (a11y)', () => {
    render(<Textarea aria-label="Field" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('spreads native props (rows, placeholder, name)', () => {
    render(<Textarea aria-label="Bio" rows={6} placeholder="Tell us…" name="bio" />);
    const textarea = screen.getByRole('textbox', { name: 'Bio' });
    expect(textarea).toHaveAttribute('rows', '6');
    expect(textarea).toHaveAttribute('placeholder', 'Tell us…');
    expect(textarea).toHaveAttribute('name', 'bio');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Textarea aria-label="Field" className="px-10" />);
    const textarea = screen.getByRole('textbox');
    // tailwind-merge drops the default px-3 in favour of the caller's px-10
    expect(textarea).toHaveClass('px-10');
    expect(textarea).not.toHaveClass('px-3');
  });

  it('forwards a ref to the underlying textarea', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<Textarea aria-label="Field" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
