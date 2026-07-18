import * as React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './InputOTP';

/**
 * A 6-slot numeric field, split into two groups of three by a separator. Used as the default
 * harness; individual tests override `maxLength` / props as needed.
 */
function renderOTP(props: React.ComponentProps<typeof InputOTP> = { maxLength: 6 }) {
  return render(
    <InputOTP aria-label="Verification code" {...props}>
      <InputOTPGroup>
        {Array.from({ length: props.maxLength }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>,
  );
}

describe('InputOTP', () => {
  it('renders one accessible input carrying the name (slots are presentational)', () => {
    renderOTP({ maxLength: 6 });
    // Exactly one real input drives the field, and it carries the accessible name.
    const input = screen.getByRole('textbox', { name: 'Verification code' });
    expect(input).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
  });

  it('renders maxLength slots', () => {
    const { container } = renderOTP({ maxLength: 4 });
    // The slot boxes are the group's direct children (the caret is a nested absolute div).
    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots).toHaveLength(4);
  });

  it('typing fills slots left-to-right and advances', async () => {
    const user = userEvent.setup();
    const { container } = renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('12');

    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots[0]).toHaveTextContent('1');
    expect(slots[1]).toHaveTextContent('2');
    expect(slots[2]).toHaveTextContent('');
    expect(input).toHaveValue('12');
  });

  it('Backspace clears and steps back', async () => {
    const user = userEvent.setup();
    const { container } = renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('12');
    await user.keyboard('{Backspace}');

    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots[1]).toHaveTextContent('');
    expect(input).toHaveValue('1');
  });

  it('paste distributes a whole code across the slots', async () => {
    const user = userEvent.setup();
    const { container } = renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.paste('123456');

    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    const chars = Array.from(slots).map((s) => s.textContent);
    expect(chars).toEqual(['1', '2', '3', '4', '5', '6']);
    expect(input).toHaveValue('123456');
  });

  it('numeric pattern (default) rejects letters', async () => {
    const user = userEvent.setup();
    renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('12a3');
    // The 'a' is rejected by the default numeric pattern; only digits land.
    expect(input).toHaveValue('123');
  });

  it('an alphanumeric pattern admits letters', async () => {
    const user = userEvent.setup();
    renderOTP({ maxLength: 6, pattern: REGEXP_ONLY_DIGITS_AND_CHARS });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('1a2b');
    expect(input).toHaveValue('1a2b');
  });

  it('fires onComplete exactly when every slot is filled', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(
      <InputOTP aria-label="Code" maxLength={4} onComplete={onComplete}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>,
    );
    const input = screen.getByRole('textbox');
    await user.click(input);

    await user.keyboard('123');
    expect(onComplete).not.toHaveBeenCalled();
    await user.keyboard('4');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('renders a controlled value', () => {
    const { container } = render(
      <InputOTP aria-label="Code" maxLength={4} value="42" onChange={() => {}}>
        <InputOTPGroup>
          {[0, 1, 2, 3].map((i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      </InputOTP>,
    );
    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots[0]).toHaveTextContent('4');
    expect(slots[1]).toHaveTextContent('2');
    expect(screen.getByRole('textbox')).toHaveValue('42');
  });

  it('drives onChange as a controlled field', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = React.useState('');
      return (
        <InputOTP aria-label="Code" maxLength={4} value={value} onChange={setValue}>
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      );
    }
    render(<Controlled />);
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('99');
    expect(input).toHaveValue('99');
  });

  it('edits as an uncontrolled field', async () => {
    const user = userEvent.setup();
    const { container } = renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('55');
    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots[0]).toHaveTextContent('5');
    expect(slots[1]).toHaveTextContent('5');
  });

  it('is inert when disabled', async () => {
    const user = userEvent.setup();
    renderOTP({ maxLength: 6, disabled: true });
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    await user.type(input, '123');
    expect(input).toHaveValue('');
  });

  it('applies the danger border when aria-invalid is set on a slot', () => {
    const { container } = render(
      <InputOTP aria-label="Code" maxLength={2}>
        <InputOTPGroup>
          <InputOTPSlot index={0} aria-invalid />
          <InputOTPSlot index={1} aria-invalid />
        </InputOTPGroup>
      </InputOTP>,
    );
    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    slots.forEach((slot) => {
      expect(slot).toHaveAttribute('aria-invalid', 'true');
      expect(slot).toHaveClass('aria-invalid:border-danger');
    });
  });

  it('merges className with the caller winning on the slot', () => {
    const { container } = render(
      <InputOTP aria-label="Code" maxLength={1}>
        <InputOTPGroup className="gap-4">
          <InputOTPSlot index={0} className="h-16 w-16" />
        </InputOTPGroup>
      </InputOTP>,
    );
    const slot = container.querySelector('[class*="first:rounded-l-md"]')!;
    // Caller's sizing wins over the base h-10 w-10 (tailwind-merge drops the conflicting base).
    expect(slot).toHaveClass('h-16', 'w-16');
    expect(slot).not.toHaveClass('h-10', 'w-10');
    expect(slot.parentElement).toHaveClass('gap-4');
  });

  it('renders a non-interactive separator', () => {
    render(<InputOTPSeparator />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('forwards the root ref to the underlying input', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(
      <InputOTP aria-label="Code" maxLength={4} ref={ref}>
        <InputOTPGroup>
          <InputOTPSlot index={0} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByRole('textbox'));
  });

  it('forwards refs to the group, slot, and separator', () => {
    const groupRef = React.createRef<HTMLDivElement>();
    const slotRef = React.createRef<HTMLDivElement>();
    const separatorRef = React.createRef<HTMLDivElement>();
    render(
      <InputOTP aria-label="Code" maxLength={2}>
        <InputOTPGroup ref={groupRef}>
          <InputOTPSlot index={0} ref={slotRef} />
          <InputOTPSeparator ref={separatorRef} />
          <InputOTPSlot index={1} />
        </InputOTPGroup>
      </InputOTP>,
    );
    expect(groupRef.current).toBeInstanceOf(HTMLDivElement);
    expect(slotRef.current).toBeInstanceOf(HTMLDivElement);
    expect(separatorRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('marks the active slot with data-active while typing', async () => {
    const user = userEvent.setup();
    const { container } = renderOTP({ maxLength: 6 });
    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.keyboard('1');
    // After one keystroke the second slot (index 1) is the active target. Assert the exact
    // value the `data-[active=true]:` ring/z-index selectors match - not just attribute presence -
    // so a regression that emits an empty-string (unmatched) attribute fails here.
    const slots = container.querySelectorAll('[class*="first:rounded-l-md"]');
    expect(slots[1]).toHaveAttribute('data-active', 'true');
  });

  // Note: arrow-key caret navigation is intentionally NOT unit-tested. The active slot is driven
  // by input-otp's caret/selectionStart, which jsdom does not model reliably across runs (the
  // assertions flaked run-to-run). Our own logic - mapping the reported active index to a single
  // data-active slot - is covered deterministically by the single-keystroke test above. Arrow-key
  // navigation is exercised as a browser interaction in the Storybook story instead.

  it('renders an out-of-range slot as an inert empty box (boundary guard)', async () => {
    // index 9 has no entry in a 4-slot field: our clamp renders it empty and never active/caret,
    // rather than crashing on `slots[9]`. Fill the field so a naive read might otherwise light up.
    const user = userEvent.setup();
    const { container } = render(
      <InputOTP aria-label="Code" maxLength={4} defaultValue="1234">
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={9} data-testid="oob" />
        </InputOTPGroup>
      </InputOTP>,
    );
    const oob = container.querySelector('[data-testid="oob"]')!;
    expect(oob).toBeInTheDocument();
    expect(oob).toHaveTextContent('');
    expect(oob).not.toHaveAttribute('data-active');
    // The real input still accepts the full clamped value.
    expect(screen.getByRole('textbox')).toHaveValue('1234');
    await user.click(screen.getByRole('textbox'));
    expect(oob).not.toHaveAttribute('data-active');
  });
});
