import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Menubar - the canopy application menu-bar Branch (spec 0056), built on
 * `@radix-ui/react-menubar`. A Branch owns interaction state and a portal: Radix supplies roving
 * focus across the triggers, the open-sibling-on-hover behaviour, the portalled menu / sub-menu
 * content, and the `menubar` / `menu` / `menuitem` / `menuitemcheckbox` / `menuitemradio` ARIA
 * contract, while the surface is the established raised-surface pattern (`bg-surface-raised` +
 * `border` + the primitive `shadow-md`) with the RAISED `bg-muted-raised` item highlight.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled menu content - re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/Menubar',
  component: Menubar,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Menubar>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ Playground */

/** A full File / Edit / View bar - the canonical desktop-app menu strip. */
export const Playground: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            New Tab <MenubarShortcut>Ctrl+T</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            New Window <MenubarShortcut>Ctrl+N</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Open...</MenubarItem>
          <MenubarItem>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>Ctrl+Y</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Cut</MenubarItem>
          <MenubarItem>Copy</MenubarItem>
          <MenubarItem>Paste</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Zoom In</MenubarItem>
          <MenubarItem>Zoom Out</MenubarItem>
          <MenubarItem>Reset Zoom</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/* --------------------------------------------------------------- CheckboxItems */

/** Checkbox items render a leading check when on; state is managed by Radix (here uncontrolled). */
export const CheckboxItems: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>Panels</MenubarLabel>
          <MenubarCheckboxItem defaultChecked>Show Toolbar</MenubarCheckboxItem>
          <MenubarCheckboxItem>Show Status Bar</MenubarCheckboxItem>
          <MenubarCheckboxItem defaultChecked>Show Sidebar</MenubarCheckboxItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/* ------------------------------------------------------------------ RadioGroup */

/** A radio group inside a menu - a single choice with a leading dot on the selected item. */
function RadioGroupBar() {
  const [profile, setProfile] = useState('list');
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Layout</MenubarTrigger>
        <MenubarContent>
          <MenubarLabel>View mode</MenubarLabel>
          <MenubarRadioGroup value={profile} onValueChange={setProfile}>
            <MenubarRadioItem value="list">List</MenubarRadioItem>
            <MenubarRadioItem value="grid">Grid</MenubarRadioItem>
            <MenubarRadioItem value="columns">Columns</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export const RadioGroup: Story = {
  render: () => <RadioGroupBar />,
};

/* --------------------------------------------------------------------- SubMenu */

/** A nested sub-menu: `Share` opens a portalled sub-content alongside its parent menu. */
export const SubMenu: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Open...</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Share</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>Email link</MenubarItem>
              <MenubarItem>Copy link</MenubarItem>
              <MenubarSeparator />
              <MenubarItem>Export as PDF</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarItem>Print</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/* --------------------------------------------------------------- DisabledItems */

/** A disabled item is muted and inert - keyboard navigation skips it and it does not select. */
export const DisabledItems: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New Tab</MenubarItem>
          <MenubarItem disabled>Save (nothing to save)</MenubarItem>
          <MenubarSeparator />
          <MenubarItem disabled>Print</MenubarItem>
          <MenubarItem>Close</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};

/* --------------------------------------------------------------- WithShortcuts */

/** Every command carries a right-aligned muted keyboard hint via `MenubarShortcut`. */
export const WithShortcuts: Story = {
  render: () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            Undo <MenubarShortcut>Ctrl+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Redo <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Cut <MenubarShortcut>Ctrl+X</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Copy <MenubarShortcut>Ctrl+C</MenubarShortcut>
          </MenubarItem>
          <MenubarItem>
            Paste <MenubarShortcut>Ctrl+V</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  ),
};
