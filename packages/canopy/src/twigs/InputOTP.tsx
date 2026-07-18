import * as React from 'react';
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from 'input-otp';
import { cn } from '../lib/cn';

/**
 * InputOTP - the segmented one-time-passcode field Twig (spec 0045). Verification flows (email /
 * SMS codes, TOTP, 2FA challenges) ask for "enter the 6-digit code" as a row of single-character
 * boxes; this owns that finicky control once - focus advance as you type, `Backspace` stepping
 * back, arrow navigation, whole-code paste distribution, and mobile `one-time-code` autofill.
 *
 * Primitive stack (shadcn's InputOTP model): Radix ships no OTP primitive, so the family is built
 * on the `input-otp` package, which renders a SINGLE real `<input>` (correct for labelling and OS
 * autofill) and exposes, through `OTPInputContext`, the per-slot state (`char`, `isActive`,
 * `hasFakeCaret`) that the visible boxes draw from. Because it renders one input, the layer is a
 * Twig: it composes slot parts via the package's context, with no portal and no interaction state
 * of its own (the package owns the input's state).
 *
 * The family follows the 0005 recipe: FULL LITERAL semantic-token Tailwind class strings (so
 * Tailwind v4's scanner emits each utility - never a dynamic class name for slot index or state),
 * `cn()` merge with the caller's `className` winning, `forwardRef` + a native prop spread on every
 * styled part, and `React.ComponentRef` for the primitive ref. There is NO `dark:` on the common
 * path - light/dark flips through the token layer (spec 0004). Field states (`disabled`,
 * `aria-invalid`) reuse the exact token classes `Input` (0006) uses, so an invalid / disabled
 * `InputOTP` reads identically to an invalid / disabled `Input`.
 */
export type InputOTPProps = React.ComponentPropsWithoutRef<typeof OTPInput> & {
  /** Class merged onto the flex row that wraps the slots (the package's `containerClassName`). */
  containerClassName?: string;
};

/**
 * InputOTP - the root. Wraps the package's `OTPInput`, forwarding `ref` to the underlying single
 * `<input>` and spreading native props. `maxLength` sets the slot count; `pattern` defaults to
 * NUMERIC (`REGEXP_ONLY_DIGITS`) - the common OTP case, which also drives the right mobile keyboard
 * - and a caller passes an alphanumeric regex source to widen it. Value is controlled (`value` /
 * `onChange`) or uncontrolled, and `onComplete` fires when every slot is filled. When `disabled`,
 * the container flags `group` + the not-allowed cursor so each slot can dim to the shared field
 * disabled tokens (`bg-disabled` / `text-disabled-foreground`) via `group-has-[:disabled]:`,
 * matching a disabled `Input` rather than the toggle-control opacity wash.
 */
export const InputOTP = React.forwardRef<
  React.ComponentRef<typeof OTPInput>,
  InputOTPProps
>(({ className, containerClassName, pattern = REGEXP_ONLY_DIGITS, ...props }, ref) => (
  <OTPInput
    ref={ref}
    pattern={pattern}
    containerClassName={cn(
      'group flex items-center gap-2 has-[:disabled]:cursor-not-allowed',
      containerClassName,
    )}
    className={cn('disabled:cursor-not-allowed', className)}
    {...props}
  />
));
InputOTP.displayName = 'InputOTP';

export type InputOTPGroupProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * InputOTPGroup - a flex run of slots. A styled `div` (`flex items-center`) grouping a contiguous
 * set of `InputOTPSlot`s; separate groups are divided by an `InputOTPSeparator`.
 */
export const InputOTPGroup = React.forwardRef<HTMLDivElement, InputOTPGroupProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center', className)} {...props} />
  ),
);
InputOTPGroup.displayName = 'InputOTPGroup';

export interface InputOTPSlotProps extends React.ComponentPropsWithoutRef<'div'> {
  /** The zero-based position this box draws from the root's slot state. */
  index: number;
}

/**
 * InputOTPSlot - one character box, addressed by `index`. It reads its slot state
 * (`char` / `isActive` / `hasFakeCaret`) from the root's `OTPInputContext` and renders the typed
 * character; when the slot is active it shows a focus RING (the field focus tokens) plus a blinking
 * fake CARET (a thin bar animated with `animate-pulse`, gated behind `motion-reduce:animate-none`
 * so reduced-motion users get a steady bar - no new keyframe). The glyph is sized `text-base
 * md:text-sm` to track the field type ramp `Input` / `Textarea` / `Select` use, and when the
 * root input is disabled the box dims to the shared field disabled tokens
 * (`bg-disabled` / `text-disabled-foreground`) via `group-has-[:disabled]:`, for Input parity.
 *
 * OWN LOGIC / boundary guard: the package's `slots` array is exactly `maxLength` long, so an
 * `index` outside `[0, maxLength)` has no entry - reading `slots[index]` there is `undefined` and
 * would crash the box. The package's driving input clamps its value to `maxLength`, so an
 * out-of-range slot can never be filled or active; we therefore CLAMP our own read to a safe empty,
 * inactive, caretless state. This keeps our visuals in agreement with the primitive (an
 * out-of-range box renders empty and never claims focus) instead of throwing or drawing a caret the
 * input can never place there.
 */
export const InputOTPSlot = React.forwardRef<HTMLDivElement, InputOTPSlotProps>(
  ({ index, className, ...props }, ref) => {
    const context = React.useContext(OTPInputContext);
    const slot = context.slots[index];
    // Clamp out-of-range / absent slots to an inert empty state (see the boundary note above).
    const char = slot?.char ?? null;
    const hasFakeCaret = slot?.hasFakeCaret ?? false;
    const isActive = slot?.isActive ?? false;

    return (
      <div
        ref={ref}
        data-active={isActive ? 'true' : undefined}
        aria-invalid={props['aria-invalid']}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center border-y border-r border-border bg-surface text-base md:text-sm text-text',
          'first:rounded-l-md first:border-l last:rounded-r-md',
          'group-has-[:disabled]:bg-disabled group-has-[:disabled]:text-disabled-foreground',
          'aria-invalid:border-danger',
          'data-[active=true]:z-10 data-[active=true]:ring-2 data-[active=true]:ring-ring data-[active=true]:ring-offset-2 data-[active=true]:ring-offset-ring-offset',
          'data-[active=true]:aria-invalid:ring-danger',
          className,
        )}
        {...props}
      >
        {char}
        {hasFakeCaret ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-4 w-px animate-pulse bg-text motion-reduce:animate-none" />
          </div>
        ) : null}
      </div>
    );
  },
);
InputOTPSlot.displayName = 'InputOTPSlot';

export type InputOTPSeparatorProps = React.ComponentPropsWithoutRef<'div'>;

/**
 * InputOTPSeparator - a presentational divider between groups (`role="separator"`,
 * non-interactive). Renders a hand-rolled `currentColor` dash SVG (the Breadcrumb / Dialog-close
 * precedent) so it inherits the muted text token and adds no dependency.
 */
export const InputOTPSeparator = React.forwardRef<HTMLDivElement, InputOTPSeparatorProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      className={cn('flex items-center px-1 text-text-muted', className)}
      {...props}
    >
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
  ),
);
InputOTPSeparator.displayName = 'InputOTPSeparator';
