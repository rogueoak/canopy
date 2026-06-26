import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { cn } from '../lib/cn';

export type RadioGroupProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

export type RadioGroupItemProps = React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

/**
 * RadioGroup — the single-choice selection Seed (spec 0011). The root is a thin wrapper over
 * `@radix-ui/react-radio-group`'s `Root`: Radix owns the selection state and the roving
 * keyboard model (arrow keys move focus AND selection, Tab enters/leaves the group), and this
 * Seed only paints a vertical `grid gap-2` layout and forwards `ref` + native props. There is
 * no per-component theme code — light/dark flips through the token layer (spec 0004).
 */
export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root ref={ref} className={cn('grid gap-2', className)} {...props} />
));
RadioGroup.displayName = 'RadioGroup';

/**
 * RadioGroupItem — one selectable circle in a RadioGroup. A `h-5 w-5` token-styled circle with
 * an idle `border-strong` ring over `bg-surface`; when selected the border becomes `primary`
 * (`data-[state=checked]:border-primary`) and the centred `RadioGroup.Indicator` reveals a
 * `bg-primary` dot. Carries the shared focus-visible ring for a11y, and the
 * `disabled:cursor-not-allowed disabled:opacity-50` affordance (per-item or inherited from a
 * fully-disabled group). All class strings are FULL LITERALS so Tailwind v4's source scanner
 * emits each utility. `forwardRef`, `cn()` merge, native prop spread follow the 0005 recipe.
 */
export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'h-5 w-5 shrink-0 rounded-full border border-border-strong bg-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset data-[state=checked]:border-primary disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex h-full w-full items-center justify-center">
      <span className="h-2.5 w-2.5 rounded-full bg-primary" />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';
