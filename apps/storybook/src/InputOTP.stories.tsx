import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/InputOTP - the segmented one-time-passcode field (spec 0045). Built on the `input-otp`
 * package (shadcn's InputOTP model): a SINGLE accessible `<input>` drives the field, and the
 * visible boxes are presentational slots drawn from the package's render context. Typing fills
 * left-to-right and advances, `Backspace` steps back, arrows move the active slot, and pasting a
 * whole code distributes it across the slots. `maxLength` sets the slot count; `pattern` defaults
 * to NUMERIC (pass an alphanumeric regex to widen).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004). The box borders ride `border-border` on
 * `bg-surface`, the active slot shows the focus RING (`ring-ring`) plus a blinking caret, and the
 * `disabled` / `aria-invalid` states reuse the exact `Input` tokens for parity.
 */
const meta = {
  title: 'Twigs/InputOTP',
  component: InputOTP,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof InputOTP>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------- Playground */

/** The default: a 6-digit numeric field in a single group. Type or paste a code. */
export const Playground: Story = {
  args: { maxLength: 6, 'aria-label': 'Verification code' },
  render: (args) => (
    <InputOTP {...args}>
      <InputOTPGroup>
        {Array.from({ length: args.maxLength }, (_, i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* -------------------------------------------------------------- Six digit */

/** The canonical OTP: six numeric slots in one group. */
export const SixDigit: Story = {
  render: () => (
    <InputOTP maxLength={6} aria-label="Six digit code">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* -------------------------------------------------------------- Four digit */

/** A shorter four-slot field (PIN-style). */
export const FourDigit: Story = {
  render: () => (
    <InputOTP maxLength={4} aria-label="Four digit code">
      <InputOTPGroup>
        {[0, 1, 2, 3].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* --------------------------------------------------------- Separated groups */

/** Two groups of three, divided by a non-interactive separator (`3-3` layout). */
export const SeparatedGroups: Story = {
  render: () => (
    <InputOTP maxLength={6} aria-label="Grouped code">
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* -------------------------------------------------------------- Alphanumeric */

/** An alphanumeric code: pass `REGEXP_ONLY_DIGITS_AND_CHARS` so letters are admitted too. */
export const Alphanumeric: Story = {
  render: () => (
    <InputOTP maxLength={6} pattern={REGEXP_ONLY_DIGITS_AND_CHARS} aria-label="Alphanumeric code">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* ------------------------------------------------------------------ Disabled */

/** Disabled: the field is inert and dims through the shared disabled tokens. */
export const Disabled: Story = {
  render: () => (
    <InputOTP maxLength={6} disabled defaultValue="123" aria-label="Disabled code">
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* ------------------------------------------------------------------- Invalid */

/** Invalid: `aria-invalid` on the slots applies the danger border/ring exactly as `Input` does. */
export const Invalid: Story = {
  render: () => (
    <InputOTP maxLength={6} defaultValue="123" aria-label="Invalid code" aria-invalid>
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} aria-invalid />
        ))}
      </InputOTPGroup>
    </InputOTP>
  ),
};

/* ---------------------------------------------------- Controlled + onComplete */

/**
 * Controlled value with `onComplete`: the parent owns the value via `value` / `onChange`, and
 * `onComplete` fires once every slot is filled (shown here by echoing the completed code).
 */
export const ControlledOnComplete: Story = {
  render: () => {
    const [value, setValue] = React.useState('');
    const [completed, setCompleted] = React.useState<string | null>(null);
    return (
      <div className="flex flex-col items-center gap-3">
        <InputOTP
          maxLength={6}
          value={value}
          onChange={(next) => {
            setValue(next);
            if (next.length < 6) setCompleted(null);
          }}
          onComplete={setCompleted}
          aria-label="Controlled code"
        >
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        <p className="text-body-sm text-text-muted">
          {completed ? `Completed: ${completed}` : `Current: ${value || '(empty)'}`}
        </p>
      </div>
    );
  },
};
