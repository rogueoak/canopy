import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/ContextMenu - the canopy right-click menu Branch (spec 0055), built on
 * `@radix-ui/react-context-menu`. It is the pointer-triggered sibling of DropdownMenu: the same
 * canopy-styled menu part surface, but opened from the platform contextmenu event (right-click /
 * long-press) and anchored at the pointer. A Branch owns interaction state and a portal - Radix
 * supplies the contextmenu trigger, pointer-anchored positioning, portalling, roving focus,
 * type-ahead, submenu machinery, and the full menu / menuitem / menuitemcheckbox / menuitemradio
 * role set.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled content - re-themes via the token layer (spec 0004). Right-click each
 * story's dashed target region to open its menu.
 */
const meta = {
  title: 'Branches/ContextMenu',
  component: ContextMenu,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A dashed region prompting the reader to right-click. */
function Target({ children = 'Right-click here' }: { children?: React.ReactNode }) {
  return (
    <ContextMenuTrigger className="flex h-40 w-80 select-none items-center justify-center rounded-md border border-dashed border-border-strong bg-surface text-body-sm text-text-muted">
      {children}
    </ContextMenuTrigger>
  );
}

/* --------------------------------------------------------------------- Playground */

/** A target region that opens a basic action menu with a label, items, and a separator. */
export const Playground: Story = {
  render: () => (
    <ContextMenu>
      <Target />
      <ContextMenuContent>
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuItem>Back</ContextMenuItem>
        <ContextMenuItem>Forward</ContextMenuItem>
        <ContextMenuItem>Reload</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Save as...</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

/* ------------------------------------------------------------ WithIconsAndShortcuts */

function Icon({ path }: { path: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mr-2 h-4 w-4"
    >
      <path d={path} />
    </svg>
  );
}

/** Leading icons plus `ContextMenuShortcut` trailing keyboard hints. */
export const WithIconsAndShortcuts: Story = {
  render: () => (
    <ContextMenu>
      <Target />
      <ContextMenuContent>
        <ContextMenuItem>
          <Icon path="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9m0-18 6 6m-6-6v6h6" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Icon path="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          Paste
          <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>
          <Icon path="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

/* --------------------------------------------------------------------- CheckboxItems */

function CheckboxStory() {
  const [grid, setGrid] = useState(true);
  const [rulers, setRulers] = useState(false);

  return (
    <ContextMenu>
      <Target>Right-click for view options</Target>
      <ContextMenuContent>
        <ContextMenuLabel>View</ContextMenuLabel>
        <ContextMenuCheckboxItem checked={grid} onCheckedChange={setGrid}>
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem checked={rulers} onCheckedChange={setRulers}>
          Show rulers
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** `CheckboxItem` rows with a leading check indicator; each toggles independently. */
export const CheckboxItems: Story = {
  render: () => <CheckboxStory />,
};

/* ----------------------------------------------------------------------- RadioItems */

function RadioStory() {
  const [density, setDensity] = useState('comfortable');

  return (
    <ContextMenu>
      <Target>Right-click for density</Target>
      <ContextMenuContent>
        <ContextMenuLabel>Density</ContextMenuLabel>
        <ContextMenuRadioGroup value={density} onValueChange={setDensity}>
          <ContextMenuRadioItem value="compact">Compact</ContextMenuRadioItem>
          <ContextMenuRadioItem value="comfortable">Comfortable</ContextMenuRadioItem>
          <ContextMenuRadioItem value="spacious">Spacious</ContextMenuRadioItem>
        </ContextMenuRadioGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/** A `RadioGroup` of `RadioItem` rows - a single filled-dot selection at a time. */
export const RadioItems: Story = {
  render: () => <RadioStory />,
};

/* --------------------------------------------------------------------------- Submenu */

/** A nested submenu via `Sub` / `SubTrigger` / `SubContent` (opens on hover / right-arrow). */
export const Submenu: Story = {
  render: () => (
    <ContextMenu>
      <Target />
      <ContextMenuContent>
        <ContextMenuItem>Cut</ContextMenuItem>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email link</ContextMenuItem>
            <ContextMenuItem>Copy link</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Invite people</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Rename</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

/* --------------------------------------------------------------------- DisabledItems */

/** A disabled item is inert, muted, and skipped by keyboard focus. */
export const DisabledItems: Story = {
  render: () => (
    <ContextMenu>
      <Target />
      <ContextMenuContent>
        <ContextMenuItem>Open</ContextMenuItem>
        <ContextMenuItem disabled>Open in new tab (unavailable)</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuItem disabled>Move to... (unavailable)</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

/* --------------------------------------------------------------------------- OnCard */

/** The menu wired to a realistic card / row target - the natural direct-manipulation gesture. */
export const OnCard: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="w-80 select-none rounded-lg border border-border bg-surface-raised p-4 shadow-sm">
          <p className="text-label text-text">Q3 roadmap.pdf</p>
          <p className="text-caption text-text-muted">Updated 2 days ago - 1.4 MB</p>
          <p className="mt-3 text-caption text-text-subtle">Right-click this card for actions</p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuItem>Open</ContextMenuItem>
          <ContextMenuItem>Download</ContextMenuItem>
          <ContextMenuItem>Rename</ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem className="text-danger focus:text-danger">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
