import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  type SheetContentProps,
} from './Sheet';

// Radix Dialog drives dismissal on Pointer Events and locks scroll; jsdom implements neither, so
// without these stubs `user.click` throws (no `hasPointerCapture`) and `react-remove-scroll`'s
// scroll measurement throws (no `scrollIntoView`). Stubbing them lets the real Radix interaction
// run under jsdom - the standard Radix-in-jsdom workaround (mirrors the Dialog test).
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

function Basic({ side }: { side?: SheetContentProps['side'] }) {
  return (
    <Sheet>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Refine the results shown in the table.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose>Cancel</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

describe('Sheet', () => {
  it('opens from its trigger and renders a role="dialog"', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets aria-modal and wires aria-labelledby (Title) / aria-describedby (Description)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    const sheet = screen.getByRole('dialog');
    expect(sheet).toHaveAttribute('aria-modal', 'true');

    const labelledby = sheet.getAttribute('aria-labelledby');
    const describedby = sheet.getAttribute('aria-describedby');
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();
    expect(document.getElementById(labelledby!)).toHaveTextContent('Filters');
    expect(document.getElementById(describedby!)).toHaveTextContent(
      'Refine the results shown in the table.',
    );
  });

  it('closes via the built-in labelled close button', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when the overlay scrim is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // The portal renders the overlay then the content as siblings, so the scrim is the sheet's
    // previousElementSibling (no reliance on a token class).
    const overlay = screen.getByRole('dialog').previousElementSibling;
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('defaults to the right side and anchors + slides from that edge', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    const sheet = screen.getByRole('dialog');
    // Default side="right": right-edge anchor + capped width + right-slide motion.
    expect(sheet).toHaveClass('inset-y-0', 'right-0', 'max-w-sm');
    expect(sheet).toHaveClass('data-[state=open]:animate-drawer-right-in');
  });

  it.each([
    ['top', ['inset-x-0', 'top-0'], 'data-[state=open]:animate-drawer-top-in'],
    ['right', ['inset-y-0', 'right-0', 'max-w-sm'], 'data-[state=open]:animate-drawer-right-in'],
    ['bottom', ['inset-x-0', 'bottom-0'], 'data-[state=open]:animate-bottom-sheet-in'],
    ['left', ['inset-y-0', 'left-0', 'max-w-sm'], 'data-[state=open]:animate-drawer-in'],
  ] as const)('renders the literal anchor + motion classes for side="%s"', async (side, anchors, motion) => {
    const user = userEvent.setup();
    render(<Basic side={side} />);
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    const sheet = screen.getByRole('dialog');
    expect(sheet).toHaveClass(...anchors);
    expect(sheet).toHaveClass(motion);
    // Shared raised-surface tokens are always present.
    expect(sheet).toHaveClass('bg-surface-raised', 'shadow-lg', 'motion-reduce:animate-none');
  });

  it('supports controlled open / onOpenChange', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Open from outside
          </button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetTitle>Controlled</SheetTitle>
              <SheetDescription>Body</SheetDescription>
            </SheetContent>
          </Sheet>
        </div>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open from outside' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('supports uncontrolled defaultOpen', () => {
    render(
      <Sheet defaultOpen>
        <SheetContent>
          <SheetTitle>Open by default</SheetTitle>
          <SheetDescription>Body</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('merges a caller className over the default on SheetContent (caller wins)', async () => {
    const user = userEvent.setup();
    render(
      <Sheet>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent className="max-w-lg">
          <SheetTitle>Sized</SheetTitle>
          <SheetDescription>Body</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    const sheet = screen.getByRole('dialog');
    // tailwind-merge de-dupes the conflicting max-width: the caller's `max-w-lg` wins.
    expect(sheet).toHaveClass('max-w-lg');
    expect(sheet).not.toHaveClass('max-w-sm');
    expect(sheet).toHaveClass('bg-surface-raised', 'shadow-lg');
  });

  it('forwards a ref to the content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <Sheet>
        <SheetTrigger>Open sheet</SheetTrigger>
        <SheetContent ref={ref}>
          <SheetTitle>Reffed</SheetTitle>
          <SheetDescription>Body</SheetDescription>
        </SheetContent>
      </Sheet>,
    );
    await user.click(screen.getByRole('button', { name: 'Open sheet' }));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });
});
