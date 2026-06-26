import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * keyboardVariants — the cva recipe that maps `size` onto canopy semantic-token Tailwind
 * utilities (spec 0019). All class strings are FULL LITERALS so Tailwind v4's source scanner
 * emits each utility — never build a class name dynamically. There is no `dark:` here:
 * light/dark flips automatically through the token layer (spec 0004).
 *
 * The base gives a subtle key-cap look: a hairline `border` outline around a `muted` fill with
 * `muted-foreground` text in a monospace face and a small radius. `size` scales the cap box:
 * `sm` for dense help text, `md` (default) for inline hints and command menus.
 */
export const keyboardVariants = cva(
  // Base — the key-cap look shared by every size. Presentational (non-interactive, no focus ring).
  'inline-flex items-center justify-center rounded border border-border bg-muted font-mono text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'h-5 min-w-5 px-1 text-xs',
        md: 'h-6 min-w-6 px-1.5 text-xs',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface KeyboardProps
  extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof keyboardVariants> {}

/**
 * Keyboard — a small, presentational element that renders a keyboard key (`⌘`, `Esc`, `Ctrl`) for
 * help text, command menus, and tooltips. Follows the component recipe: a cva `size` variant over
 * semantic tokens, `cn()` class merge, `forwardRef`, and a full spread of native props. Renders the
 * semantic `<kbd>` element and is themed entirely by tokens — no per-component theme code.
 *
 * Display-only: it carries no key-binding logic (capturing or registering presses is out of scope).
 * For a combo, compose multiple `Keyboard` with a separator between them, e.g.
 * `<Keyboard>⌘</Keyboard> + <Keyboard>K</Keyboard>`.
 */
export const Keyboard = React.forwardRef<HTMLElement, KeyboardProps>(
  ({ className, size, ...props }, ref) => {
    return <kbd ref={ref} className={cn(keyboardVariants({ size }), className)} {...props} />;
  },
);
Keyboard.displayName = 'Keyboard';
