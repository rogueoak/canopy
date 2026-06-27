import type { Meta, StoryObj } from '@storybook/react';
import {
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rogueoak/canopy/seeds';
import {
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldLabel,
  FormFieldMessage,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/FormField - the first Twig (spec 0020) and the reference for the Twigs composition
 * recipe: a compound component that COMPOSES Seeds and shares its wiring through a small React
 * context. The root generates the ids and owns the invalid / disabled state; the parts wire
 * `htmlFor` / `id`, `aria-describedby` (description + message ids, only those present), and
 * `aria-invalid` onto whatever single control Seed `FormFieldControl` wraps.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004) - description text rides `text-text-muted`, the
 * message rides `text-danger`, and the disabled field dims through the same tokens.
 */
const meta = {
  title: 'Twigs/FormField',
  component: FormField,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- With Input */

/**
 * The canonical field: Label + Input + help text. The description id is wired into the Input's
 * `aria-describedby`, and clicking the label focuses the input (Radix Label via `htmlFor`).
 */
export const WithInput: Story = {
  render: () => (
    <FormField className="w-72">
      <FormFieldLabel>Email address</FormFieldLabel>
      <FormFieldControl>
        <Input type="email" placeholder="you@example.com" />
      </FormFieldControl>
      <FormFieldDescription>We never share your email.</FormFieldDescription>
    </FormField>
  ),
};

/* --------------------------------------------------------------- With Select */

/**
 * Any focusable control Seed works through the `Slot`: here `FormFieldControl` wires the Select
 * trigger (the trigger gets the `id` and `aria-describedby`), leaving the portalled content alone.
 */
export const WithSelect: Story = {
  render: () => (
    <FormField className="w-72">
      <FormFieldLabel>Favourite fruit</FormFieldLabel>
      <Select>
        <FormFieldControl>
          <SelectTrigger>
            <SelectValue placeholder="Pick a fruit" />
          </SelectTrigger>
        </FormFieldControl>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
        </SelectContent>
      </Select>
      <FormFieldDescription>Used to tailor your recommendations.</FormFieldDescription>
    </FormField>
  ),
};

/* ------------------------------------------------------------- With Checkbox */

/**
 * A boolean field: the control sits inline beside its label (the root flips to a row). The
 * Checkbox still receives the wired `id`, so clicking the label toggles it.
 */
export const WithCheckbox: Story = {
  render: () => (
    <FormField className="w-72 flex-row items-center gap-3">
      <FormFieldControl>
        <Checkbox />
      </FormFieldControl>
      <FormFieldLabel>Accept the terms and conditions</FormFieldLabel>
    </FormField>
  ),
};

/* ------------------------------------------------------------------ Required */

/** A required field: `required` on the label renders the danger `*` marker. */
export const Required: Story = {
  render: () => (
    <FormField className="w-72">
      <FormFieldLabel required>Full name</FormFieldLabel>
      <FormFieldControl>
        <Input placeholder="Ada Lovelace" />
      </FormFieldControl>
    </FormField>
  ),
};

/* --------------------------------------------------------------- With error */

/**
 * A field in error: rendering a non-empty `FormFieldMessage` sets `aria-invalid` on the control
 * (the Input's `aria-invalid:` danger ramp takes over its border + ring) and wires the message id
 * into `aria-describedby`. The message carries `role="alert"` so it is announced.
 */
export const WithError: Story = {
  render: () => (
    <FormField className="w-72">
      <FormFieldLabel required>Email address</FormFieldLabel>
      <FormFieldControl>
        <Input type="email" defaultValue="not-an-email" />
      </FormFieldControl>
      <FormFieldMessage>Enter a valid email address.</FormFieldMessage>
    </FormField>
  ),
};

/* ------------------------------------------------------------------ Disabled */

/** A disabled field: `disabled` dims the label (the affordance Label 0007 deferred) AND the control. */
export const Disabled: Story = {
  render: () => (
    <FormField disabled className="w-72">
      <FormFieldLabel>Email address</FormFieldLabel>
      <FormFieldControl>
        <Input type="email" placeholder="you@example.com" />
      </FormFieldControl>
      <FormFieldDescription>This field is currently unavailable.</FormFieldDescription>
    </FormField>
  ),
};
