import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Label } from './Label';

describe('Label', () => {
  it('renders its text inside a native label element', () => {
    render(<Label>Email</Label>);
    const label = screen.getByText('Email');
    expect(label.tagName).toBe('LABEL');
  });

  it('applies the semantic label-role token classes', () => {
    render(<Label>Email</Label>);
    // text-label carries its own (medium) weight - no separate font-medium.
    expect(screen.getByText('Email')).toHaveClass('text-label', 'text-text');
  });

  it('associates with a control via htmlFor (clicking focuses it)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Label htmlFor="email">Email</Label>
        <input id="email" />
      </>,
    );
    // getByLabelText proves the association is wired through htmlFor → id.
    const input = screen.getByLabelText('Email');
    expect(input).toBe(screen.getByRole('textbox'));
    expect(input).not.toHaveFocus();

    // Radix Label forwards a click on the label to focus the paired control.
    await user.click(screen.getByText('Email'));
    expect(input).toHaveFocus();
  });

  it('renders the required indicator without breaking the accessible name', () => {
    render(
      <>
        <Label htmlFor="pwd" required>
          Password
        </Label>
        <input id="pwd" />
      </>,
    );
    // The visual asterisk is present...
    expect(screen.getByText('*', { exact: false })).toBeInTheDocument();
    // ...but it is aria-hidden, so the control's accessible name stays clean.
    expect(screen.getByRole('textbox')).toHaveAccessibleName('Password');
  });

  it('does NOT render the indicator when not required', () => {
    render(<Label>Plain</Label>);
    expect(screen.queryByText('*', { exact: false })).toBeNull();
  });

  it('merges a caller className over the defaults (cn / tailwind-merge)', () => {
    render(<Label className="text-danger">Override</Label>);
    const label = screen.getByText('Override');
    // tailwind-merge lets the caller win the text-COLOUR conflict...
    expect(label).toHaveClass('text-danger');
    expect(label).not.toHaveClass('text-text');
    // ...while the typography ROLE survives - proving the cn() font-size-group fix keeps the
    // role and the colour orthogonal (without it, text-label would be dropped here).
    expect(label).toHaveClass('text-label');
  });

  it('forwards a ref to the underlying label element', () => {
    const ref = createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Ref</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });
});
