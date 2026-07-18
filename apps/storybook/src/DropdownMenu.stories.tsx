import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/DropdownMenu - the canopy actions-menu Branch (spec 0054), built on
 * `@radix-ui/react-dropdown-menu`. A Branch owns interaction state and a portal: Radix supplies the
 * open/close state machine, the `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` roles,
 * roving focus + keyboard navigation, typeahead, controlled + uncontrolled state, and submenu
 * positioning, while the surface is the raised-surface pattern (`bg-surface-raised` + `border` + the
 * primitive `shadow-md`) and item highlight uses `bg-muted-raised`.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled content - re-themes via the token layer (spec 0004). The trigger composes
 * a canopy Button Seed via `asChild` (no nested buttons).
 */
const meta = {
  title: 'Branches/DropdownMenu',
  component: DropdownMenu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof DropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ Playground */

/** A Button trigger opening a menu of plain actions, with a label, separator, and a disabled row. */
export const Playground: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/* --------------------------------------------------------------- CheckboxItems */

/** Checkbox items toggle a leading check and stay open on activate (controlled state). */
function CheckboxMenu() {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">View options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Canvas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
          Show grid
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
          Show rulers
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showGuides} onCheckedChange={setShowGuides}>
          Show guides
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const CheckboxItems: Story = {
  render: () => <CheckboxMenu />,
};

/* ------------------------------------------------------------------ RadioGroup */

/** A radio group selects exactly one option, showing a leading dot for the current choice. */
function RadioMenu() {
  const [density, setDensity] = useState('comfortable');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Density</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Row density</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={density} onValueChange={setDensity}>
          <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="spacious">Spacious</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const RadioGroup: Story = {
  render: () => <RadioMenu />,
};

/* --------------------------------------------------------------------- Submenu */

/** A nested submenu opens on hover or right-arrow from its SubTrigger. */
export const Submenu: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Share</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Copy link</DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Invite people</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem>Email</DropdownMenuItem>
            <DropdownMenuItem>Message</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>More options...</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Manage access</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/* ---------------------------------------------------------------- WithShortcuts */

/** Items with trailing keyboard-shortcut hints via DropdownMenuShortcut. */
export const WithShortcuts: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          Undo
          <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Redo
          <DropdownMenuShortcut>Ctrl+Y</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          Cut
          <DropdownMenuShortcut>Ctrl+X</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Copy
          <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Paste
          <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};

/* --------------------------------------------------------------- DisabledItems */

/** Disabled items render inert (dimmed, not activatable) and are skipped by keyboard navigation. */
export const DisabledItems: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Row actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Open</DropdownMenuItem>
        <DropdownMenuItem disabled>Rename</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>Duplicate</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
};
