import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox, Input, Label, RadioGroup, RadioGroupItem } from '@rogueoak/canopy/seeds';
import {
  FieldGroup,
  FieldSet,
  FieldSetDescription,
  FieldSetLegend,
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldLabel,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/FieldSet - the grouped-control sibling of FormField (spec 0048): FormField labels ONE
 * control, FieldSet labels a GROUP. It renders a native `<fieldset>` so the `<legend>` becomes the
 * accessible group label and setting `disabled` cascades the inert state to EVERY control inside it
 * for free - no per-child wiring. FieldSet owns the group caption and disabled cascade; the
 * children (RadioGroup 0016, Checkbox 0011, FormField 0020, ...) own their own wiring.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004) - the legend rides `text-text`, the description rides
 * `text-text-muted`, and a disabled set dims both through the shared disabled tokens.
 */
const meta = {
  title: 'Twigs/FieldSet',
  component: FieldSet,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FieldSet>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

/** A bordered group with a legend and a couple of controls stacked in a FieldGroup. */
export const Playground: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldSetLegend>Contact</FieldSetLegend>
      <FieldSetDescription>How should we reach you?</FieldSetDescription>
      <FieldGroup>
        <Input aria-label="Email" type="email" placeholder="you@example.com" />
        <Input aria-label="Phone" type="tel" placeholder="+1 555 0100" />
      </FieldGroup>
    </FieldSet>
  ),
};

/* --------------------------------------------------------------- RadioGroup */

/**
 * A single-choice group: the RadioGroup (0016) is the field, and the legend labels the whole set.
 * RadioGroup owns its own roving-tabindex keyboard model; FieldSet only supplies the caption.
 */
export const RadioGroupGroup: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldSetLegend>Subscription plan</FieldSetLegend>
      <FieldSetDescription>Pick the plan that fits your team.</FieldSetDescription>
      <RadioGroup defaultValue="pro" className="mt-1">
        <Label className="flex items-center gap-3">
          <RadioGroupItem value="free" />
          Free
        </Label>
        <Label className="flex items-center gap-3">
          <RadioGroupItem value="pro" />
          Pro
        </Label>
        <Label className="flex items-center gap-3">
          <RadioGroupItem value="team" />
          Team
        </Label>
      </RadioGroup>
    </FieldSet>
  ),
};

/* ----------------------------------------------------------- Checkbox group */

/** A multi-choice group: a block of Checkboxes (0011) sharing one legend. */
export const CheckboxGroup: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldSetLegend>Email notifications</FieldSetLegend>
      <FieldSetDescription>Choose which emails you want to receive.</FieldSetDescription>
      <FieldGroup>
        <Label className="flex items-center gap-3">
          <Checkbox defaultChecked />
          Product updates
        </Label>
        <Label className="flex items-center gap-3">
          <Checkbox />
          Weekly digest
        </Label>
        <Label className="flex items-center gap-3">
          <Checkbox defaultChecked />
          Security alerts
        </Label>
      </FieldGroup>
    </FieldSet>
  ),
};

/* ------------------------------------------------------- Grouped FormFields */

/**
 * FieldSet composes FormField (0020) unchanged: several FormFields belong together under one
 * caption. A `row` FieldGroup lays the two name fields side by side.
 */
export const GroupedFormFields: Story = {
  render: () => (
    <FieldSet className="w-96">
      <FieldSetLegend required>Shipping address</FieldSetLegend>
      <FieldSetDescription>Where should we send your order?</FieldSetDescription>
      <FieldGroup direction="row">
        <FormField className="flex-1">
          <FormFieldLabel>First name</FormFieldLabel>
          <FormFieldControl>
            <Input placeholder="Ada" />
          </FormFieldControl>
        </FormField>
        <FormField className="flex-1">
          <FormFieldLabel>Last name</FormFieldLabel>
          <FormFieldControl>
            <Input placeholder="Lovelace" />
          </FormFieldControl>
        </FormField>
      </FieldGroup>
      <FormField>
        <FormFieldLabel>Street</FormFieldLabel>
        <FormFieldControl>
          <Input placeholder="123 Analytical Engine Ave" />
        </FormFieldControl>
        <FormFieldDescription>Include apartment or suite number.</FormFieldDescription>
      </FormField>
    </FieldSet>
  ),
};

/* -------------------------------------------------------- With description */

/** The group help text is wired into the fieldset's `aria-describedby` only while it is rendered. */
export const WithDescription: Story = {
  render: () => (
    <FieldSet className="w-80">
      <FieldSetLegend>Two-factor authentication</FieldSetLegend>
      <FieldSetDescription>
        Add a second step to your sign-in for extra security.
      </FieldSetDescription>
      <FieldGroup>
        <Label className="flex items-center gap-3">
          <Checkbox />
          Authenticator app
        </Label>
        <Label className="flex items-center gap-3">
          <Checkbox />
          SMS text message
        </Label>
      </FieldGroup>
    </FieldSet>
  ),
};

/* ------------------------------------------------------------------ Disabled */

/**
 * The disabled cascade is the browser's: `disabled` on the FieldSet sets the native
 * `<fieldset>` attribute, so EVERY control inside goes inert with no per-child wiring, and the
 * legend + description dim through the shared disabled tokens.
 */
export const Disabled: Story = {
  render: () => (
    <FieldSet disabled className="w-80">
      <FieldSetLegend>Email notifications</FieldSetLegend>
      <FieldSetDescription>This group is currently unavailable.</FieldSetDescription>
      <FieldGroup>
        <Label className="flex items-center gap-3">
          <Checkbox defaultChecked />
          Product updates
        </Label>
        <Label className="flex items-center gap-3">
          <Checkbox />
          Weekly digest
        </Label>
        <Input aria-label="Reply-to address" placeholder="you@example.com" />
      </FieldGroup>
    </FieldSet>
  ),
};
