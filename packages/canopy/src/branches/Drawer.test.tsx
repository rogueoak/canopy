import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './Drawer';

// vaul (like Radix Dialog) drives dismissal on Pointer Events and locks scroll; jsdom implements
// neither. Mirror the Dialog/SideNav test stubs so `user.click`, focus, and scroll-lock don't throw.
// We test OUR observable outcomes (opens on trigger, role/aria, close, per-direction anchor classes),
// NOT vaul's internal drag physics - jsdom cannot model pointer velocity.
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
  // vaul reads `window.matchMedia('(display-mode: standalone)')` when the drawer opens and locks the
  // body; jsdom has no `matchMedia`, so stub it (return `matches: false` - not a standalone PWA).
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  }
  // vaul's `onRelease` (fired on every pointer-up inside the drawer) reads the panel's computed
  // `transform` to measure the drag offset; jsdom returns `undefined` for `transform`, so vaul throws
  // `transform.match is not a function` as an uncaught error - failing the run even though the
  // observable assertions pass. Guarantee a string `transform` so the (no-op in jsdom) drag math is
  // inert. We are NOT testing vaul's drag physics here - only our observable outcomes.
  const realGetComputedStyle = window.getComputedStyle.bind(window);
  window.getComputedStyle = ((element: Element, pseudoElt?: string | null) => {
    const style = realGetComputedStyle(element, pseudoElt ?? undefined);
    if (!style.transform) {
      try {
        Object.defineProperty(style, 'transform', { value: 'none', configurable: true });
      } catch {
        /* some environments freeze the declaration; the fallback below still applies */
      }
    }
    return style;
  }) as typeof window.getComputedStyle;
});

function Basic({
  direction,
}: {
  direction?: 'bottom' | 'top' | 'left' | 'right';
}) {
  return (
    <Drawer direction={direction}>
      <DrawerTrigger>Open drawer</DrawerTrigger>
      <DrawerContent direction={direction}>
        <DrawerHeader>
          <DrawerTitle>Filters</DrawerTitle>
          <DrawerDescription>Narrow the results below.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>Cancel</DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

describe('Drawer', () => {
  it('does not render the drawer until the trigger is clicked, then shows a role="dialog"', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('wires aria-modal, aria-labelledby (Title) and aria-describedby (Description)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelledby = dialog.getAttribute('aria-labelledby');
    const describedby = dialog.getAttribute('aria-describedby');
    expect(document.getElementById(labelledby!)).toHaveTextContent('Filters');
    expect(document.getElementById(describedby!)).toHaveTextContent('Narrow the results below.');
  });

  it('closes via the DrawerClose button', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when the overlay scrim is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    // The portal renders the overlay then the content as siblings; the scrim is the dialog's
    // previousElementSibling (no reliance on a token class).
    const overlay = screen.getByRole('dialog').previousElementSibling;
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('supports uncontrolled defaultOpen', () => {
    render(
      <Drawer defaultOpen>
        <DrawerContent>
          <DrawerTitle>Open by default</DrawerTitle>
          <DrawerDescription>Body</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('supports controlled open / onOpenChange', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            External open
          </button>
          <Drawer
            open={open}
            onOpenChange={(next) => {
              onOpenChange(next);
              setOpen(next);
            }}
          >
            <DrawerContent>
              <DrawerTitle>Controlled</DrawerTitle>
              <DrawerDescription>Body</DrawerDescription>
              <DrawerClose>Done</DrawerClose>
            </DrawerContent>
          </Drawer>
        </div>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'External open' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('merges a caller className over the default (cn: caller wins)', async () => {
    const user = userEvent.setup();
    render(
      <Drawer>
        <DrawerTrigger>Open drawer</DrawerTrigger>
        <DrawerContent className="bg-muted">
          <DrawerTitle>Sized</DrawerTitle>
          <DrawerDescription>Body</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    const dialog = screen.getByRole('dialog');
    // tailwind-merge: caller bg wins over the surface default; base classes survive.
    expect(dialog).toHaveClass('bg-muted');
    expect(dialog).not.toHaveClass('bg-surface-raised');
    expect(dialog).toHaveClass('fixed', 'z-50');
  });

  it('forwards a ref to the content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <Drawer>
        <DrawerTrigger>Open drawer</DrawerTrigger>
        <DrawerContent ref={ref}>
          <DrawerTitle>Reffed</DrawerTitle>
          <DrawerDescription>Body</DrawerDescription>
        </DrawerContent>
      </Drawer>,
    );
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });

  it('gates its motion for reduced-motion users (motion-reduce:animate-none)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));
    expect(screen.getByRole('dialog')).toHaveClass('motion-reduce:animate-none');
  });
});

describe.each([
  ['bottom', ['inset-x-0', 'bottom-0', 'rounded-t-lg']],
  ['top', ['inset-x-0', 'top-0', 'rounded-b-lg']],
  ['left', ['inset-y-0', 'left-0', 'rounded-r-lg']],
  ['right', ['inset-y-0', 'right-0', 'rounded-l-lg']],
] as const)('Drawer direction="%s"', (direction, expectedClasses) => {
  it('anchors its content to the matching edge with the correct rounding', async () => {
    const user = userEvent.setup();
    render(<Basic direction={direction} />);
    await user.click(screen.getByRole('button', { name: 'Open drawer' }));

    const dialog = screen.getByRole('dialog');
    for (const cls of expectedClasses) {
      expect(dialog).toHaveClass(cls);
    }
    // vaul reflects the direction on the content for its drag axis / motion.
    expect(dialog).toHaveAttribute('data-vaul-drawer-direction', direction);
  });
});
