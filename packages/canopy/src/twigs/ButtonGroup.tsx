import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * buttonGroupVariants - the cva recipe that maps `orientation` x `separator` onto canopy
 * semantic-token Tailwind utilities (spec 0043). It follows the 0005 recipe: every class string is
 * a FULL LITERAL so Tailwind v4's source scanner emits each utility - never build a class name
 * dynamically (no `flex-${dir}`, no `rounded-${side}`). There is no `dark:` on the common path;
 * light/dark flips through the token layer (spec 0004).
 *
 * The segmented look is produced entirely by first/last/adjacent child selectors on the container,
 * so the child `Button`s (0005) stay completely untouched and any variant/size drops in unchanged:
 * - flush neighbours: a negative margin on the shared edge overlaps the doubled borders so they
 *   read as one `border-border` seam (`-ml-px` horizontal / `-mt-px` vertical on every child after
 *   the first);
 * - outer radii only: the leading child keeps its start-side radius and the trailing child keeps
 *   its end-side radius while inner corners are squared - `rounded-l-md` / `rounded-r-md` for a row
 *   (rotated to `rounded-t-md` / `rounded-b-md` for a column), with everything else `rounded-none`;
 * - `separator` swaps the flush-seam overlap for a hairline `border-border` divider between
 *   segments (the shared edge is drawn instead of collapsed) - see below.
 *
 * `isolate` + `hover:z-10` / `focus-visible:z-10` lift the active/hovered segment above its
 * neighbours so its full border and focus ring are never clipped by the overlap.
 */
export const buttonGroupVariants = cva('inline-flex isolate [&>*]:relative', {
  variants: {
    orientation: {
      horizontal:
        'flex-row [&>*]:rounded-none [&>*:not(:first-child)]:-ml-px [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md [&>*:hover]:z-10 [&>*:focus-visible]:z-10',
      vertical:
        'flex-col [&>*]:rounded-none [&>*:not(:first-child)]:-mt-px [&>*:first-child]:rounded-t-md [&>*:last-child]:rounded-b-md [&>*:hover]:z-10 [&>*:focus-visible]:z-10',
    },
    separator: {
      // A hairline `border-border` divider on the leading edge of every segment after the first.
      // The segments still overlap (the base `-ml-px` / `-mt-px` collapses the doubled seam) so the
      // divider reads as one crisp token line between neighbours.
      horizontal: '[&>*:not(:first-child)]:border-l [&>*:not(:first-child)]:border-l-border',
      vertical: '[&>*:not(:first-child)]:border-t [&>*:not(:first-child)]:border-t-border',
      none: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    separator: 'none',
  },
});

export interface ButtonGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'>,
    Omit<VariantProps<typeof buttonGroupVariants>, 'separator'> {
  /**
   * Lay the segments in a row (`horizontal`, default) or stack them in a column (`vertical`); the
   * joined-radii / shared-seam direction rotates to match.
   */
  orientation?: 'horizontal' | 'vertical';
  /**
   * Opt in to a thin, presentational `border-border` divider between segments (`aria-hidden` -
   * purely visual, it does not break the `role="group"` grouping) for cases where a flush seam is
   * not enough contrast.
   */
  separator?: boolean;
}

/**
 * ButtonGroup - the segmented-cluster Twig (spec 0043). It COMPOSES 2+ canopy `Button` (0005)
 * children into one flush, joined-radius control - toolbars, split actions, view-mode switchers -
 * following the 0020/0005 recipe: cva `orientation` variants of full literal semantic-token
 * utilities, `cn()` merge (caller `className` wins), `forwardRef` + a full native `<div>` prop
 * spread. It is purely presentational: it holds no state, fires no events, and adds no
 * roving-tabindex (each child `Button` stays independently tabbable with its own label, order, and
 * `disabled` semantics - correct for an action group, as distinct from a single-select toggle
 * group, which is a separate Branch out of scope here).
 *
 * The container carries `role="group"` and REQUIRES an accessible name (`aria-label` or
 * `aria-labelledby`) so assistive tech announces the cluster as one labelled control. It assumes
 * its direct children are the segments (the joined styling targets `> *`).
 */
export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, orientation = 'horizontal', separator = false, ...props }, ref) => {
    // Derive the separator variant from the boolean AND the orientation so the divider is drawn on
    // the correct (leading) edge for a row vs a column. Computed here, resolved to a literal by cva.
    const separatorVariant = separator ? orientation : 'none';
    return (
      <div
        ref={ref}
        role="group"
        className={cn(buttonGroupVariants({ orientation, separator: separatorVariant }), className)}
        {...props}
      />
    );
  },
);
ButtonGroup.displayName = 'ButtonGroup';
