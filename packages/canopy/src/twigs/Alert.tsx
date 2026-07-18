import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * alertVariants - the cva recipe that maps `variant` onto canopy semantic-token Tailwind
 * utilities (spec 0040). Alert is a static inline notice - a banner that sits in the page flow
 * and tells the user something now (a form-level error summary, a "changes saved" confirmation,
 * a deprecation warning, an informational callout). All class strings are FULL LITERALS so
 * Tailwind v4's source scanner emits each utility - never build a class name dynamically. There
 * is no `dark:` here: light/dark flips automatically through the token layer (spec 0004).
 *
 * The base carries the shared layout: a leading icon column (`[&>svg]` sizing on the caller's
 * icon slot, `shrink-0`) and a stacked title/description text column. Each variant maps to its
 * paired surface / `border` / `*-foreground` text, reusing the same status roles Badge (0008)
 * exercises: `default` is the neutral muted surface with a hairline border; `info` / `success` /
 * `warning` / `danger` are the solid status fills with their `*-foreground` text and a
 * transparent border (the fill carries on any surface, matching the Badge role idiom) so the
 * border box in the base layout stays consistent across variants.
 */
export const alertVariants = cva(
  'relative flex gap-3 rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-text',
        info: 'border-transparent bg-info text-info-foreground',
        success: 'border-transparent bg-success text-success-foreground',
        warning: 'border-transparent bg-warning text-warning-foreground',
        danger: 'border-transparent bg-danger text-danger-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Optional leading graphic rendered in the banner's start column. It is decorative and wrapped
   * in an `aria-hidden` span - the banner's meaning lives in the text (`AlertTitle` /
   * `AlertDescription`), never in the icon, so screen-reader users lose nothing when it is hidden.
   * When omitted the icon column is not rendered and the text column fills the banner. Callers
   * supply the node (canopy ships no icon library), matching the Breadcrumb chevron idiom.
   */
  icon?: React.ReactNode;
}

/**
 * Alert - the static inline notice banner (spec 0040). A presentational Twig with no state, no
 * timers, no portal, and no focus management - it stays where it is rendered, in the document
 * flow. Follows the 0005/0020 recipe: a `cva` mapping `variant` to full-literal semantic-token
 * utilities, `cn()` merge with the caller `className` winning, `forwardRef` + a full spread of
 * native `<div>` props. Themed entirely by the token layer - no `dark:` on the common path.
 *
 * Accessibility: defaults to `role="alert"` (an assertive live region) for urgent notices;
 * callers pass `role="status"` (polite) for passive confirmations, or any other role. The role
 * is a real, overridable native prop - the spread applies AFTER the default so a caller-provided
 * `role` wins - not a bespoke API.
 *
 * This is distinct from AlertDialog (0053, a modal, focus-trapping, portalled interruption) and
 * Toast (0058, a transient, auto-dismissing, portalled notification). Alert is neither: it is
 * purely presentational and static.
 */
export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon != null ? (
        <span aria-hidden className="shrink-0 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-col gap-1">{children}</div>
    </div>
  ),
);
Alert.displayName = 'Alert';

export type AlertTitleProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * AlertTitle - the banner's heading line: the `label` typography role at `font-medium` on the
 * default text token. Rendered as a `<div>` (not a heading element) so it never injects an
 * unpredictable heading level into the caller's document outline; callers who need a heading
 * level supply their own via children semantics or `className`. `forwardRef` + native prop spread.
 */
export const AlertTitle = React.forwardRef<HTMLDivElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-label font-medium text-text', className)} {...props} />
  ),
);
AlertTitle.displayName = 'AlertTitle';

export type AlertDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * AlertDescription - the supporting body text under the title: muted `body-sm` text. `forwardRef`
 * + native prop spread; no `dark:` - light/dark flips through the token layer.
 */
export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-text-muted text-body-sm', className)} {...props} />
  ),
);
AlertDescription.displayName = 'AlertDescription';
