import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './Tooltip';

// The Radix `Arrow` measures itself through `react-use-size`, which calls `ResizeObserver` —
// a browser API jsdom does not implement, so rendering the open tooltip throws without it. A
// no-op stub satisfies the measurement and lets the real Radix interaction run under jsdom; this
// is the only stub the Tooltip needs (focus-driven opening needs no pointer/scroll stubs).
beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = vi.fn(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    })) as unknown as typeof ResizeObserver;
  }
});

// Radix Tooltip opens on hover (pointer events) AND keyboard focus. In jsdom, focus is the
// reliable path — pointer/hover timing is flaky without a real layout/event loop — so these
// tests drive the keyboard (`user.tab()`) per the spec. `delayDuration={0}` removes the open
// delay so the content mounts synchronously after focus, and no jsdom stubs are needed (the
// content opens before Popper measures, unlike Select which needs scroll/pointer stubs).
function Basic({ content = 'Add to library' }: { content?: string }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>Trigger</TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

describe('Tooltip', () => {
  it('renders the trigger with no tooltip visible by default', () => {
    render(<Basic />);
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on keyboard focus, exposing role="tooltip" with the content text', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    expect(screen.getByRole('button', { name: 'Trigger' })).toHaveFocus();
    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Add to library');
  });

  it('carries the raised-surface token classes on the content', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    // Radix puts role="tooltip" on a visually-hidden a11y span; the STYLED Content `<div>` is
    // that span's parent (it also holds the text node + the arrow). Assert tokens on the parent.
    const content = (await screen.findByRole('tooltip')).parentElement;
    expect(content).toHaveClass(
      'bg-surface-raised',
      'border-border',
      'text-text',
      'text-xs',
      'rounded-md',
      'shadow-md',
    );
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.tab();
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitForTooltipToClose();
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
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
    await user.tab();
    await waitForTooltipToClose();
  });

  it('merges a caller className over the content defaults (cn / tailwind-merge)', async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="px-10">Hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    const content = (await screen.findByRole('tooltip')).parentElement;
    expect(content).toHaveClass('px-10');
    expect(content).not.toHaveClass('px-3');
  });

  it('forwards a ref to the underlying content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent ref={ref}>Hint</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.tab();
    // The ref forwards to the styled Content `<div>` (which wraps the role="tooltip" a11y span).
    const content = (await screen.findByRole('tooltip')).parentElement;
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toBe(content);
    expect(ref.current).toHaveClass('bg-surface-raised');
  });
});

// Radix unmounts the content on close after its exit; poll until the tooltip role is gone.
async function waitForTooltipToClose() {
  await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument());
}
