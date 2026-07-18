import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';

/**
 * Empty - the zero-data placeholder Twig (spec 0041). A presentational composition for the
 * *empty-state* case that `Card` (0022), `Skeleton`, and `Spinner` (0017) do not cover: a list
 * with no rows, a search with no results, an inbox with nothing in it, a freshly created project.
 * It centres a small stack - an optional icon, a heading, a line of muted copy, and a call-to-action
 * row - so zero-data views stop drifting apart across surfaces.
 *
 * The family follows the 0005 recipe exactly, mirroring `Card`: each part is a small `forwardRef`
 * element that spreads native props and merges `className` via `cn()`, with FULL LITERAL Tailwind
 * class strings so Tailwind v4's scanner emits each utility. Styling uses semantic tokens only -
 * no `dark:` on the common path; light/dark flips through the token layer (spec 0004).
 * - `Empty` - the container: `flex flex-col items-center text-center` with a column gap and
 *   generous vertical padding (`py-12`) so the placeholder reads as intentional.
 * - `EmptyMedia` - the optional icon/illustration slot: `text-text-subtle` so the mark sits quietly
 *   above the title, `aria-hidden` by default (decorative), overridable, with `asChild` to wrap a
 *   caller-supplied element.
 * - `EmptyTitle` - the heading: default `<h3>` carrying the `h3` typography role on `text-text`,
 *   with `asChild` to set the outline level (identical idiom to `CardTitle`).
 * - `EmptyDescription` - muted supporting copy: a real `<p>` in the `body-sm` role on
 *   `text-text-muted`.
 * - `EmptyContent` - the actions row: `flex flex-wrap items-center justify-center gap-2` so one or
 *   two `Button`s centre and wrap on narrow widths.
 */
export type EmptyProps = React.HTMLAttributes<HTMLDivElement>;

export const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col items-center gap-2 py-12 text-center text-text', className)}
    {...props}
  />
));
Empty.displayName = 'Empty';

export interface EmptyMediaProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render as the single child element instead of the default `<div>` (Radix `Slot`), merging the
   * media classes/props onto it. Use this to wrap a caller-supplied icon component or SVG, e.g.
   * `<EmptyMedia asChild><InboxIcon /></EmptyMedia>`.
   */
  asChild?: boolean;
}

/**
 * EmptyMedia - the optional icon/illustration slot above the title. Rendered in the subtle text
 * token so the mark sits quietly, and `aria-hidden` by default (decorative - the heading and
 * description carry the meaning). The `aria-hidden` default is overridable by passing the attribute
 * explicitly. Pass `asChild` to wrap your own icon/SVG element.
 */
export const EmptyMedia = React.forwardRef<HTMLDivElement, EmptyMediaProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        aria-hidden
        className={cn('flex items-center justify-center text-text-subtle', className)}
        {...props}
      />
    );
  },
);
EmptyMedia.displayName = 'EmptyMedia';

export interface EmptyTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Render as the single child element instead of the default `<h3>` (Radix `Slot`), merging the
   * title classes/props onto it. Use this to fix the document outline level for the surrounding
   * context, e.g. `<EmptyTitle asChild><h2>...</h2></EmptyTitle>`. The heading semantics live on the
   * element you provide, so keep it a real heading element.
   */
  asChild?: boolean;
}

/**
 * EmptyTitle - the heading. Renders a real `<h3>` by default (carrying the `h3` typography role) on
 * `text-text` so the placeholder contributes to the document outline; pass `asChild` to swap in your
 * own heading element when a different level keeps the page outline correct (identical idiom to
 * `CardTitle`).
 */
export const EmptyTitle = React.forwardRef<HTMLHeadingElement, EmptyTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'h3';
    return <Comp ref={ref} className={cn('text-h3 text-text', className)} {...props} />;
  },
);
EmptyTitle.displayName = 'EmptyTitle';

export type EmptyDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * EmptyDescription - muted supporting text under the title, in the `body-sm` role on the muted text
 * token; no `dark:` - light/dark flips through the token layer.
 */
export const EmptyDescription = React.forwardRef<HTMLParagraphElement, EmptyDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-text-muted text-body-sm', className)} {...props} />
  ),
);
EmptyDescription.displayName = 'EmptyDescription';

export type EmptyContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * EmptyContent - the actions row. Lays its children out in a centred, wrapping row
 * (`flex flex-wrap items-center justify-center gap-2`) so one or two `Button`s centre under the copy
 * and wrap on narrow widths. A small top margin separates the actions from the description.
 */
export const EmptyContent = React.forwardRef<HTMLDivElement, EmptyContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-2 flex flex-wrap items-center justify-center gap-2', className)}
      {...props}
    />
  ),
);
EmptyContent.displayName = 'EmptyContent';
