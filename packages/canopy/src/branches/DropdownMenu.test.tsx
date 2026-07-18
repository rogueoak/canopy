import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
} from './DropdownMenu';

// Radix DropdownMenu drives interaction on Pointer Events and measures scroll; jsdom implements
// neither, so without these stubs `user.click` throws (no `hasPointerCapture`) and Radix's scroll
// handling throws (no `scrollIntoView`). Stubbing them lets the real Radix interaction run under
// jsdom - the standard Radix-in-jsdom workaround (mirrors the Dialog / Select tests).
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

function Basic({ onSelect }: { onSelect?: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onSelect}>Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled onSelect={onSelect}>
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem>
          Delete
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('opens from its trigger and renders a role="menu" with its items', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  });

  it('fires an item handler and closes the menu on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('menuitem', { name: 'Edit' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('leaves a disabled item inert (no handler, keeps aria-disabled)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    expect(archive).toHaveAttribute('aria-disabled', 'true');

    await user.click(archive);
    expect(onSelect).not.toHaveBeenCalled();
    // Disabled activation must not close the menu.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('navigates items with the arrow keys, activates with Enter, and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);

    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await user.click(trigger);

    // First ArrowDown highlights the first enabled item (Edit); the disabled Archive is skipped.
    await user.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute(
        'data-highlighted',
        '',
      ),
    );

    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    const trigger = screen.getByRole('button', { name: 'Open menu' });
    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('renders a checkbox item with the menuitemcheckbox role, fires onCheckedChange, and stays open', async () => {
    // Radix's CheckboxItem is not self-toggling (it has no uncontrolled `checked` store): the
    // observable contract for an unlifted item is the emitted `onCheckedChange` + that the menu
    // stays open on activate (the wrapper preventDefaults close-on-select).
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem onCheckedChange={onCheckedChange}>
            Show grid
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show grid' });
    expect(item).toHaveAttribute('aria-checked', 'false');

    await user.click(item);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    // Checkbox items stay open on activate.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('drives a controlled checkbox item via checked / onCheckedChange', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [checked, setChecked] = useState(false);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={checked} onCheckedChange={setChecked}>
              Show grid
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const item = screen.getByRole('menuitemcheckbox', { name: 'Show grid' });
    expect(item).toHaveAttribute('aria-checked', 'false');

    await user.click(item);
    expect(
      screen.getByRole('menuitemcheckbox', { name: 'Show grid' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('marks exactly one radio item checked from the group value, with menuitemradio roles', async () => {
    // Radix's MenuRadioGroup is controlled by `value` only (no `defaultValue`): a static `value`
    // renders exactly one selected item and the correct `menuitemradio` roles / `aria-checked`.
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="list">
            <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const checked = screen
      .getAllByRole('menuitemradio')
      .filter((el) => el.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'Grid' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('drives a controlled radio group via value / onValueChange (exactly one selected)', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('list');
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuRadioGroup value={value} onValueChange={setValue}>
              <DropdownMenuRadioItem value="list">List</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="grid">Grid</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Controlled />);

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    await user.click(screen.getByRole('menuitemradio', { name: 'Grid' }));

    expect(screen.getByRole('menuitemradio', { name: 'Grid' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('menuitemradio', { name: 'List' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('supports a controlled open root (open / onOpenChange)', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            External open
          </button>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    render(<Controlled />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'External open' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('opens a submenu from its SubTrigger (ArrowRight)', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Nested action</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    const subTrigger = screen.getByRole('menuitem', { name: 'More' });
    expect(subTrigger).toHaveAttribute('aria-haspopup', 'menu');

    subTrigger.focus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: 'Nested action' })).toBeInTheDocument(),
    );
  });

  it('composes a trigger over a native button via asChild without nesting buttons', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button">Row actions</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const trigger = screen.getByRole('button', { name: 'Row actions' });
    // asChild renders exactly one button (no nested button inside it).
    expect(trigger.querySelector('button')).toBeNull();

    await user.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('merges a caller className over the default on DropdownMenuContent (caller wins)', async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[16rem]">
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const menu = screen.getByRole('menu');
    // cn()/tailwind-merge de-dupes the conflicting min-width: the caller's value wins.
    expect(menu).toHaveClass('min-w-[16rem]');
    expect(menu).not.toHaveClass('min-w-[8rem]');
    // Non-conflicting base classes survive.
    expect(menu).toHaveClass('bg-surface-raised', 'border', 'shadow-md');
  });

  it('applies the raised-surface highlight token on items', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    // Raised-surface rule: highlight uses bg-muted-raised, not bg-muted.
    const edit = screen.getByRole('menuitem', { name: 'Edit' });
    expect(edit.className).toContain('data-[highlighted]:bg-muted-raised');
  });

  it('forwards a ref to the content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open menu</DropdownMenuTrigger>
        <DropdownMenuContent ref={ref}>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('menu'));
  });

  it('renders a DropdownMenuShortcut span with the muted trailing-hint tokens', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open menu' }));

    const shortcut = screen.getByText('Del');
    expect(shortcut.tagName).toBe('SPAN');
    expect(shortcut).toHaveClass('ml-auto', 'text-text-subtle');
  });
});
