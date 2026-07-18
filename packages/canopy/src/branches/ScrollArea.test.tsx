import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeAll, describe, expect, it } from 'vitest';
import { ScrollArea, ScrollBar } from './ScrollArea';

// Radix ScrollArea measures the viewport with ResizeObserver to decide whether a scrollbar is
// needed. jsdom implements neither ResizeObserver nor layout, so a no-op stub lets the real Radix
// composition mount without throwing. We assert what is observable in jsdom - the content renders
// into the viewport and stays reachable, and the scrollbar parts carry the token classes - not the
// library's overflow math (unreliable without layout).
beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
});

describe('ScrollArea', () => {
  it('renders children inside the scrollable viewport and keeps them reachable', () => {
    render(
      <ScrollArea className="h-32 w-48">
        <p>Scrollable content</p>
        <a href="/deep">Deep link</a>
      </ScrollArea>,
    );
    // Content is in the document (reachable), not clipped out of the tree.
    expect(screen.getByText('Scrollable content')).toBeInTheDocument();
    // A focusable descendant stays reachable - the viewport preserves native focusability.
    expect(screen.getByRole('link', { name: 'Deep link' })).toBeInTheDocument();
  });

  it('places children inside the Radix viewport element', () => {
    render(
      <ScrollArea data-testid="root">
        <span data-testid="child">Item</span>
      </ScrollArea>,
    );
    const viewport = screen
      .getByTestId('root')
      .querySelector('[data-radix-scroll-area-viewport]');
    expect(viewport).not.toBeNull();
    expect(viewport).toContainElement(screen.getByTestId('child'));
  });

  it('applies the base relative overflow-hidden classes on the root', () => {
    render(<ScrollArea data-testid="root">content</ScrollArea>);
    expect(screen.getByTestId('root')).toHaveClass('relative', 'overflow-hidden');
  });

  it('merges a caller className over the defaults (cn / tailwind-merge, caller wins)', () => {
    render(
      <ScrollArea data-testid="root" className="overflow-visible h-64">
        content
      </ScrollArea>,
    );
    const root = screen.getByTestId('root');
    // tailwind-merge lets the caller win the overflow conflict; sizing is additive.
    expect(root).toHaveClass('overflow-visible', 'h-64', 'relative');
    expect(root).not.toHaveClass('overflow-hidden');
  });

  it('spreads native props (id) onto the root element', () => {
    render(
      <ScrollArea data-testid="root" id="scroller">
        content
      </ScrollArea>,
    );
    expect(screen.getByTestId('root')).toHaveAttribute('id', 'scroller');
  });

  it('forwards a ref to the root element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScrollArea ref={ref}>
        <span>content</span>
      </ScrollArea>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveClass('relative', 'overflow-hidden');
  });
});

describe('ScrollBar', () => {
  it('renders a vertical bar (default) with the rounded-full bg-border thumb', () => {
    render(
      <ScrollArea type="always">
        content
        <ScrollBar data-testid="bar" forceMount />
      </ScrollArea>,
    );
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('data-orientation', 'vertical');
    expect(bar).toHaveClass('h-full', 'w-2.5', 'touch-none', 'select-none');
    // The thumb (force-mounted) carries the thin themed bar token classes.
    const thumb = bar.firstElementChild;
    expect(thumb).not.toBeNull();
    expect(thumb).toHaveClass('flex-1', 'rounded-full', 'bg-border');
  });

  it('renders a horizontal bar with the rounded-full bg-border thumb', () => {
    render(
      <ScrollArea type="always">
        content
        <ScrollBar data-testid="bar" orientation="horizontal" forceMount />
      </ScrollArea>,
    );
    const bar = screen.getByTestId('bar');
    expect(bar).toHaveAttribute('data-orientation', 'horizontal');
    expect(bar).toHaveClass('h-2.5', 'flex-col');
    const thumb = bar.firstElementChild;
    expect(thumb).toHaveClass('flex-1', 'rounded-full', 'bg-border');
  });

  it('merges a caller className over the defaults (caller wins)', () => {
    render(
      <ScrollArea type="always">
        content
        <ScrollBar data-testid="bar" className="w-4" forceMount />
      </ScrollArea>,
    );
    const bar = screen.getByTestId('bar');
    // tailwind-merge lets the caller win the width conflict.
    expect(bar).toHaveClass('w-4');
    expect(bar).not.toHaveClass('w-2.5');
  });

  it('spreads native props (id) onto the scrollbar element', () => {
    render(
      <ScrollArea type="always">
        content
        <ScrollBar data-testid="bar" id="vbar" forceMount />
      </ScrollArea>,
    );
    expect(screen.getByTestId('bar')).toHaveAttribute('id', 'vbar');
  });

  it('forwards a ref to the scrollbar element', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ScrollArea type="always">
        content
        <ScrollBar ref={ref} forceMount />
      </ScrollArea>,
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('data-orientation', 'vertical');
  });
});
