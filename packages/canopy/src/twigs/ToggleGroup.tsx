import * as React from 'react';
import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group';
import { type VariantProps } from 'class-variance-authority';
import { toggleVariants } from '../seeds/Toggle';
import { cn } from '../lib/cn';

/**
 * ToggleGroupContext - carries the root's `variant` / `size` down to every `ToggleGroupItem`
 * (spec 0049). A `ToggleGroup` sets the recipe once and each item reads it here (falling back to
 * its own props), so the whole bar stays visually uniform while an individual member can still
 * override locally. Defaulted to the Toggle (0039) defaults so a bare item still renders correctly.
 */
const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants>>({
  variant: 'default',
  size: 'md',
});

export type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>;

/**
 * ToggleGroup - the canopy segmented multi-toggle Twig (spec 0049). It COMPOSES the `Toggle` (0039)
 * atom's `toggleVariants` recipe across a set of members wired together as one control: a text
 * alignment picker (`type="single"`, radiogroup-like) or a formatting bar (`type="multiple"`,
 * several on at once). Built on `@radix-ui/react-toggle-group`, so Radix owns the `single` /
 * `multiple` selection logic, the controlled (`value` + `onValueChange`) and uncontrolled
 * (`defaultValue`) APIs, the roving-tabindex keyboard model (one tab stop; `Arrow` keys move between
 * items), and the grouping ARIA (radiogroup semantics for single, group for multiple).
 *
 * The root shares `variant` / `size` to items through {@link ToggleGroupContext} and paints the
 * joined segmented row (`inline-flex`, outer corners rounded via the item join classes). `isolate`
 * on the root opens a local stacking context so the item `hover:z-10` / `focus-visible:z-10` /
 * `data-[state=on]:z-10` lifts resolve within the bar and never raise a segment above unrelated page
 * chrome (mirrors the `ButtonGroup` idiom). Styled with
 * the 0005 recipe: FULL LITERAL semantic-token utilities, `cn()` merge (caller `className` wins),
 * `forwardRef` + a full native prop spread. No `dark:` on the common path - light/dark flips through
 * the token layer (spec 0004).
 */
export const ToggleGroup = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('inline-flex items-center isolate', className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = 'ToggleGroup';

export type ToggleGroupItemProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Item
> &
  VariantProps<typeof toggleVariants>;

/**
 * ToggleGroupItem - one member of a {@link ToggleGroup} (spec 0049). It reads `variant` / `size`
 * from context (falling back to its own props for a locally overridden member) and applies the
 * exact `toggleVariants` recipe reused from `Toggle` (0039), so a grouped item is visually identical
 * to a lone Toggle. On top it adds the segment-join classes - FULL LITERAL token utilities - that
 * butt neighbours together into one bar: a shared border seam (`-ml-px` overlaps the doubled
 * borders), squared inner corners with only the outer corners rounded (`rounded-none`, leading
 * `rounded-l-md`, trailing `rounded-r-md`), and `hover:z-10` / `focus-visible:z-10` so the active
 * segment's border and focus ring are never clipped by the overlap.
 *
 * Radix's `data-state="on"` / `"off"` drives the pressed fill (same tokens as Toggle), each member
 * is a real `button` operable with `Enter` / `Space`, and a disabled group or disabled item renders
 * inert. `cn()` merges the caller `className` last (caller wins) and native props spread through.
 */
export const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, variant, size, children, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: variant ?? context.variant,
          size: size ?? context.size,
        }),
        'relative rounded-none first:rounded-l-md last:rounded-r-md [&:not(:first-child)]:-ml-px hover:z-10 focus-visible:z-10 data-[state=on]:z-10',
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = 'ToggleGroupItem';
