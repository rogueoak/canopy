import type { Meta, StoryObj } from '@storybook/react';
import { Keyboard } from '@rogueoak/canopy/seeds';

/**
 * Seeds/Keyboard - a small, presentational element that renders a keyboard key (`⌘`, `Esc`,
 * `Ctrl`) for help text, command menus, and tooltips (spec 0019).
 *
 * Display-only: it carries no key-binding logic. Compose multiple `Keyboard` for a combo. There
 * is NO per-story theme code: toggle the toolbar Light / Dark control and every story re-themes
 * via the token layer (spec 0004) - the proof the key cap reads in both themes.
 */
const meta = {
  title: 'Seeds/Keyboard',
  component: Keyboard,
  parameters: { layout: 'centered' },
  args: { children: '⌘' },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['sm', 'md'],
    },
  },
} satisfies Meta<typeof Keyboard>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

export const Playground: Story = {};

/* ---------------------------------------------------------------- Single key */

export const SingleKeys: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Keyboard>⌘</Keyboard>
      <Keyboard>Esc</Keyboard>
      <Keyboard>Ctrl</Keyboard>
    </div>
  ),
};

/* ---------------------------------------------------------------------- Combo */

/**
 * A combo is composed from multiple `Keyboard` with a separator between them - the component
 * itself stays display-only.
 */
export const Combo: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="text-text flex items-center gap-1.5">
      <Keyboard>⌘</Keyboard>
      <span>+</span>
      <Keyboard>K</Keyboard>
    </div>
  ),
};

/* ---------------------------------------------------------------------- Sizes */

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <div className="flex items-center gap-3">
      <Keyboard size="sm">⌘</Keyboard>
      <Keyboard size="md">⌘</Keyboard>
    </div>
  ),
};

/* ------------------------------------------------------------- Inline in text */

/**
 * `Keyboard` sits inline within running text - `align-middle` keeps the cap vertically centred
 * against the surrounding copy at the default `md` size.
 */
export const InlineInText: Story = {
  parameters: { controls: { disable: true } },
  render: () => (
    <p className="text-text max-w-sm text-sm">
      Press <Keyboard>⌘</Keyboard> <Keyboard>K</Keyboard> to open the command menu, or{' '}
      <Keyboard>Esc</Keyboard> to dismiss it.
    </p>
  ),
};
