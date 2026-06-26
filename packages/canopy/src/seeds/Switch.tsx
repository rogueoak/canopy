import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '../lib/cn';

export type SwitchProps = React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

/**
 * Switch — the canopy on/off toggle Seed (spec 0010). For instant settings (notifications,
 * feature flags) where a checkbox's "submit later" semantics don't fit. Built on
 * `@radix-ui/react-switch`, so it ships the correct `role="switch"` / `aria-checked` and the
 * full controlled (`checked` + `onCheckedChange`) and uncontrolled (`defaultChecked`) APIs.
 *
 * Styled entirely with semantic-token utilities (spec 0005 recipe) — all FULL LITERALS so
 * Tailwind v4's source scanner emits each one. No `dark:`: light/dark flips through the token
 * layer (spec 0004). The pill track is `bg-border` when off and `data-[state=checked]:bg-primary`
 * when on; the `bg-surface` thumb slides with a transform transition. The focus-visible ring lives
 * on the Root so keyboard focus is always visible. Pairs with `Label` via `htmlFor`/`id`.
 * `forwardRef`, full native prop spread, and `cn()` merge follow the recipe.
 */
export const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  ({ className, ...props }, ref) => (
    <SwitchPrimitive.Root
      ref={ref}
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-border transition-colors data-[state=checked]:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 translate-x-0.5 rounded-full bg-surface shadow-sm transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  ),
);
Switch.displayName = 'Switch';
