import * as React from 'react';
import { cn } from '../lib/cn';

/**
 * textareaBase - the full literal class string that maps a multi-line `<textarea>` onto
 * canopy semantic-token Tailwind utilities (spec 0012), mirroring Input's token base (spec
 * 0006) for visual parity. Every class is a FULL LITERAL so Tailwind v4's source scanner emits
 * each utility - never build a class name dynamically. There is no `dark:` here: light/dark
 * flips automatically through the token layer (spec 0004).
 *
 * Mirrors Input exactly for the shared axes - border + surface + text tokens, the muted
 * placeholder (`text-muted`, not `text-subtle`: subtle is AA-Large-only and placeholder is
 * small text - review 0006), the focus-visible ring, the disabled token pair (not opacity),
 * and the `aria-invalid:` danger overrides for border + ring. Textarea-specific: vertical
 * padding (`py-2`) rather than a fixed `h-*`, a `min-h-20` floor so an empty field reads as
 * multi-line, and `resize-y` so a reader can drag the field taller (height otherwise follows
 * the native `rows` prop).
 */
// Font size is `text-base md:text-sm` (16px mobile, 14px from md up): iOS Safari auto-zooms a
// focused field under 16px, so phones get 16px and larger viewports keep the denser 14px
// (feedback 0017), matching Input.
const textareaBase =
  'flex w-full rounded-md border border-border bg-surface px-3 py-2 text-base md:text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-foreground aria-invalid:border-danger aria-invalid:ring-danger min-h-20 resize-y';

/**
 * TextareaProps - the native `<textarea>` attributes, verbatim. Textarea adds no bespoke props
 * (invalid is the native `aria-invalid`), so this is a pass-through. It stays an `interface`
 * (not a `type` alias) because `react/prop-types` only resolves the spread-prop members through
 * an interface's `extends`; the resulting "empty interface" is therefore intentional.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- see JSDoc: interface is required for react/prop-types resolution
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea - the canopy multi-line text-field Seed (spec 0012), built on the 0005 component
 * recipe: semantic-token utilities, `cn()` class merge, `forwardRef`, and a full spread of
 * native `<textarea>` props (`rows`, `cols`, `maxLength`, …). The `invalid` state is the native
 * `aria-invalid` attribute (styled via the `aria-invalid:` variant) - pass it through like any
 * native prop, exactly as Input does. Themed entirely by tokens - no per-component theme code.
 *
 * Auto-resize (grow-to-content) is intentionally OUT of scope (spec 0012): set the height with
 * the native `rows` prop or CSS, and a reader can fine-tune it via the `resize-y` handle. A
 * controlled auto-grow behaviour can be a follow-up if demand warrants.
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} className={cn(textareaBase, className)} {...props} />;
  },
);
Textarea.displayName = 'Textarea';
