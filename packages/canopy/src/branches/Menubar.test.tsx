import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from './Menubar';

// Radix Menubar drives its menus on Pointer Events; jsdom implements neither pointer capture nor
// scrollIntoView, so without these stubs `user.click` / keyboard interactions throw. Stubbing them
// lets the real Radix interaction run under jsdom - the standard Radix-in-jsdom workaround (mirrors
// the Dialog / Select tests).
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function Basic() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New Tab</MenubarItem>
          <MenubarItem>Open</MenubarItem>
          <MenubarSeparator />
          <MenubarItem>
            Save <MenubarShortcut>Ctrl+S</MenubarShortcut>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo</MenubarItem>
          <MenubarItem>Redo</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

describe('Menubar', () => {
  it('renders a menubar role with its top-level menuitem triggers', () => {
    render(<Basic />);
    expect(screen.getByRole('menubar')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'File' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('opens a menu on trigger click and renders its items', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'File' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /New Tab/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Open/ })).toBeInTheDocument();
  });

  it('sets aria-haspopup and aria-expanded on a trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    const file = screen.getByRole('menuitem', { name: 'File' });
    expect(file).toHaveAttribute('aria-haspopup', 'menu');
    expect(file).toHaveAttribute('aria-expanded', 'false');

    await user.click(file);
    await waitFor(() => expect(file).toHaveAttribute('aria-expanded', 'true'));
  });

  it('moves between triggers with Left/Right arrow keys (roving focus)', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    const file = screen.getByRole('menuitem', { name: 'File' });
    file.focus();
    expect(document.activeElement).toBe(file);

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Edit' }));

    await user.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(file);
  });

  it('operates items with Up/Down/Enter after opening a menu', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem onSelect={onSelect}>New Tab</MenubarItem>
            <MenubarItem>Open</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    // A pointer-opened menu focuses the content container; ArrowDown moves to the first item, and
    // Enter selects it. (Down then Enter is the observable keyboard operation the spec promises.)
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'New Tab' })),
    );
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('closes an open menu on Escape', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('toggles a MenubarCheckboxItem (uncontrolled)', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem defaultChecked={false} onCheckedChange={onCheckedChange}>
              Show Toolbar
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show Toolbar' });
    expect(item).toHaveAttribute('aria-checked', 'false');

    // Focus the item (ArrowDown from the pointer-opened content) then toggle it with Enter. With
    // no controlled `checked`, Radix owns the state; the observable proof it toggled is the
    // reported next value (true) - the uncontrolled item flips itself on select.
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toBe(item));
    await user.keyboard('{Enter}');
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles a MenubarCheckboxItem (controlled)', async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();

    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarCheckboxItem
                checked={checked}
                onCheckedChange={(v) => {
                  onCheckedChange(v);
                  setChecked(Boolean(v));
                }}
              >
                Show Toolbar
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    }

    render(<Controlled />);
    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    expect(screen.getByRole('menuitemcheckbox', { name: 'Show Toolbar' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await user.click(screen.getByRole('menuitemcheckbox', { name: 'Show Toolbar' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);

    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    await waitFor(() =>
      expect(screen.getByRole('menuitemcheckbox', { name: 'Show Toolbar' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
  });

  it('selects a MenubarRadioItem within its group', async () => {
    const user = userEvent.setup();

    function RadioBar() {
      const [value, setValue] = useState('list');
      return (
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarRadioGroup value={value} onValueChange={setValue}>
                <MenubarRadioItem value="list">List</MenubarRadioItem>
                <MenubarRadioItem value="grid">Grid</MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      );
    }

    render(<RadioBar />);
    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Grid' })).toHaveAttribute(
      'aria-checked',
      'false',
    );

    await user.click(screen.getByRole('menuitemradio', { name: 'Grid' }));
    await user.click(screen.getByRole('menuitem', { name: 'View' }));
    await waitFor(() =>
      expect(screen.getByRole('menuitemradio', { name: 'Grid' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('leaves a disabled item inert (no onSelect)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem disabled onSelect={onSelect}>
              Print
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    const disabled = screen.getByRole('menuitem', { name: 'Print' });
    expect(disabled).toHaveAttribute('data-disabled');

    await user.click(disabled);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('opens a sub-menu from its sub-trigger and renders its items', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>Share</MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>Email link</MenubarItem>
                <MenubarItem>Copy link</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    const subTrigger = screen.getByRole('menuitem', { name: /Share/ });
    expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');

    // ArrowDown focuses the sub-trigger (the first item), then ArrowRight opens its sub-menu.
    await user.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.activeElement).toBe(subTrigger));
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Email link' })).toBeInTheDocument(),
    );
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('merges a caller className over the default on Menubar (cn)', () => {
    render(
      <Menubar className="bg-surface-raised" data-testid="bar">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );

    const bar = screen.getByTestId('bar');
    // tailwind-merge de-dupes the conflicting background: the caller's token wins.
    expect(bar).toHaveClass('bg-surface-raised');
    expect(bar).not.toHaveClass('bg-surface');
    // Non-conflicting base classes are preserved.
    expect(bar).toHaveClass('border', 'rounded-md');
  });

  it('merges a caller className over the default on MenubarContent (cn)', async () => {
    const user = userEvent.setup();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent className="min-w-[20rem]">
            <MenubarItem>New Tab</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>,
    );

    await user.click(screen.getByRole('menuitem', { name: 'File' }));
    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('min-w-[20rem]');
    expect(menu).not.toHaveClass('min-w-[12rem]');
    expect(menu).toHaveClass('bg-surface-raised', 'border', 'shadow-md');
  });

  it('forwards a ref to the underlying menubar element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Menubar ref={ref}>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('menubar'));
  });

  it('forwards a ref to a trigger element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger ref={ref}>File</MenubarTrigger>
        </MenubarMenu>
      </Menubar>,
    );

    expect(ref.current).toBe(screen.getByRole('menuitem', { name: 'File' }));
  });
});
