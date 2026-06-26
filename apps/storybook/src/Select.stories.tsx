import type { Meta, StoryObj } from '@storybook/react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@rogueoak/canopy/seeds';

/**
 * Seeds/Select — the single-choice dropdown Seed (spec 0013), built on
 * `@radix-ui/react-select`.
 *
 * Styled entirely with semantic-token utilities: the trigger mirrors the Input field
 * (`border-border` / `bg-surface` / `text-text`, the focus `ring`, the `disabled` pair, and
 * `aria-invalid:` danger overrides), and the portalled content sits on a raised-surface card
 * (`bg-surface-raised` + `border` + `shadow-md`). There is NO per-story theme code: toggle the
 * toolbar Light / Dark control and every story — including the portalled popup — re-themes via
 * the token layer (spec 0004).
 */
const meta = {
  title: 'Seeds/Select',
  component: Select,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

/* A reusable set of options for the examples. */
function Fruits() {
  return (
    <>
      <SelectItem value="apple">Apple</SelectItem>
      <SelectItem value="banana">Banana</SelectItem>
      <SelectItem value="blueberry">Blueberry</SelectItem>
      <SelectItem value="grape">Grape</SelectItem>
      <SelectItem value="pineapple">Pineapple</SelectItem>
    </>
  );
}

/* ----------------------------------------------------------------- Basic */

/**
 * A basic single-select: trigger with placeholder + a short option list. Open it with a click
 * or the keyboard (Space / Arrow keys), then type-ahead to jump to a match.
 */
export const Basic: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <Fruits />
      </SelectContent>
    </Select>
  ),
};

/* --------------------------------------------------------------- Invalid */

/**
 * The invalid state is the native `aria-invalid` attribute on the trigger (styled via the
 * `aria-invalid:` variant) — the danger ramp takes over the border and focus ring, exactly as
 * an invalid Input, keeping a11y and styling in lockstep.
 */
export const Invalid: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-invalid className="w-56">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <Fruits />
      </SelectContent>
    </Select>
  ),
};

/* -------------------------------------------------------------- Disabled */

/** A disabled Select: the trigger uses the `bg-disabled` / `text-disabled-foreground` pair and won't open. */
export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Pick a fruit" />
      </SelectTrigger>
      <SelectContent>
        <Fruits />
      </SelectContent>
    </Select>
  ),
};

/* ----------------------------------------------------------- With a Label */

/**
 * Paired with a canopy `Label` (spec 0007). The label's `htmlFor` points at the trigger's
 * `id`, associating the two for assistive tech and focusing the trigger when the label is
 * clicked. One option is `disabled` to show the dimmed item state.
 */
export const WithLabel: Story = {
  render: () => (
    <div className="flex w-56 flex-col gap-2">
      <Label htmlFor="fruit">Favourite fruit</Label>
      <Select>
        <SelectTrigger id="fruit">
          <SelectValue placeholder="Pick a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="blueberry" disabled>
            Blueberry (out of stock)
          </SelectItem>
          <SelectItem value="grape">Grape</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};
