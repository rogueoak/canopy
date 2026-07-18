import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * Item - the generic row/list-item primitive Twig (spec 0042). It owns the horizontal
 * `[media] [title + description] [actions]` shape that every list, menu, settings row,
 * notification entry, or search result reuses, so those surfaces stop re-implementing the flex
 * layout, the icon/avatar column, the two-line text stack, and the trailing actions cluster from
 * scratch. `Card` (0022) is a padded vertical surface; `Item` is the compact horizontal row.
 *
 * Layer note: `Item` is a presentational compound with no interaction state and no portal, so it
 * is a Twig (composes a layout of parts via sibling elements, mirroring `Card`), not a Branch. It
 * needs no Radix behaviour primitive - only `@radix-ui/react-slot` (already a canopy dependency)
 * to power `asChild`. No new runtime dependency is introduced.
 *
 * The family follows the 0020 Twigs recipe: each part is a small `forwardRef` element that spreads
 * native props and merges `className` via `cn()`, with FULL LITERAL Tailwind class strings so
 * Tailwind v4's scanner emits each utility. Styled with SEMANTIC TOKENS ONLY - no palette, no
 * `dark:` on the common path - so light/dark flips through the token layer (spec 0004) exactly as
 * `Card` does.
 * - `Item` - the row container; `flex items-center gap-3` with padding, `rounded-lg`, and a
 *   cva-driven `variant` surface. When `asChild` is set it renders through `Slot` onto the caller's
 *   element (an `<a>`/`<button>`), gaining a `bg-muted-raised` hover affordance and the
 *   focus-visible ring so a clickable list row highlights and stays keyboard visible.
 * - `ItemMedia` - the leading icon/avatar column; `shrink-0` so it does not shrink when tight.
 * - `ItemContent` - the flexible middle column; `min-w-0 flex-1` so its text can truncate.
 * - `ItemTitle` - the primary line; `<div>` by default, `asChild` promotes it to a real heading.
 * - `ItemDescription` - the secondary line; clips to one line by default, overridable to wrap.
 * - `ItemActions` - the trailing cluster; `ml-auto shrink-0` pinned to the trailing edge.
 *
 * Accessibility is composed by the caller: `Item` carries no ARIA role by default (a plain row of
 * `<div>`s is presentational), `asChild` makes the row a real `<a>`/`<button>`, `ItemTitle asChild`
 * promotes the title to a heading, and a surrounding `<ul>`/`role="list"` gives the list structure.
 */
export const itemVariants = cva(
  // Base - shared by every variant. Layout + surface only; the clickable-row hover/focus affordance
  // is NOT here, because CSS `:hover` fires on a plain presentational `<div>` too and would falsely
  // signal clickability. It is appended in `Item` only on the `asChild` (interactive) path.
  'flex items-center gap-3 rounded-lg p-3 text-text transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-transparent',
        outline: 'border border-border bg-transparent',
        muted: 'bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

// The clickable-row affordance - a `bg-muted-raised` hover highlight and the focus-visible ring.
// Gated to the `asChild` (interactive `<a>`/`<button>`) path so a plain presentational `default`/
// `outline` row does NOT highlight on mouse-over as if it were clickable (spec 0042: this affordance
// belongs to the clickable row only).
const itemInteractiveClasses =
  'hover:bg-muted-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset';

export interface ItemProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof itemVariants> {
  /**
   * Render as the single child element instead of the default `<div>` (Radix `Slot`), merging the
   * row layout classes/props onto it. Use this to make the whole row a real `<a>`/`<button>` - the
   * common "clickable list row" case - so it becomes focusable and keyboard-activatable and gains
   * the row's `bg-muted-raised` hover affordance and focus-visible ring, without `Item` owning any
   * interaction state itself. Keep the child a real interactive element.
   */
  asChild?: boolean;
}

/**
 * Item - the row container. Renders a `<div>` by default, or the single child via `asChild`
 * (Radix `Slot`) so the whole row becomes a link/button. `variant` selects the surface treatment
 * (`default` transparent, `outline` bordered, `muted` filled) via cva; layout is consistent across
 * variants. Forwards `ref` and spreads native props.
 */
export const Item = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(itemVariants({ variant }), asChild && itemInteractiveClasses, className)}
        {...props}
      />
    );
  },
);
Item.displayName = 'Item';

export type ItemMediaProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * ItemMedia - the leading icon/avatar column. A `flex shrink-0 items-center justify-center` cell
 * that holds an `Avatar` or a Lucide icon and does NOT shrink when the row is tight, so the media
 * stays at the row's leading edge.
 */
export const ItemMedia = React.forwardRef<HTMLDivElement, ItemMediaProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex shrink-0 items-center justify-center', className)}
      {...props}
    />
  ),
);
ItemMedia.displayName = 'ItemMedia';

export type ItemContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * ItemContent - the flexible middle column. `flex min-w-0 flex-1 flex-col` with a small vertical
 * gap: it flexes to fill the row, and the `min-w-0` is what lets its `ItemDescription` truncate
 * inside the flex row instead of forcing the row wider.
 */
export const ItemContent = React.forwardRef<HTMLDivElement, ItemContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />
  ),
);
ItemContent.displayName = 'ItemContent';

export interface ItemTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Render as the single child element instead of the default `<div>` (Radix `Slot`), merging the
   * title classes/props onto it. Use this to promote the title to a real heading when the caller's
   * document outline needs one, e.g. `<ItemTitle asChild><h3>...</h3></ItemTitle>`. The heading
   * semantics live on the element you provide, so keep it a real heading element.
   */
  asChild?: boolean;
}

/**
 * ItemTitle - the primary line. Renders a `<div>` by default (presentational, since a list row is
 * often not a heading); pass `asChild` to promote it to a real heading element when the caller's
 * outline needs one. The `cn()` typography-role rule keeps both `text-label` and `text-text`.
 */
export const ItemTitle = React.forwardRef<HTMLDivElement, ItemTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return <Comp ref={ref} className={cn('text-label text-text', className)} {...props} />;
  },
);
ItemTitle.displayName = 'ItemTitle';

export type ItemDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * ItemDescription - the secondary line. Muted supporting text (`text-body-sm text-text-muted`)
 * that clips to one line by default. The clip is spelled out as its constituent utilities
 * (`overflow-hidden text-ellipsis whitespace-nowrap`) rather than the single `truncate` shorthand
 * so that a caller CAN actually override it via `className` and get a wrapping description: because
 * tailwind-merge treats `truncate` as one atomic group, a sibling `whitespace-normal` cannot undo
 * it, whereas the spelled-out form lets `whitespace-normal overflow-visible` win the relevant axes.
 */
export const ItemDescription = React.forwardRef<HTMLParagraphElement, ItemDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'overflow-hidden text-ellipsis whitespace-nowrap text-body-sm text-text-muted',
        className,
      )}
      {...props}
    />
  ),
);
ItemDescription.displayName = 'ItemDescription';

export type ItemActionsProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * ItemActions - the trailing cluster. `ml-auto flex shrink-0 items-center gap-2`: pinned to the
 * row's trailing edge (the `ml-auto` pushes it past the flexing content) and does not shrink, so
 * it holds `Button`/`Badge`/icon-button actions at the row's end.
 */
export const ItemActions = React.forwardRef<HTMLDivElement, ItemActionsProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('ml-auto flex shrink-0 items-center gap-2', className)}
      {...props}
    />
  ),
);
ItemActions.displayName = 'ItemActions';
