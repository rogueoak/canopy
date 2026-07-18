import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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
} from './Command';

// cmdk scrolls the active item into view and Radix Dialog (used by CommandDialog) drives on
// Pointer Events; jsdom implements neither, so without these stubs keyboard nav and dialog
// interaction throw. Stubbing them lets the real cmdk + Radix interaction run - the standard
// workaround (mirrors the Combobox suite).
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function BasicPalette(props: { onSelect?: (value: string) => void }) {
  return (
    <Command>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandItem value="apple" onSelect={props.onSelect}>
          Apple
        </CommandItem>
        <CommandItem value="banana" onSelect={props.onSelect}>
          Banana
        </CommandItem>
        <CommandItem value="grape" onSelect={props.onSelect}>
          Grape
        </CommandItem>
      </CommandList>
    </Command>
  );
}

describe('Command (inline)', () => {
  it('renders the combobox input, listbox, and option roles', () => {
    render(<BasicPalette />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Grape' })).toBeInTheDocument();
  });

  it('renders on the raised-surface card', () => {
    const { container } = render(<BasicPalette />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass('bg-surface-raised', 'text-text');
  });

  it('filters the list as the user types', async () => {
    const user = userEvent.setup();
    render(<BasicPalette />);
    await user.type(screen.getByRole('combobox'), 'ban');
    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Apple' })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('option', { name: 'Banana' })).toBeInTheDocument();
  });

  it('shows the empty slot when nothing matches', async () => {
    const user = userEvent.setup();
    render(<BasicPalette />);
    await user.type(screen.getByRole('combobox'), 'zzz');
    expect(await screen.findByText('No results found.')).toBeInTheDocument();
  });

  it('fires onSelect when an item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicPalette onSelect={onSelect} />);
    await user.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onSelect).toHaveBeenCalledWith('banana');
  });

  it('fires onSelect on Enter after arrow navigation', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<BasicPalette onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    input.focus();
    // cmdk makes the first item active on mount; ArrowDown moves to the second, Enter selects it.
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith('banana');
  });

  it('renders a disabled item inert (data-disabled, no onSelect)', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Command>
        <CommandList>
          <CommandItem value="off" disabled onSelect={onSelect}>
            Disabled
          </CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole('option', { name: 'Disabled' });
    expect(item).toHaveAttribute('data-disabled', 'true');
    await user.click(item);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders a group heading and a separator', () => {
    render(
      <Command>
        <CommandList>
          <CommandGroup heading="Fruit">
            <CommandItem value="apple">Apple</CommandItem>
          </CommandGroup>
          <CommandSeparator data-testid="sep" />
          <CommandGroup heading="Veg">
            <CommandItem value="carrot">Carrot</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    expect(screen.getByText('Fruit')).toBeInTheDocument();
    expect(screen.getByText('Veg')).toBeInTheDocument();
    expect(screen.getByTestId('sep')).toHaveClass('bg-border');
  });

  it('CommandShortcut renders its hint and merges a caller className', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem value="new">
            New file
            <CommandShortcut className="custom-class">Ctrl+N</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>,
    );
    const hint = screen.getByText('Ctrl+N');
    expect(hint).toHaveClass('ml-auto', 'text-text-muted', 'custom-class');
  });

  it('merges a caller className over the item defaults (caller wins)', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem value="apple" className="px-10">
            Apple
          </CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole('option', { name: 'Apple' });
    expect(item).toHaveClass('px-10');
    expect(item).not.toHaveClass('px-2');
  });

  it('uses the raised-surface highlight token, not bg-muted', () => {
    render(
      <Command>
        <CommandList>
          <CommandItem value="apple">Apple</CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole('option', { name: 'Apple' });
    expect(item).toHaveClass('data-[selected=true]:bg-muted-raised');
    expect(item.className).not.toContain('data-[selected=true]:bg-muted ');
  });

  it('forwards refs to the root, input, list, and item', () => {
    const rootRef = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const listRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    render(
      <Command ref={rootRef}>
        <CommandInput ref={inputRef} />
        <CommandList ref={listRef}>
          <CommandItem ref={itemRef} value="apple">
            Apple
          </CommandItem>
        </CommandList>
      </Command>,
    );
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(itemRef.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CommandDialog', () => {
  function DialogHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open palette
        </button>
        <CommandDialog open={open} onOpenChange={setOpen} title="Actions">
          <CommandInput placeholder="Search actions..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandItem value="settings">Settings</CommandItem>
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  it('opens and closes via open/onOpenChange and focuses the input when open', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open palette' }));
    const input = await screen.findByRole('combobox');
    expect(input).toBeInTheDocument();
    await waitFor(() => expect(input).toHaveFocus());

    // The visually hidden title gives the overlay an accessible name.
    expect(screen.getByText('Actions')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  it('renders the palette items inside the overlay', async () => {
    const user = userEvent.setup();
    render(<DialogHarness />);
    await user.click(screen.getByRole('button', { name: 'Open palette' }));
    expect(await screen.findByRole('option', { name: 'Settings' })).toBeInTheDocument();
  });
});
