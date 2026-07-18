import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Button, Input } from '../seeds';

/**
 * InputGroupContextValue - the small shared wiring the InputGroup parts consume (spec 0044). The
 * root owns the group `disabled` and derived `invalid` flags so `InputGroupInput` can set them on
 * the real `<input>` (genuinely inert / genuinely invalid for assistive tech) and `InputGroupAddon`
 * can mute itself when the group is disabled. Callers can still override `disabled` / `aria-invalid`
 * directly on a part; the group value is the default.
 */
interface InputGroupContextValue {
  /** Whether the whole group is disabled - propagated to the input and mutes addons. */
  disabled: boolean;
  /** Whether the group is invalid (derived from the root's `aria-invalid`) - propagated to input. */
  invalid: boolean;
}

const InputGroupContext = React.createContext<InputGroupContextValue | null>(null);

function useInputGroupContext(): InputGroupContextValue {
  // Parts render standalone (no throw): a lone InputGroupInput is still a valid borderless Input.
  return React.useContext(InputGroupContext) ?? { disabled: false, invalid: false };
}

/**
 * `aria-invalid` is a native attribute typed as `boolean | 'true' | 'false' | 'grammar' | 'spelling'`.
 * Only `false` / `'false'` count as "not invalid"; every other set value (including `'grammar'`) is
 * an invalid state. Normalize it ourselves so the group's danger styling and the propagated flag
 * never disagree with the attribute the caller passed.
 */
function isAriaInvalid(value: React.AriaAttributes['aria-invalid']): boolean {
  return value != null && value !== false && value !== 'false';
}

/**
 * inputGroupVariants - the cva recipe mapping `size` onto canopy semantic-token utilities (spec
 * 0044), following the 0005 recipe. FULL LITERAL class strings so Tailwind v4's scanner emits each;
 * no `dark:` - light/dark flips through the token layer. The bordered box owns the frame: border +
 * surface + radius, the group focus ring via `focus-within:*` (so focusing the inner input lights
 * the whole box), the shared field disabled token pair, and the `aria-invalid:` danger overrides -
 * exactly the tokens a lone `Input` uses, so a disabled/invalid group reads identically.
 */
export const inputGroupVariants = cva(
  'flex w-full items-center overflow-hidden rounded-md border border-border bg-surface text-base md:text-sm text-text focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-ring-offset has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-disabled has-[:disabled]:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger',
  {
    variants: {
      size: {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface InputGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof inputGroupVariants> {
  /** Disables the whole group: propagates to the inner `<input>` and mutes the addons. */
  disabled?: boolean;
}

/**
 * InputGroup - the bordered flex shell of the InputGroup Twig (spec 0044), following the 0020/0005
 * composition recipe: it COMPOSES the Input and Button Seeds into one affixed field styled with
 * semantic tokens only (no `dark:`, no new token, no new dependency).
 *
 * The single-frame trick: the border, radius, background, focus ring, disabled tokens, and
 * `aria-invalid` danger overrides all live HERE, on the outer group. `InputGroupInput` strips its
 * own frame so the box shows one border and - through `focus-within` - one focus ring when the
 * inner input is focused, making the affixed field read as a single control. `disabled` and the
 * `aria-invalid`-derived invalid flag flow through a small context to the parts; `ref` forwards to
 * the `div` and native props spread onto it.
 */
export const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
  ({ className, size, disabled = false, 'aria-invalid': ariaInvalid, children, ...props }, ref) => {
    const invalid = isAriaInvalid(ariaInvalid);
    const value = React.useMemo<InputGroupContextValue>(
      () => ({ disabled, invalid }),
      [disabled, invalid],
    );
    return (
      <InputGroupContext.Provider value={value}>
        {/*
          Spread a normalized boolean `aria-invalid` onto the div, not the raw attribute: Tailwind's
          `aria-invalid:` variant only matches the literal `"true"`, so `aria-invalid="grammar"`
          would report invalid on the inner input yet leave the group frame non-danger. Deriving the
          spread flag from the same `invalid` the context propagates keeps styling and the flag in
          lockstep. `undefined` (not `false`) when valid so no attribute is emitted for the default.
        */}
        <div
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(inputGroupVariants({ size }), className)}
          {...props}
        >
          {children}
        </div>
      </InputGroupContext.Provider>
    );
  },
);
InputGroup.displayName = 'InputGroup';

export interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Which edge the addon sits on within the group's flex row: `start` (leading, default) or `end`
   * (trailing). Ordering is left to render order; `align` sets the flush horizontal padding and
   * carries the intent as a `data-align` hook.
   */
  align?: 'start' | 'end';
}

/**
 * InputGroupAddon - a flush, non-interactive-by-default affix for an icon or short text (spec 0044).
 * `pointer-events-none` by default so clicks fall through to the input; muted text
 * (`text-text-muted`) that dims to the shared disabled token when the group is disabled. Decorative
 * icons passed as children should carry `aria-hidden` and inherit colour via `currentColor`.
 */
export const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = 'start', ...props }, ref) => {
    const { disabled } = useInputGroupContext();
    return (
      <div
        ref={ref}
        data-align={align}
        className={cn(
          'flex items-center px-3 text-text-muted pointer-events-none',
          disabled && 'text-disabled-foreground',
          className,
        )}
        {...props}
      />
    );
  },
);
InputGroupAddon.displayName = 'InputGroupAddon';

export type InputGroupInputProps = React.ComponentPropsWithoutRef<typeof Input>;

/**
 * InputGroupInput - the borderless canopy Input that flexes to fill the remaining width (spec 0044).
 * It strips its own frame (`border-0 bg-transparent focus-visible:ring-0`) so the group owns the
 * border and focus ring - no double outline. Reads the group context to set `disabled` and
 * `aria-invalid` on the real `<input>` (so the input is genuinely inert / invalid for assistive
 * tech); a caller can still override either directly on this part. `ref` forwards to the `<input>`.
 */
export const InputGroupInput = React.forwardRef<
  React.ComponentRef<typeof Input>,
  InputGroupInputProps
>(({ className, disabled, 'aria-invalid': ariaInvalid, ...props }, ref) => {
  const group = useInputGroupContext();
  const resolvedDisabled = disabled ?? group.disabled;
  const resolvedInvalid = ariaInvalid ?? (group.invalid || undefined);
  return (
    <Input
      ref={ref}
      disabled={resolvedDisabled}
      aria-invalid={resolvedInvalid}
      className={cn(
        'h-full flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 disabled:bg-transparent aria-invalid:border-0 aria-invalid:ring-0',
        className,
      )}
      {...props}
    />
  );
});
InputGroupInput.displayName = 'InputGroupInput';

export type InputGroupButtonProps = React.ComponentPropsWithoutRef<typeof Button>;

/**
 * InputGroupButton - a real, labelled action `<button>` sized to sit flush inside the group (spec
 * 0044), for a trailing/leading action ("Copy" / "Go" / a reveal toggle). Wraps the Button Seed,
 * defaulting to `variant="ghost"` and `size="sm"` with `rounded-none h-full` so it fills the group
 * edge. Reads the group context so a disabled group disables the button too; a caller can override.
 * `ref` forwards to the `<button>`; native button props spread onto it.
 *
 * Focus ring: the group is `overflow-hidden`, so the base Button's offset ring - drawn OUTSIDE the
 * button box at the very edge of the group - would be clipped, leaving a keyboard user tabbing to
 * the button with no visible focus state. Override to an INSET ring (`ring-inset`, `ring-offset-0`)
 * so the indicator renders inside the clipped box and stays visible.
 */
export const InputGroupButton = React.forwardRef<
  React.ComponentRef<typeof Button>,
  InputGroupButtonProps
>(({ className, variant = 'ghost', size = 'sm', type = 'button', disabled, ...props }, ref) => {
  const group = useInputGroupContext();
  return (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      disabled={disabled ?? group.disabled}
      className={cn(
        'h-full shrink-0 rounded-none focus-visible:ring-inset focus-visible:ring-offset-0',
        className,
      )}
      {...props}
    />
  );
});
InputGroupButton.displayName = 'InputGroupButton';
