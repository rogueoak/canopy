import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SideNav,
  SideNavCollapseToggle,
  SideNavHeader,
  SideNavItem,
  SideNavSection,
  SideNavTrigger,
} from './SideNav';

// jsdom implements neither `matchMedia` (which `useIsMobile` subscribes to) nor the Pointer Events /
// scroll APIs the Radix drawer drives. Stub `matchMedia` with a factory so each test forces desktop
// (`matches: false`) or mobile (`matches: true`), and mirror the Dialog test's Radix-in-jsdom stubs
// so `user.click` and `react-remove-scroll` don't throw in the drawer tests.
function setMatches(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

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
  // The collapsed-item Tooltip's Radix `Arrow` measures itself through `react-use-size`, which
  // calls `ResizeObserver` — absent in jsdom, so opening the tooltip throws without a no-op stub.
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  }
});

// Default to desktop before every test; the mobile describe overrides with its own beforeEach.
beforeEach(() => {
  setMatches(false);
});

function Sidebar(props: React.ComponentProps<typeof SideNav>) {
  return (
    <SideNav aria-label="Primary" {...props}>
      <SideNavHeader>
        <SideNavCollapseToggle />
      </SideNavHeader>
      <SideNavSection label="Workspace">
        <SideNavItem icon={<svg aria-hidden="true" />} active href="/home">
          Home
        </SideNavItem>
        <SideNavItem icon={<svg aria-hidden="true" />} href="/projects">
          Projects
        </SideNavItem>
      </SideNavSection>
    </SideNav>
  );
}

describe('SideNav (desktop)', () => {
  it('renders the <nav> landmark with its aria-label', () => {
    render(<Sidebar />);
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('marks the active item with aria-current="page" and leaves a non-active item without it', () => {
    render(<Sidebar />);
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Projects' })).not.toHaveAttribute('aria-current');
  });

  it('forwards a ref to the root rail element', () => {
    const ref = createRef<HTMLElement>();
    render(<Sidebar ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current?.tagName).toBe('ASIDE');
  });

  it('merges a caller className onto the rail (cn)', () => {
    const ref = createRef<HTMLElement>();
    render(<Sidebar ref={ref} className="bg-muted" />);
    // tailwind-merge: the caller's bg wins over the rail default, base classes survive.
    expect(ref.current).toHaveClass('bg-muted');
    expect(ref.current).not.toHaveClass('bg-surface');
    expect(ref.current).toHaveClass('border-r', 'w-60');
  });

  it('renders an asChild SideNavItem as the child <a> carrying the item classes', () => {
    render(
      <SideNav aria-label="Primary">
        <SideNavSection>
          <SideNavItem asChild>
            <a href="/docs">Docs</a>
          </SideNavItem>
        </SideNavSection>
      </SideNav>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', '/docs');
    expect(link).toHaveClass('flex', 'items-center', 'rounded-md');
  });
});

describe('SideNav (collapsed)', () => {
  it('switches the rail width and visually hides labels while keeping the accessible name', () => {
    const ref = createRef<HTMLElement>();
    render(<Sidebar ref={ref} defaultCollapsed />);

    // Width collapses to the icon column.
    expect(ref.current).toHaveClass('w-16');
    expect(ref.current).not.toHaveClass('w-60');

    // The section heading is gone (hidden when collapsed)...
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();

    // ...but each item keeps its accessible name (the label is sr-only, not removed). With the rail
    // collapsed an item is wrapped in a Tooltip, so the label text appears for both the link's name
    // and the (lazy) tooltip — assert the link name rather than a unique text node.
    const home = screen.getByRole('link', { name: 'Home' });
    expect(home).toBeInTheDocument();
    expect(within(home).getByText('Home')).toHaveClass('sr-only');
  });

  it('expands when defaultCollapsed is not set (labels visible, w-60)', () => {
    const ref = createRef<HTMLElement>();
    render(<Sidebar ref={ref} />);
    expect(ref.current).toHaveClass('w-60');
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: 'Home' })).getByText('Home')).not.toHaveClass(
      'sr-only',
    );
  });

  it('toggles collapse via the SideNavCollapseToggle button', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLElement>();
    render(<Sidebar ref={ref} />);

    expect(ref.current).toHaveClass('w-60');
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    expect(ref.current).toHaveClass('w-16');
    // The button's accessible name flips with the state.
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
    expect(ref.current).toHaveClass('w-60');
  });

  it('surfaces a collapsed item label in a Tooltip on focus (the headline a11y promise)', async () => {
    render(<Sidebar defaultCollapsed />);
    // Radix Tooltip opens on focus immediately; the collapsed item is wrapped in one, so focusing
    // the (icon-only) link must surface its label — the actual a11y behaviour, not just the sr-only
    // scaffolding.
    fireEvent.focus(screen.getByRole('link', { name: 'Projects' }));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Projects');
  });

  it('controlled collapse: the toggle fires onCollapsedChange but the rail width stays pinned', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const ref = createRef<HTMLElement>();
    // `collapsed` is pinned `false`, so SideNav is controlled — the DOM must not change on its own.
    render(<Sidebar ref={ref} collapsed={false} onCollapsedChange={onCollapsedChange} />);

    expect(ref.current).toHaveClass('w-60');
    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));
    // The callback reports intent...
    expect(onCollapsedChange).toHaveBeenCalledWith(true);
    // ...but the controlled rail width stays pinned until the prop actually changes.
    expect(ref.current).toHaveClass('w-60');
    expect(ref.current).not.toHaveClass('w-16');
  });
});

describe('SideNav (mobile drawer)', () => {
  beforeEach(() => setMatches(true));

  function MobileShell() {
    const [open, setOpen] = useState(false);
    return (
      <div>
        <SideNavTrigger
          aria-expanded={open}
          aria-controls="app-nav"
          onClick={() => setOpen(true)}
        />
        <SideNav id="app-nav" aria-label="Primary" open={open} onOpenChange={setOpen}>
          <SideNavSection>
            <SideNavItem href="/home">Home</SideNavItem>
          </SideNavSection>
        </SideNav>
      </div>
    );
  }

  it('renders a trigger with aria-expanded=false and aria-controls, no drawer yet', () => {
    render(<MobileShell />);
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens the drawer (role="dialog") containing the nav when the trigger is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileShell />);

    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
    // Radix `aria-hidden`s the background (including the trigger) while the modal is open, so the
    // trigger is no longer reachable by role — assert on the captured node, which React updates.
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<MobileShell />);

    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    await user.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('closes when the overlay scrim is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<MobileShell />);

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    // The portal renders the overlay then the content as siblings; the scrim is the dialog's
    // previousElementSibling (no reliance on a token class).
    const overlay = screen.getByRole('dialog').previousElementSibling;
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes the drawer when a SideNavItem is clicked', async () => {
    const user = userEvent.setup();
    render(<MobileShell />);

    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('link', { name: 'Home' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
