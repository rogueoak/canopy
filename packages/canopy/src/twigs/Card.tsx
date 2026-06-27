import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';

/**
 * Card - the surface container Twig (spec 0022), and the first Twig to exercise the
 * surface / elevation tokens at the molecule layer. A presentational compound that frames
 * related content on a raised surface, styled with semantic tokens only (no `dark:`, no new
 * token) - the raised surface themes through the token layer (spec 0004) exactly as the
 * portalled Seeds do (Select/Tooltip).
 *
 * The family follows the 0020 Twigs recipe: each part is a small `forwardRef` element that
 * spreads native props and merges `className` via `cn()`, with FULL LITERAL Tailwind class
 * strings so Tailwind v4's scanner emits each utility.
 * - `Card` - the container: `bg-surface-raised`, `border-border`, `rounded-lg`, the primitive
 *   `shadow-sm` (there is no semantic elevation token yet), and a vertical column structure.
 * - `CardHeader` - top region; padded, stacks `CardTitle` + `CardDescription` with a small gap.
 * - `CardTitle` - the card heading, rendered as a real heading element (default `<h3>`) with the
 *   `h3` typography role.
 * - `CardDescription` - muted supporting text (`text-text-muted`, `text-body-sm`).
 * - `CardContent` - the body region; padded with no top padding (the header owns the top inset).
 * - `CardFooter` - bottom region for actions; `flex items-center` with a gap, no top padding.
 *
 * The padding scale is a consistent `p-6` across header/content/footer (content and footer drop
 * their top padding to sit flush under the region above), so the slots align on a shared inset.
 */
export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col rounded-lg border border-border bg-surface-raised text-text shadow-sm',
      className,
    )}
    {...props}
  />
));
Card.displayName = 'Card';

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * CardHeader - the top region. Stacks the title and description in a column with a small gap,
 * and owns the top inset of the card (`p-6`).
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Render as the single child element instead of the default `<h3>` (Radix `Slot`), merging the
   * title classes/props onto it. Use this to fix the document outline level for the surrounding
   * context, e.g. `<CardTitle asChild><h2>...</h2></CardTitle>`. The heading semantics live on the
   * element you provide, so keep it a real heading element.
   */
  asChild?: boolean;
}

/**
 * CardTitle - the card heading. Renders a real `<h3>` by default (carrying the `h3` typography
 * role) so the card contributes to the document outline; pass `asChild` to swap in your own
 * heading element when a different level keeps the page outline correct.
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'h3';
    return <Comp ref={ref} className={cn('text-h3', className)} {...props} />;
  },
);
CardTitle.displayName = 'CardTitle';

export type CardDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * CardDescription - muted supporting text under the title, in the `body-sm` role on the muted
 * text token; no `dark:` - light/dark flips through the token layer.
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-text-muted text-body-sm', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * CardContent - the body region. Padded on the shared `p-6` inset but with NO top padding, so it
 * sits flush under a `CardHeader` (the header owns the top inset).
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * CardFooter - the bottom region for actions. Lays its children out in a row (`flex items-center`)
 * with a gap, on the shared `p-6` inset with no top padding so it sits flush under the content.
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-2 p-6 pt-0', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';
