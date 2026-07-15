import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '../lib/cn';

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /**
   * When `true`, renders a trailing danger-coloured `*` after the label text to mark the
   * paired field as required. The asterisk is `aria-hidden` so it is purely visual and does
   * NOT pollute the control's accessible name - communicate the requirement to assistive tech
   * via the field's own `required` / `aria-required` instead.
   */
  required?: boolean;
}

/**
 * Label - the form-field Seed (spec 0007). Built on `@radix-ui/react-label`, so an `htmlFor`
 * pointing at a control's `id` not only associates the two for assistive tech but also focuses
 * that control when the label is clicked. Styled with the semantic typography `label` role
 * (`text-label`, which carries its own medium weight) plus `text-text`; no per-component theme
 * code - light/dark flips through
 * the token layer (spec 0004). `forwardRef`, full native `<label>` prop spread, and `cn()` merge
 * follow the 0005 recipe.
 */
export const Label = React.forwardRef<React.ComponentRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, children, required = false, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(
        // The `label` typography role already carries its font-size AND weight (medium), so no
        // `font-medium` here (it would pin the weight and override a future token retune). No
        // `peer-disabled:*` either - it can only fire when the control is a preceding `.peer`
        // sibling, which this label-above-input atom never guarantees; a FormField Twig will own
        // the disabled-label affordance.
        'text-label text-text select-none',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-danger">
          {' *'}
        </span>
      )}
    </LabelPrimitive.Root>
  ),
);
Label.displayName = 'Label';
