import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../lib/cn';
import { Label } from '../seeds';

/**
 * FormFieldContextValue - the shared wiring every FormField part consumes (spec 0020). The root
 * owns the ids and the invalid/disabled state; Description and Message register their presence so
 * Control can compose `aria-describedby` and `aria-invalid` from what is ACTUALLY rendered.
 */
interface FormFieldContextValue {
  /** The control id (`React.useId`) - `FormFieldLabel`'s `htmlFor` and the Slot child's `id`. */
  id: string;
  /** `${id}-description` - `FormFieldDescription`'s id, added to describedby when rendered. */
  descriptionId: string;
  /** `${id}-message` - `FormFieldMessage`'s id, added to describedby when a message is rendered. */
  messageId: string;
  /** Whether the control is invalid (explicit `invalid` prop OR a non-empty message is rendered). */
  invalid: boolean;
  /** Whether the field is disabled - dims the label and disables the control. */
  disabled: boolean;
  /** Live flags: whether a Description / Message part is currently rendered (drives describedby). */
  hasDescription: boolean;
  hasMessage: boolean;
  setHasDescription: (present: boolean) => void;
  setHasMessage: (present: boolean) => void;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormFieldContext(component: string): FormFieldContextValue {
  const context = React.useContext(FormFieldContext);
  if (!context) {
    throw new Error(`<${component}> must be used within a <FormField>.`);
  }
  return context;
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Marks the field invalid: sets `aria-invalid` on the control (and lets the control's
   * `aria-invalid:` token styles take over). A rendered, non-empty `FormFieldMessage` ALSO makes
   * the control invalid, so an error message and the invalid affordance stay in lockstep.
   */
  invalid?: boolean;
  /** Disables the field: dims the `FormFieldLabel` and disables/dims the control. */
  disabled?: boolean;
}

/**
 * FormField - the root of the FormField Twig (spec 0020), and the reference for the Twigs
 * composition recipe: a compound component that COMPOSES Seeds and shares its wiring through a
 * small React context, styled with semantic tokens only (no `dark:`, no new token).
 *
 * Generates a stable base `id` (`React.useId`) and derives `${id}-description` / `${id}-message`,
 * then provides them plus `invalid` / `disabled` to the parts.
 *
 * describedby / invalid wiring decision (documented per spec): `aria-describedby` and
 * `aria-invalid` must reflect what is ACTUALLY in the DOM. `FormFieldDescription` and
 * `FormFieldMessage` register their presence via context setters in a mount/unmount effect;
 * `FormFieldControl` composes `aria-describedby` from only the registered parts (omitting ids
 * whose part is absent), and treats a registered (non-empty) message as making the control
 * invalid. This keeps the wiring driven by render output rather than by prop archaeology, and
 * settles deterministically after the mount effects flush (which React Testing Library's `render`
 * does inside `act`).
 */
export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, invalid = false, disabled = false, children, ...props }, ref) => {
    const id = React.useId();
    const descriptionId = `${id}-description`;
    const messageId = `${id}-message`;
    const [hasDescription, setHasDescription] = React.useState(false);
    const [hasMessage, setHasMessage] = React.useState(false);

    const value = React.useMemo<FormFieldContextValue>(
      () => ({
        id,
        descriptionId,
        messageId,
        invalid: invalid || hasMessage,
        disabled,
        hasDescription,
        hasMessage,
        setHasDescription,
        setHasMessage,
      }),
      [id, descriptionId, messageId, invalid, disabled, hasDescription, hasMessage],
    );

    return (
      <FormFieldContext.Provider value={value}>
        <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props}>
          {children}
        </div>
      </FormFieldContext.Provider>
    );
  },
);
FormField.displayName = 'FormField';

export type FormFieldLabelProps = React.ComponentPropsWithoutRef<typeof Label>;

/**
 * FormFieldLabel - wraps the Label Seed (spec 0007), reading the control `id` (for `htmlFor`) and
 * the `disabled` state from context. When the field is disabled the label dims to `text-text-muted`
 * with a `not-allowed` cursor and carries `data-disabled` for styling hooks - this is the
 * disabled-label affordance Label 0007 deferred to a FormField Twig. `required` passes straight
 * through to Label (rendering its danger `*` marker).
 */
export const FormFieldLabel = React.forwardRef<
  React.ComponentRef<typeof Label>,
  FormFieldLabelProps
>(({ className, ...props }, ref) => {
  const { id, disabled } = useFormFieldContext('FormFieldLabel');
  return (
    <Label
      ref={ref}
      htmlFor={id}
      data-disabled={disabled ? '' : undefined}
      className={cn(disabled && 'cursor-not-allowed text-text-muted', className)}
      {...props}
    />
  );
});
FormFieldLabel.displayName = 'FormFieldLabel';

export type FormFieldControlProps = React.HTMLAttributes<HTMLElement>;

/**
 * FormFieldControl - a Radix `Slot` that injects the field wiring onto its single control child
 * (Input, Textarea, Select trigger, Checkbox, etc.) without that Seed knowing about FormField. It
 * injects `id`, `aria-describedby` (only the ids whose part is rendered, space-joined, or
 * `undefined` when none), `aria-invalid` (when the field is invalid or a message is present), and
 * `disabled` (when the field is disabled) - so any Seed becomes a wired field via `asChild`-style
 * prop merging while keeping its own ref and props intact.
 */
export const FormFieldControl = React.forwardRef<HTMLElement, FormFieldControlProps>(
  ({ ...props }, ref) => {
    const { id, descriptionId, messageId, invalid, disabled, hasDescription, hasMessage } =
      useFormFieldContext('FormFieldControl');

    const describedBy =
      [hasDescription ? descriptionId : null, hasMessage ? messageId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    // `disabled` is not part of `HTMLAttributes`, but Slot forwards it to whatever control child
    // it wraps (Input / Checkbox / Select trigger), where it is a valid prop. Assemble the wiring
    // and assert the type so the inject type-checks without widening the public prop surface.
    const wiringProps = {
      id,
      'aria-describedby': describedBy,
      'aria-invalid': invalid || undefined,
      disabled: disabled || undefined,
    } as React.HTMLAttributes<HTMLElement>;

    return <Slot ref={ref} {...wiringProps} {...props} />;
  },
);
FormFieldControl.displayName = 'FormFieldControl';

export type FormFieldDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * FormFieldDescription - muted help text carrying `${id}-description`. Registers its presence so
 * `FormFieldControl` adds the id to `aria-describedby`. Styled with the `body-sm` role on the
 * muted text token; no `dark:` - light/dark flips through the token layer.
 */
export const FormFieldDescription = React.forwardRef<
  HTMLParagraphElement,
  FormFieldDescriptionProps
>(({ className, ...props }, ref) => {
  const { descriptionId, setHasDescription } = useFormFieldContext('FormFieldDescription');
  React.useEffect(() => {
    setHasDescription(true);
    return () => setHasDescription(false);
  }, [setHasDescription]);
  return (
    <p
      ref={ref}
      id={descriptionId}
      className={cn('text-text-muted text-body-sm', className)}
      {...props}
    />
  );
});
FormFieldDescription.displayName = 'FormFieldDescription';

export type FormFieldMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * FormFieldMessage - the error/validation message in the `danger` role, carrying `${id}-message`
 * and `role="alert"` so assistive tech announces it. Renders `null` when it has no children, so an
 * empty message adds nothing to the DOM and never pollutes `aria-describedby`; rendering a non-empty
 * message also registers the field as invalid (via context).
 */
export const FormFieldMessage = React.forwardRef<HTMLParagraphElement, FormFieldMessageProps>(
  ({ className, children, ...props }, ref) => {
    const { messageId, setHasMessage } = useFormFieldContext('FormFieldMessage');
    const hasContent = children != null && children !== false && children !== '';

    React.useEffect(() => {
      setHasMessage(hasContent);
      return () => setHasMessage(false);
    }, [setHasMessage, hasContent]);

    if (!hasContent) {
      return null;
    }

    return (
      <p
        ref={ref}
        id={messageId}
        role="alert"
        className={cn('text-danger text-body-sm', className)}
        {...props}
      >
        {children}
      </p>
    );
  },
);
FormFieldMessage.displayName = 'FormFieldMessage';
