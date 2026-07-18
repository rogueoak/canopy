import type { Meta, StoryObj } from '@storybook/react';
import { useEffect, useState } from 'react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@rogueoak/canopy/branches';
import { Keyboard } from '@rogueoak/canopy/seeds';

/**
 * Branches/Command - the command-palette Branch (spec 0066), built on `cmdk` (the filterable
 * listbox primitive canopy already vendors) and, for its Cmd+K overlay, on the `Dialog` Branch
 * (spec 0034). It renders a search `CommandInput`, a scrollable `CommandList`, a no-results
 * `CommandEmpty`, grouped `CommandGroup`s, selectable `CommandItem`s, a `CommandSeparator`, and a
 * trailing `CommandShortcut` for per-item key hints. `CommandDialog` mounts a `Command` inside a
 * `Dialog` for the standard Cmd+K overlay.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled `CommandDialog` - re-themes via the token layer (spec 0004). Filtering
 * is client-side over the rendered items (async / remote is a follow-up, spec 0066 Out of scope).
 * `Combobox` (0030) consumes these same `Command` parts internally.
 */
const meta = {
  title: 'Branches/Command',
  component: Command,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ---------------------------------------------------------------- Playground */

/**
 * The inline palette: a `Command` rendered directly on the page (not in a dialog) as an embedded
 * filterable list. Type to narrow the list; an empty filter shows `CommandEmpty`.
 */
export const Playground: Story = {
  render: () => (
    <Command className="w-80 rounded-md border border-border shadow-md">
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandItem value="new-file">New file</CommandItem>
        <CommandItem value="open-file">Open file</CommandItem>
        <CommandItem value="save">Save</CommandItem>
        <CommandItem value="settings">Settings</CommandItem>
      </CommandList>
    </Command>
  ),
};

/* --------------------------------------------------------------------- Dialog */

/**
 * The Cmd+K overlay: `CommandDialog` is a controlled `Dialog` (`open` / `onOpenChange`); the app
 * owns the keydown listener that flips it (a built-in shortcut hook is deferred, spec 0066 Out).
 * Press Cmd/Ctrl+K to open, Escape to close.
 */
export const Dialog: Story = {
  render: () => {
    const Demo = () => {
      const [open, setOpen] = useState(false);
      useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            setOpen((value) => !value);
          }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
      }, []);
      return (
        <div className="flex flex-col items-center gap-2 text-sm text-text-muted">
          <p>
            Press <Keyboard>Cmd</Keyboard> + <Keyboard>K</Keyboard> to open the palette.
          </p>
          <CommandDialog open={open} onOpenChange={setOpen} title="Command palette">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandItem value="profile">Profile</CommandItem>
              <CommandItem value="billing">Billing</CommandItem>
              <CommandItem value="settings">Settings</CommandItem>
            </CommandList>
          </CommandDialog>
        </div>
      );
    };
    return <Demo />;
  },
};

/* -------------------------------------------------------------------- Grouped */

/**
 * Grouped items with `CommandGroup` headings and a `CommandSeparator` rule between groups.
 */
export const Grouped: Story = {
  render: () => (
    <Command className="w-80 rounded-md border border-border shadow-md">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem value="calendar">Calendar</CommandItem>
          <CommandItem value="search-emoji">Search emoji</CommandItem>
          <CommandItem value="calculator">Calculator</CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings">
          <CommandItem value="profile">Profile</CommandItem>
          <CommandItem value="billing">Billing</CommandItem>
          <CommandItem value="settings">Settings</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/* -------------------------------------------------------------- WithShortcuts */

/**
 * Per-item key hints with `CommandShortcut`, rendering `Keyboard` (0021) key-caps at the trailing
 * edge of each item.
 */
export const WithShortcuts: Story = {
  render: () => (
    <Command className="w-80 rounded-md border border-border shadow-md">
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem value="new-file">
            New file
            <CommandShortcut>
              <Keyboard size="sm">Cmd</Keyboard>
              <Keyboard size="sm">N</Keyboard>
            </CommandShortcut>
          </CommandItem>
          <CommandItem value="open">
            Open
            <CommandShortcut>
              <Keyboard size="sm">Cmd</Keyboard>
              <Keyboard size="sm">O</Keyboard>
            </CommandShortcut>
          </CommandItem>
          <CommandItem value="save">
            Save
            <CommandShortcut>
              <Keyboard size="sm">Cmd</Keyboard>
              <Keyboard size="sm">S</Keyboard>
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  ),
};

/* ---------------------------------------------------------------------- Empty */

/**
 * The no-results state: with a filter that matches nothing, the `CommandEmpty` slot shows in place
 * of the list.
 */
export const Empty: Story = {
  render: () => (
    <Command className="w-80 rounded-md border border-border shadow-md">
      <CommandInput placeholder="Search..." value="zzzzz" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandItem value="apple">Apple</CommandItem>
        <CommandItem value="banana">Banana</CommandItem>
      </CommandList>
    </Command>
  ),
};
