import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from './InputGroup';

describe('InputGroup', () => {
  it('renders the bordered group with its inner input', () => {
    render(
      <InputGroup data-testid="group">
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    expect(screen.getByTestId('group')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Amount' })).toBeInTheDocument();
  });

  it('renders leading and trailing addons in the correct order via align', () => {
    render(
      <InputGroup>
        <InputGroupAddon align="start">https://</InputGroupAddon>
        <InputGroupInput aria-label="URL" />
        <InputGroupAddon align="end">.com</InputGroupAddon>
      </InputGroup>,
    );
    const leading = screen.getByText('https://');
    const trailing = screen.getByText('.com');
    expect(leading).toHaveAttribute('data-align', 'start');
    expect(trailing).toHaveAttribute('data-align', 'end');
    // Leading addon precedes the trailing addon in DOM order (flex reading order).
    expect(leading.compareDocumentPosition(trailing)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('defaults an addon to align="start"', () => {
    render(
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput aria-label="Price" />
      </InputGroup>,
    );
    expect(screen.getByText('$')).toHaveAttribute('data-align', 'start');
  });

  it('carries the group focus ring on the shell (focus-within) not the inner input', () => {
    render(
      <InputGroup data-testid="group">
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    expect(screen.getByTestId('group').className).toContain('focus-within:ring-2');
    // Inner input strips its own frame/ring so there is no double outline.
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input.className).toContain('border-0');
    expect(input.className).toContain('focus-visible:ring-0');
    expect(input.className).toContain('bg-transparent');
  });

  it('typing updates the input value', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup>
        <InputGroupInput aria-label="Amount" />
      </InputGroup>,
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });
    await user.type(input, '42');
    expect(input).toHaveValue('42');
  });

  it('supports a controlled inner input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <InputGroup>
        <InputGroupInput aria-label="Amount" value="locked" onChange={onChange} />
      </InputGroup>,
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });
    expect(input).toHaveValue('locked');
    await user.type(input, 'x');
    expect(onChange).toHaveBeenCalled();
    // Controlled: the field itself does not mutate without a state update.
    expect(input).toHaveValue('locked');
  });

  describe('disabled propagation', () => {
    it('makes the inner input genuinely inert when the group is disabled', () => {
      render(
        <InputGroup disabled>
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).toBeDisabled();
    });

    it('mutes addons when the group is disabled', () => {
      render(
        <InputGroup disabled>
          <InputGroupAddon>$</InputGroupAddon>
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByText('$').className).toContain('text-disabled-foreground');
    });

    it('disables the group button when the group is disabled', () => {
      render(
        <InputGroup disabled>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton>Go</InputGroupButton>
        </InputGroup>,
      );
      expect(screen.getByRole('button', { name: 'Go' })).toBeDisabled();
    });

    it('lets a part override the group disabled default', () => {
      render(
        <InputGroup disabled>
          <InputGroupInput aria-label="Amount" disabled={false} />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).not.toBeDisabled();
    });
  });

  describe('aria-invalid propagation', () => {
    it('propagates group aria-invalid to the inner input', () => {
      render(
        <InputGroup aria-invalid>
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    it('applies the danger override on the group when aria-invalid', () => {
      render(
        <InputGroup aria-invalid data-testid="group">
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByTestId('group').className).toContain('aria-invalid:border-danger');
      expect(screen.getByTestId('group')).toHaveAttribute('aria-invalid', 'true');
    });

    it('does not mark the input invalid when the group is valid', () => {
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).not.toHaveAttribute('aria-invalid');
    });

    // Boundary: aria-invalid="false" is the ONLY non-invalid string; it must NOT propagate as
    // invalid to the input (the normalize-it-ourselves guard so styling and the flag never disagree).
    it('treats aria-invalid="false" on the group as valid', () => {
      render(
        <InputGroup aria-invalid="false">
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).not.toHaveAttribute(
        'aria-invalid',
        'true',
      );
    });

    // Boundary: a non-boolean token like "grammar" is still an invalid state and must propagate -
    // AND the group frame must paint danger too. Tailwind's `aria-invalid:` variant only matches the
    // literal "true", so the group normalizes the attribute it spreads to a boolean "true" so the
    // visual (group frame) and the propagated flag (inner input) never disagree.
    it('treats a non-false aria-invalid token (grammar) as invalid on both input and group', () => {
      render(
        <InputGroup aria-invalid="grammar" data-testid="group">
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute('aria-invalid');
      // Normalized to the literal "true" so the group's aria-invalid: danger variant matches.
      expect(screen.getByTestId('group')).toHaveAttribute('aria-invalid', 'true');
    });

    it('lets a part override the group invalid default', () => {
      render(
        <InputGroup aria-invalid>
          <InputGroupInput aria-label="Amount" aria-invalid={false} />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveAttribute(
        'aria-invalid',
        'false',
      );
    });
  });

  describe('InputGroupButton', () => {
    it('is a real labelled button whose onClick fires', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton onClick={onClick}>Copy</InputGroupButton>
        </InputGroup>,
      );
      const button = screen.getByRole('button', { name: 'Copy' });
      await user.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('defaults to type="button" so it does not submit a surrounding form', () => {
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton>Go</InputGroupButton>
        </InputGroup>,
      );
      expect(screen.getByRole('button', { name: 'Go' })).toHaveAttribute('type', 'button');
    });

    // The group is overflow-hidden, so the base Button's OFFSET focus ring (drawn outside the box)
    // would be clipped at the group edge - a keyboard user tabbing to the button would see no focus
    // state. The button overrides to an inset ring with no offset so it renders inside the box.
    it('uses an inset focus ring so overflow-hidden does not clip it', () => {
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton>Go</InputGroupButton>
        </InputGroup>,
      );
      const button = screen.getByRole('button', { name: 'Go' });
      expect(button.className).toContain('focus-visible:ring-inset');
      expect(button.className).toContain('focus-visible:ring-offset-0');
    });
  });

  it('keeps the inner input accessible name', () => {
    render(
      <InputGroup>
        <InputGroupAddon>$</InputGroupAddon>
        <InputGroupInput aria-label="Price in dollars" />
      </InputGroup>,
    );
    expect(screen.getByRole('textbox', { name: 'Price in dollars' })).toBeInTheDocument();
  });

  describe('className merge (caller wins)', () => {
    it('merges on the group', () => {
      render(
        <InputGroup className="rounded-lg" data-testid="group">
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      const group = screen.getByTestId('group');
      expect(group.className).toContain('rounded-lg');
      expect(group.className).not.toContain('rounded-md');
    });

    it('merges on the addon', () => {
      render(
        <InputGroup>
          <InputGroupAddon className="text-text" data-testid="addon">
            $
          </InputGroupAddon>
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      const addon = screen.getByTestId('addon');
      expect(addon.className).toContain('text-text');
      expect(addon.className).not.toContain('text-text-muted');
    });

    it('merges on the input', () => {
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" className="px-1" />
        </InputGroup>,
      );
      expect(screen.getByRole('textbox', { name: 'Amount' }).className).toContain('px-1');
    });

    it('merges on the button', () => {
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton className="px-6">Go</InputGroupButton>
        </InputGroup>,
      );
      expect(screen.getByRole('button', { name: 'Go' }).className).toContain('px-6');
    });
  });

  describe('ref forwarding', () => {
    it('forwards the group ref to the div', () => {
      const ref = { current: null as HTMLDivElement | null };
      render(
        <InputGroup ref={ref} data-testid="group">
          <InputGroupInput aria-label="Amount" />
        </InputGroup>,
      );
      expect(ref.current).toBe(screen.getByTestId('group'));
    });

    it('forwards the input ref to the underlying input', () => {
      const ref = { current: null as HTMLInputElement | null };
      render(
        <InputGroup>
          <InputGroupInput ref={ref} aria-label="Amount" />
        </InputGroup>,
      );
      expect(ref.current).toBe(screen.getByRole('textbox', { name: 'Amount' }));
    });

    it('forwards the button ref to the underlying button', () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(
        <InputGroup>
          <InputGroupInput aria-label="Amount" />
          <InputGroupButton ref={ref}>Go</InputGroupButton>
        </InputGroup>,
      );
      expect(ref.current).toBe(screen.getByRole('button', { name: 'Go' }));
    });
  });

  it('renders a standalone part without a group context', () => {
    render(<InputGroupInput aria-label="Solo" />);
    const input = screen.getByRole('textbox', { name: 'Solo' });
    expect(input).not.toBeDisabled();
    expect(input).not.toHaveAttribute('aria-invalid');
  });
});
