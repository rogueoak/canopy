import type { Meta, StoryObj } from '@storybook/react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/InputGroup - the field-composition Twig (spec 0044): one bordered box with the focus ring
 * and the invalid state on the GROUP, and leading/trailing addons (icon, text, or button) sitting
 * flush inside it. It composes the Input and Button Seeds - no new dependency - and generalizes the
 * SearchBar layout (see the AsSearchBar story).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes through the token layer (spec 0004) - the muted addons, the ghost button, and the
 * danger/disabled states all ride semantic tokens.
 */
const meta = {
  title: 'Twigs/InputGroup',
  component: InputGroup,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A leading search magnifier that inherits `currentColor` from the muted addon. */
function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Playground: a leading `$` prefix and a trailing `.00` suffix around an amount field. */
export const Playground: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="start">$</InputGroupAddon>
      <InputGroupInput aria-label="Amount" placeholder="0" inputMode="decimal" />
      <InputGroupAddon align="end">.00</InputGroupAddon>
    </InputGroup>
  ),
};

/** Leading icon: a decorative magnifier affix before the field. */
export const LeadingIcon: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput aria-label="Search" placeholder="Search..." />
    </InputGroup>
  ),
};

/** Prefix: a leading text addon (`https://`) before a URL field. */
export const Prefix: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="start">https://</InputGroupAddon>
      <InputGroupInput aria-label="Website" placeholder="example" />
    </InputGroup>
  ),
};

/** Suffix: a trailing text addon (a units suffix) after the field. */
export const Suffix: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="Weight" placeholder="0" inputMode="decimal" />
      <InputGroupAddon align="end">kg</InputGroupAddon>
    </InputGroup>
  ),
};

/** Trailing button: a flush "Copy" action `<button>` inside the group. */
export const TrailingButton: Story = {
  render: () => (
    <InputGroup>
      <InputGroupInput aria-label="API key" defaultValue="sk-1234567890" readOnly />
      <InputGroupButton>Copy</InputGroupButton>
    </InputGroup>
  ),
};

/** Both ends: a leading text prefix and a trailing action button around one field. */
export const BothEnds: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="start">@</InputGroupAddon>
      <InputGroupInput aria-label="Handle" placeholder="handle" />
      <InputGroupButton>Go</InputGroupButton>
    </InputGroup>
  ),
};

/** Sizes: `sm` / `md` / `lg` matching Input heights. */
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <InputGroup size="sm">
        <InputGroupAddon align="start">$</InputGroupAddon>
        <InputGroupInput aria-label="Small amount" placeholder="sm" />
      </InputGroup>
      <InputGroup size="md">
        <InputGroupAddon align="start">$</InputGroupAddon>
        <InputGroupInput aria-label="Medium amount" placeholder="md" />
      </InputGroup>
      <InputGroup size="lg">
        <InputGroupAddon align="start">$</InputGroupAddon>
        <InputGroupInput aria-label="Large amount" placeholder="lg" />
      </InputGroup>
    </div>
  ),
};

/** Disabled: the whole group dims through the token layer and the input is inert. */
export const Disabled: Story = {
  render: () => (
    <InputGroup disabled>
      <InputGroupAddon align="start">$</InputGroupAddon>
      <InputGroupInput aria-label="Amount" defaultValue="100" />
      <InputGroupButton>Go</InputGroupButton>
    </InputGroup>
  ),
};

/** Invalid: `aria-invalid` on the group paints the danger border/ring and reaches the input. */
export const Invalid: Story = {
  render: () => (
    <InputGroup aria-invalid>
      <InputGroupAddon align="start">$</InputGroupAddon>
      <InputGroupInput aria-label="Amount" defaultValue="-5" />
    </InputGroup>
  ),
};

/**
 * AsSearchBar: the SearchBar layout rebuilt from InputGroup parts - a leading magnifier and a
 * trailing action - to show that InputGroup generalizes the search-input pattern.
 */
export const AsSearchBar: Story = {
  render: () => (
    <InputGroup>
      <InputGroupAddon align="start">
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput type="search" aria-label="Search" placeholder="Search..." />
      <InputGroupButton>Search</InputGroupButton>
    </InputGroup>
  ),
};
