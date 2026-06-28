import type { Meta, StoryObj } from '@storybook/react';
import { Label } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Label - the form-field label Seed (spec 0007).
 *
 * Built on `@radix-ui/react-label`: an `htmlFor` pointing at a control's `id` associates the
 * two for assistive tech AND focuses that control when the label is clicked. Styled with the
 * semantic typography `label` role (`text-label font-medium text-text`) - no per-story theme
 * code: toggle the toolbar Light / Dark control and every story re-themes via the token layer.
 *
 * Canopy's Input ships in a separate spec (0006); these stories pair Label with a plain native
 * `<input>` styled inline with semantic-token utilities so the examples read in both themes.
 */
const meta = {
  title: 'Seeds/Label',
  component: Label,
  parameters: { layout: 'centered' },
  args: { children: 'Email address' },
  argTypes: {
    required: { control: 'boolean' },
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A minimal native input styled with semantic tokens (canopy Input lands in spec 0006). */
function NativeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="h-10 w-64 rounded-md border border-border bg-surface px-3 text-sm text-text placeholder:text-text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset"
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ---------------------------------------------------------------- Standalone */

export const Standalone: Story = {
  parameters: { controls: { disable: true } },
  render: () => <Label>Email address</Label>,
};

/* ------------------------------------------------------------------ Required */

/**
 * `required` renders a trailing danger-coloured `*`. The asterisk is `aria-hidden`, so it is
 * purely visual and never pollutes the paired control's accessible name.
 */
export const Required: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <Label htmlFor="required-field" required>
      Email address
    </Label>
  ),
};

/* -------------------------------------------------------- Paired with input */

/**
 * Paired with a control via `htmlFor` → `id`. Click the label text and the input focuses
 * (Radix Label behaviour). Try it with the Light / Dark toolbar toggle.
 */
export const PairedWithInput: Story = {
  name: 'Paired (htmlFor)',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email address</Label>
      <NativeInput id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

/**
 * The same association, but the field is required - Label's `*` next to a `required` input.
 */
export const PairedRequired: Story = {
  name: 'Paired + required',
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email-required" required>
        Email address
      </Label>
      <NativeInput id="email-required" type="email" required placeholder="you@example.com" />
    </div>
  ),
};
