import * as React from 'react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../lib/cn';

export type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>;

/**
 * Slider - the canopy bounded-numeric-range Seed (spec 0038). For picking a number from a
 * continuous range by dragging - a volume level, a price filter, an opacity or zoom setting, a
 * min/max range filter. Built on `@radix-ui/react-slider`, so Radix owns the value state
 * (controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`), pointer and
 * keyboard interaction, stepping/bounds, orientation, and the `role="slider"` ARIA on each thumb
 * (`aria-valuenow` / `aria-valuemin` / `aria-valuemax` / `aria-orientation`). The Seed adds
 * styling, not behaviour.
 *
 * Styled entirely with semantic-token utilities (spec 0005 recipe) - all FULL LITERALS so
 * Tailwind v4's source scanner emits each one. No `dark:`: light/dark flips through the token
 * layer (spec 0004). The track is `bg-muted`, the filled range is `bg-primary`, and each thumb is
 * a rounded `bg-surface` token surface with the standard focus-visible ring; native `aria-invalid`
 * drives a danger ring on the thumbs. `disabled` reduces opacity and shows `cursor-not-allowed`
 * while the filled range survives. `forwardRef` forwards to the Root, full native prop spread, and
 * `cn()` merge (caller `className` wins) follow the recipe.
 *
 * Single value vs range come from ONE API with no extra prop: the thumb count is derived from the
 * resolved value array (`value ?? defaultValue ?? [min]`), so a single-entry value yields one thumb
 * and a two-entry value yields two thumbs with the filled range between them. Radix renders a thumb
 * per value entry, but only when the array has at least one entry - an empty (or non-array) value
 * would otherwise leave a track with no thumb and no `role="slider"`, so we normalize to at least
 * one thumb (`[min]`) here to keep the visuals and the ARIA in agreement.
 */
export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, value, defaultValue, min = 0, max = 100, ...props }, ref) => {
  // For the uncontrolled path, normalize `defaultValue` to a non-empty array: Radix keys thumbs
  // off the array length, so an empty (or omitted) `defaultValue` would leave a track with no
  // thumb and no `role="slider"`. Falling back to `[min]` keeps a single thumb at the lower bound.
  const resolvedDefault =
    Array.isArray(defaultValue) && defaultValue.length > 0 ? defaultValue : [min];
  // Thumb count tracks whichever value array Radix actually renders: the controlled `value` (when
  // provided and non-empty) wins, otherwise the normalized default. This keeps the thumbs we emit
  // and the primitive's ARIA in agreement at the empty-array boundary.
  const resolved = Array.isArray(value) && value.length > 0 ? value : resolvedDefault;
  const thumbCount = resolved.length;

  // Radix spreads native props onto the Root span but forwards NONE of them to the thumbs - yet
  // the interactive element (the `role="slider"` thumb) is what assistive tech needs the invalid
  // flag and the accessible name on. So pull `aria-invalid` and the labelling attributes off the
  // native props and apply them to the thumb(s) ourselves; the Root keeps them too via the spread.
  const ariaInvalid = props['aria-invalid'];
  // A single-value slider has one interactive thumb, so the control's `aria-label` /
  // `aria-labelledby` names it directly. A range has two thumbs that each need a distinct name
  // (e.g. "minimum" / "maximum"), which the caller supplies per thumb via `getThumbProps`-style
  // wiring downstream - so we do NOT copy one shared name onto both, which would mislead.
  const singleThumb = thumbCount === 1;
  const thumbAriaLabel = singleThumb ? props['aria-label'] : undefined;
  const thumbAriaLabelledBy = singleThumb ? props['aria-labelledby'] : undefined;

  return (
    <SliderPrimitive.Root
      ref={ref}
      value={value}
      defaultValue={value === undefined ? resolvedDefault : undefined}
      min={min}
      max={max}
      className={cn(
        'relative flex w-full touch-none select-none items-center data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-muted data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2">
        <SliderPrimitive.Range className="absolute h-full bg-primary data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }, (_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-invalid={ariaInvalid}
          aria-label={thumbAriaLabel}
          aria-labelledby={thumbAriaLabelledBy}
          className="block h-5 w-5 rounded-full border border-border bg-surface shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset aria-invalid:ring-2 aria-invalid:ring-danger"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = 'Slider';
