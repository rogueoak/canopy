import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * buttonVariants - the cva recipe that maps `variant` × `size` onto canopy semantic-token
 * Tailwind utilities (spec 0005). All class strings are FULL LITERALS so Tailwind v4's
 * source scanner emits each utility - never build a class name dynamically. There is no
 * `dark:` here: light/dark flips automatically through the token layer (spec 0004).
 */
export const buttonVariants = cva(
  // Base - shared by every variant/size.
  'inline-flex items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-foreground',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active',
        outline:
          'border border-border-strong bg-transparent text-text hover:bg-muted active:bg-muted',
        ghost: 'bg-transparent text-text hover:bg-muted active:bg-muted',
        destructive:
          'bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /**
   * Render as the single child element instead of a `<button>` (Radix `Slot`), merging
   * button classes/props onto it. Use for link-styled buttons: `<Button asChild><a … /></Button>`.
   *
   * Two caveats when `asChild` renders a non-`<button>` element:
   * - `ref` is still typed `HTMLButtonElement` (the default element); narrow it at the call
   *   site if you need the child's element type.
   * - native `<button>` semantics don't apply - `disabled` (and the `disabled:*` styles) are
   *   inert on, e.g., an `<a>`. Use `aria-disabled` + your own guard for a disabled link.
   */
  asChild?: boolean;
}

/**
 * Button - the first canopy Seed, and the reference for the component recipe: cva variants
 * over semantic tokens, `cn()` class merge, Radix `Slot` for `asChild`, `forwardRef`, and a
 * full spread of native `<button>` props. Themed entirely by tokens - no per-component theme code.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = 'Button';
