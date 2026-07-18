import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

/**
 * FieldSetContextValue - the shared wiring every FieldSet part consumes (spec 0048). The root owns
 * the base id and the group `disabled` state; `FieldSetDescription` registers its presence so the
 * root can point `aria-describedby` at a node that is ACTUALLY rendered (the same render-driven
 * wiring FormField 0020 uses). `disabled` is read by the legend/description so they dim in step
 * with the browser's native `fieldset[disabled]` cascade.
 */
interface FieldSetContextValue {
  /** Base id (`React.useId`) the description id is derived from. */
  id: string;
  /** `${id}-description` - `FieldSetDescription`'s id, added to describedby when rendered. */
  descriptionId: string;
  /** Whether the group is disabled - dims the legend/description; the cascade itself is native. */
  disabled: boolean;
  /** Live flag: whether a `FieldSetDescription` is currently rendered (drives describedby). */
  hasDescription: boolean;
  setHasDescription: (present: boolean) => void;
}

const FieldSetContext = React.createContext<FieldSetContextValue | null>(null);

function useFieldSetContext(component: string): FieldSetContextValue {
  const context = React.useContext(FieldSetContext);
  if (!context) {
    throw new Error(`<${component}> must be used within a <FieldSet>.`);
  }
  return context;
}

export interface FieldSetProps extends React.FieldsetHTMLAttributes<HTMLFieldSetElement> {
  /**
   * Disables the whole group: spread as the native `disabled` attribute on the `<fieldset>`, which
   * the browser cascades to EVERY descendant form control (they go inert) - no per-child wiring.
   * Also provided to the parts via context so the legend and description dim to match.
   */
  disabled?: boolean;
}

/**
 * FieldSet - the root of the FieldSet Twig (spec 0048), the grouped-control sibling of FormField
 * (0020): FormField labels ONE control, FieldSet labels a GROUP. It renders a native `<fieldset>`
 * so the browser gives us two things for free - the `<legend>` becomes the accessible group label
 * (assistive tech announces it when focus enters any control in the group), and setting `disabled`
 * on the `<fieldset>` cascades the inert state to every descendant form control with no per-child
 * prop injection.
 *
 * Generates a stable base `id` (`React.useId`), derives `${id}-description`, and provides
 * `{ disabled, descriptionId, hasDescription, setHasDescription }` via `FieldSetContext`. Spreads
 * native props including `disabled` onto the `<fieldset>` (so the cascade is the browser's, not
 * ours), and sets `aria-describedby` to the description id only when a `FieldSetDescription` is
 * actually rendered - so `aria-describedby` never points at an absent node. Styled with full
 * literal semantic-token utilities (bordered group container, `text-text`), no `dark:` on the
 * common path - light/dark flips through the token layer (spec 0004).
 */
export const FieldSet = React.forwardRef<HTMLFieldSetElement, FieldSetProps>(
  ({ className, disabled = false, children, ...props }, ref) => {
    const id = React.useId();
    const descriptionId = `${id}-description`;
    const [hasDescription, setHasDescription] = React.useState(false);

    const value = React.useMemo<FieldSetContextValue>(
      () => ({ id, descriptionId, disabled, hasDescription, setHasDescription }),
      [id, descriptionId, disabled, hasDescription],
    );

    return (
      <FieldSetContext.Provider value={value}>
        <fieldset
          ref={ref}
          disabled={disabled || undefined}
          aria-describedby={hasDescription ? descriptionId : undefined}
          className={cn(
            'flex min-w-0 flex-col gap-4 rounded-md border border-border p-4 text-text',
            className,
          )}
          {...props}
        >
          {children}
        </fieldset>
      </FieldSetContext.Provider>
    );
  },
);
FieldSet.displayName = 'FieldSet';

export interface FieldSetLegendProps extends React.HTMLAttributes<HTMLLegendElement> {
  /**
   * When `true`, renders a trailing danger-coloured `*` after the legend text to mark the group as
   * required, reusing the Label (0007) / FormFieldLabel marker idiom. The asterisk is `aria-hidden`
   * so it is purely visual and stays out of the group's accessible name - the marker is
   * presentational (spec 0048 leaves requiredness enforcement to the controls).
   */
  required?: boolean;
}

/**
 * FieldSetLegend - wraps the native `<legend>`; the accessible group label. Styled with the `label`
 * typography role on `text-text`, dimming to `text-text-muted` with a `cursor-not-allowed` hook and
 * a `data-disabled` styling attribute when the set is disabled (mirrors FormFieldLabel's disabled
 * affordance so a disabled FieldSet reads identically to a disabled FormField). Reads `disabled`
 * from context; supports the optional `required` marker.
 */
export const FieldSetLegend = React.forwardRef<HTMLLegendElement, FieldSetLegendProps>(
  ({ className, children, required = false, ...props }, ref) => {
    const { disabled } = useFieldSetContext('FieldSetLegend');
    return (
      <legend
        ref={ref}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          'text-label text-text select-none',
          disabled && 'cursor-not-allowed text-text-muted',
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {' *'}
          </span>
        )}
      </legend>
    );
  },
);
FieldSetLegend.displayName = 'FieldSetLegend';

export type FieldSetDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * FieldSetDescription - muted group help text carrying `${id}-description`. Registers its presence
 * via the context setter (mount/unmount effect) so `FieldSet` adds the id to `aria-describedby` only
 * while it is rendered. Stays `text-text-muted` when the group is disabled - the same muted token
 * the legend dims to, so legend + description dim in step (FormFieldDescription 0020, which this
 * mirrors, likewise stays muted when its FormField is disabled). Adds a `cursor-not-allowed` hook
 * and a `data-disabled` styling attribute when disabled. Same `text-text-muted text-body-sm` role as
 * FormFieldDescription (0020); no `dark:` - light/dark flips through the token layer.
 */
export const FieldSetDescription = React.forwardRef<HTMLParagraphElement, FieldSetDescriptionProps>(
  ({ className, ...props }, ref) => {
    const { descriptionId, disabled, setHasDescription } =
      useFieldSetContext('FieldSetDescription');
    React.useEffect(() => {
      setHasDescription(true);
      return () => setHasDescription(false);
    }, [setHasDescription]);
    return (
      <p
        ref={ref}
        id={descriptionId}
        data-disabled={disabled ? '' : undefined}
        className={cn(
          'text-text-muted text-body-sm',
          disabled && 'cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
  },
);
FieldSetDescription.displayName = 'FieldSetDescription';

export const fieldGroupVariants = cva('flex min-w-0', {
  variants: {
    direction: {
      column: 'flex-col gap-3',
      row: 'flex-row flex-wrap items-center gap-4',
    },
  },
  defaultVariants: {
    direction: 'column',
  },
});

export interface FieldGroupProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof fieldGroupVariants> {}

/**
 * FieldGroup - the layout part: a `flex` container that arranges the grouped controls with a
 * consistent gap so callers do not re-invent the spacing each time. `cva` maps `direction`
 * (`column` default / `row`) to full literal token classes - no state, pure layout. Must be used
 * within a `<FieldSet>` (context guard), matching the other parts. `forwardRef`, `cn()` merge
 * (caller wins), and native prop spread follow the 0005 recipe.
 */
export const FieldGroup = React.forwardRef<HTMLDivElement, FieldGroupProps>(
  ({ className, direction, ...props }, ref) => {
    // Guard so the part is not used bare - keeps the family's usage contract uniform even though
    // FieldGroup itself reads no context value.
    useFieldSetContext('FieldGroup');
    return (
      <div ref={ref} className={cn(fieldGroupVariants({ direction }), className)} {...props} />
    );
  },
);
FieldGroup.displayName = 'FieldGroup';
