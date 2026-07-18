import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './HoverCard';

// Radix HoverCard's positioned Content measures itself through `react-use-size`, which calls
// `ResizeObserver` - a browser API jsdom does not implement - so rendering the open card throws
// without it. A no-op stub satisfies the measurement and lets the real Radix interaction run.
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  }
});

// Radix HoverCard opens on hover (pointer events) AND keyboard focus. `openDelay={0}` /
// `closeDelay={0}` remove the hover-intent grace so the content mounts/unmounts synchronously
// after the interaction, keeping the tests deterministic under jsdom.
//
// The default Radix trigger renders an `<a>` (no href), which jsdom does not reliably place in the
// tab order, so the focus-driven tests use a `<button>` trigger via `asChild` - the same
// button-focus idiom the Tooltip suite uses. A dedicated test still proves an `asChild` anchor
// stays a real, focusable anchor.
function Basic({
  openDelay = 0,
  closeDelay = 0,
  triggerLabel = 'View profile',
}: {
  openDelay?: number;
  closeDelay?: number;
  triggerLabel?: string;
}) {
  return (
    <HoverCard openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCardTrigger asChild>
        <button type="button">{triggerLabel}</button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p>Ada Lovelace</p>
      </HoverCardContent>
    </HoverCard>
  );
}

describe('HoverCard', () => {
  it('renders the trigger with no card content in the DOM by default', () => {
    render(<Basic />);
    expect(screen.getByText('View profile')).toBeInTheDocument();
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
  });

  it('opens on trigger hover, revealing the card content', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.hover(screen.getByText('View profile'));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('opens on trigger keyboard focus', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    expect(screen.getByText('View profile')).toHaveFocus();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('closes when the pointer leaves the trigger', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <span>outside</span>
      </>,
    );
    await user.hover(screen.getByText('View profile'));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    await user.unhover(screen.getByText('View profile'));
    await waitForCardToClose();
  });

  it('closes when focus leaves the trigger (blur)', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <button type="button">Outside</button>
      </>,
    );
    await user.tab();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    await user.tab();
    await waitForCardToClose();
  });

  it('does not trap focus - Tab moves past the trigger to the next focusable element', async () => {
    const user = userEvent.setup();
    render(
      <>
        <Basic />
        <button type="button">Next</button>
      </>,
    );
    await user.tab();
    expect(screen.getByText('View profile')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();
  });

  it('renders an asChild trigger as the passed element, kept a real focusable anchor', async () => {
    render(
      <HoverCard openDelay={0} closeDelay={0}>
        <HoverCardTrigger asChild>
          <a href="https://example.com">@ada</a>
        </HoverCardTrigger>
        <HoverCardContent>
          <p>Ada Lovelace</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const link = screen.getByRole('link', { name: '@ada' });
    // asChild renders the passed anchor as the real trigger (not a wrapper), href intact.
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    // Focusing the anchor opens the card (Radix opens on focus), proving it is a real focus target.
    link.focus();
    expect(link).toHaveFocus();
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('supports uncontrolled defaultOpen (content present on mount)', async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>View profile</HoverCardTrigger>
        <HoverCardContent>
          <p>Ada Lovelace</p>
        </HoverCardContent>
      </HoverCard>,
    );
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('supports controlled open / onOpenChange', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Show
          </button>
          <HoverCard open={open} onOpenChange={setOpen}>
            <HoverCardTrigger>View profile</HoverCardTrigger>
            <HoverCardContent>
              <p>Ada Lovelace</p>
            </HoverCardContent>
          </HoverCard>
        </>
      );
    }

    render(<Controlled />);
    expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('carries the raised-surface + pop-motion token classes on the content', async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>View profile</HoverCardTrigger>
        <HoverCardContent>
          <p>Ada Lovelace</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const content = (await screen.findByText('Ada Lovelace')).parentElement;
    expect(content).toHaveClass(
      'bg-surface-raised',
      'border-border',
      'text-text',
      'rounded-lg',
      'shadow-md',
      'motion-reduce:animate-none',
    );
  });

  it('merges a caller className over the content defaults (caller wins)', async () => {
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>View profile</HoverCardTrigger>
        <HoverCardContent className="w-96">
          <p>Ada Lovelace</p>
        </HoverCardContent>
      </HoverCard>,
    );
    const content = (await screen.findByText('Ada Lovelace')).parentElement;
    expect(content).toHaveClass('w-96');
    expect(content).not.toHaveClass('w-64');
  });

  it('forwards a ref to the underlying content element', async () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <HoverCard defaultOpen>
        <HoverCardTrigger>View profile</HoverCardTrigger>
        <HoverCardContent ref={ref}>
          <p>Ada Lovelace</p>
        </HoverCardContent>
      </HoverCard>,
    );
    await screen.findByText('Ada Lovelace');
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('bg-surface-raised');
  });
});

// Radix unmounts the content on close after its exit; poll until the card text is gone.
async function waitForCardToClose() {
  await waitFor(() => expect(screen.queryByText('Ada Lovelace')).not.toBeInTheDocument());
}
