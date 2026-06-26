import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '../lib/cn';

/**
 * checkboxClasses — the canopy semantic-token utilities for the Checkbox box (spec 0009),
 * following the 0005 Button recipe. All class strings are FULL LITERALS so Tailwind v4's
 * source scanner emits each utility — never build a class name dynamically. There is no
 * `dark:` here: light/dark flips automatically through the token layer (spec 0004).
 *
 * The box is a `h-5 w-5` rounded square with a `border-strong` outline over `surface`. Radix
 * exposes the control state as `data-state` ("checked" | "unchecked" | "indeterminate"), so the
 * filled look for both checked AND indeterminate is driven by the `data-[state=…]:` variants —
 * swapping to the `primary` / `primary-foreground` ramp. `group` lets the indicator pick its icon
 * from the same `data-state`. Focus uses the shared `ring` / `ring-offset` pair; disabled dims via
 * opacity (the checked `primary` fill stays legible, just muted) plus `cursor-not-allowed`, per
 * the token note that controls may dim with opacity.
 */
const checkboxClasses =
  'group peer inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-surface text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary';

/**
 * CheckIcon — inline check mark for the checked state. No icon library: a hand-rolled SVG that
 * inherits the box's `text-primary-foreground` through `currentColor`, so it re-themes for free.
 */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * MinusIcon — inline dash for the indeterminate ("mixed") state, mirroring CheckIcon's sizing
 * and `currentColor` so it shares the same fill and theming.
 */
function MinusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

export type CheckboxProps = React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

/**
 * Checkbox — the canopy boolean-field Seed (spec 0009), built on `@radix-ui/react-checkbox` and
 * the 0005 component recipe: semantic-token utilities, `cn()` class merge, `forwardRef`, and a
 * full spread of native props. Supports `checked` / `unchecked` / `indeterminate` (pass
 * `checked="indeterminate"`, controlled or via `defaultChecked`); the indicator picks the inline
 * check or dash SVG from the live `data-state`, so it is correct for both controlled and
 * uncontrolled use. The control reports the correct `role="checkbox"` and `aria-checked` for
 * assistive tech, and pairs with `Label` via `id` / `htmlFor`. Themed entirely by tokens — no
 * per-component theme code.
 */
export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root ref={ref} className={cn(checkboxClasses, className)} {...props}>
    <CheckboxPrimitive.Indicator className="inline-flex items-center justify-center text-current">
      <CheckIcon className="hidden h-3.5 w-3.5 group-data-[state=checked]:block" />
      <MinusIcon className="hidden h-3.5 w-3.5 group-data-[state=indeterminate]:block" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';
