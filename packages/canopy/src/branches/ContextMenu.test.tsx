import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './ContextMenu';

// Radix drives dismissal on Pointer Events and locks scroll; jsdom implements neither, so without
// these stubs `user.click`/positioning throws (no `hasPointerCapture`) and scroll measurement
// throws (no `scrollIntoView`). Stubbing them lets the real Radix interaction run under jsdom - the
// standard Radix-in-jsdom workaround (mirrors the Dialog/Select tests).
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

/**
 * Radix opens the menu on the platform `contextmenu` event (right-click / long-press). jsdom's
 * userEvent has no dedicated contextmenu gesture, so we fire the native event on the trigger - the
 * observable outcome (the `menu` role appears) is what the spec guards.
 */
function openMenu(target: Element) {
  fireEvent.contextMenu(target);
}

function Basic({
  onSelect,
  disabledSelect,
}: {
  onSelect?: () => void;
  disabledSelect?: () => void;
}) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>Right-click region</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Actions</ContextMenuLabel>
        <ContextMenuItem onSelect={onSelect}>Copy</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled onSelect={disabledSelect}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

describe('ContextMenu', () => {
  it('opens on the contextmenu event and renders a role="menu"', () => {
    render(<Basic />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    openMenu(screen.getByText('Right-click region'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('exposes menuitem roles for its items', () => {
    render(<Basic />);
    openMenu(screen.getByText('Right-click region'));

    expect(screen.getByRole('menuitem', { name: 'Copy' })).toBeInTheDocument();
  });

  it('fires the item handler and closes when an item is selected', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic onSelect={onSelect} />);
    openMenu(screen.getByText('Right-click region'));

    await user.click(screen.getByRole('menuitem', { name: 'Copy' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on Escape', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    openMenu(screen.getByText('Right-click region'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on an outside click', async () => {
    render(<Basic />);
    openMenu(screen.getByText('Right-click region'));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    // Radix's DismissableLayer closes on a primary-button pointerdown outside the content. The open
    // menu is modal (it aria-hides + blocks pointer events on the rest of the page), so we dispatch
    // the dismiss gesture on the document body directly. `button: 0` matters: a secondary-button
    // (right-click) pointerdown is the open gesture, not the dismiss one. The outside listener
    // attaches after the open commits, so we let focus land in the content first.
    await waitFor(() => expect(screen.getByRole('menu').contains(document.activeElement)).toBe(true));
    fireEvent.pointerDown(document.body, { button: 0 });
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('leaves a disabled item inert (no handler, aria-disabled)', async () => {
    const onSelect = vi.fn();
    const disabledSelect = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic onSelect={onSelect} disabledSelect={disabledSelect} />);
    openMenu(screen.getByText('Right-click region'));

    const disabled = screen.getByRole('menuitem', { name: 'Delete' });
    expect(disabled).toHaveAttribute('data-disabled');
    await user.click(disabled);
    expect(disabledSelect).not.toHaveBeenCalled();
    // Menu stays open: a disabled item does not select/dismiss.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('supports keyboard navigation (arrow + enter selects)', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<Basic onSelect={onSelect} />);
    openMenu(screen.getByText('Right-click region'));

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitem', { name: 'Copy' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('toggles a CheckboxItem and exposes menuitemcheckbox', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    function CheckboxMenu() {
      const [checked, setChecked] = useState(false);
      return (
        <ContextMenu>
          <ContextMenuTrigger>region</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
              Show grid
            </ContextMenuCheckboxItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    render(<CheckboxMenu />);
    openMenu(screen.getByText('region'));

    const item = screen.getByRole('menuitemcheckbox', { name: 'Show grid' });
    expect(item).toHaveAttribute('aria-checked', 'false');
    await user.click(item);

    openMenu(screen.getByText('region'));
    await waitFor(() =>
      expect(screen.getByRole('menuitemcheckbox', { name: 'Show grid' })).toHaveAttribute(
        'aria-checked',
        'true',
      ),
    );
  });

  it('selects a RadioItem and exposes menuitemradio updating the group', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    function RadioMenu() {
      const [value, setValue] = useState('list');
      return (
        <ContextMenu>
          <ContextMenuTrigger>region</ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuRadioGroup value={value} onValueChange={setValue}>
              <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
              <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    render(<RadioMenu />);
    openMenu(screen.getByText('region'));

    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await user.click(screen.getByRole('menuitemradio', { name: 'Grid' }));

    openMenu(screen.getByText('region'));
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

  it('opens a submenu and reaches its items', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <ContextMenu>
        <ContextMenuTrigger>region</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuSub>
            <ContextMenuSubTrigger>More tools</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuItem onSelect={onSelect}>Inspect</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>,
    );
    openMenu(screen.getByText('region'));

    const subTrigger = screen.getByRole('menuitem', { name: 'More tools' });
    expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');

    // Focus the sub-trigger and enter the submenu with ArrowRight (the APG submenu gesture).
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Inspect' })).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('menuitem', { name: 'Inspect' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('merges a caller className over the default on Content (cn: caller wins)', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>region</ContextMenuTrigger>
        <ContextMenuContent className="min-w-[20rem]">
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    openMenu(screen.getByText('region'));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('min-w-[20rem]');
    expect(menu).not.toHaveClass('min-w-[8rem]');
    // Non-conflicting base tokens survive.
    expect(menu).toHaveClass('bg-surface-raised', 'border', 'shadow-md');
  });

  it('merges a caller className over the default on Item (cn: caller wins)', () => {
    render(
      <ContextMenu>
        <ContextMenuTrigger>region</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem className="text-danger">Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    openMenu(screen.getByText('region'));

    const item = screen.getByRole('menuitem', { name: 'Copy' });
    expect(item).toHaveClass('text-danger');
    expect(item).not.toHaveClass('text-text');
    expect(item).toHaveClass('focus:bg-muted-raised');
  });

  it('forwards a ref to the Content element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ContextMenu>
        <ContextMenuTrigger>region</ContextMenuTrigger>
        <ContextMenuContent ref={ref}>
          <ContextMenuItem>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    openMenu(screen.getByText('region'));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('menu'));
  });

  it('forwards a ref to an Item element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ContextMenu>
        <ContextMenuTrigger>region</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem ref={ref}>Copy</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>,
    );
    openMenu(screen.getByText('region'));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('menuitem', { name: 'Copy' }));
  });
});
