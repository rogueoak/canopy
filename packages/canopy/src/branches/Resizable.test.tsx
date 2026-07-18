import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import type { ImperativePanelGroupHandle, ImperativePanelHandle } from 'react-resizable-panels';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './Resizable';

// The global no-op ResizeObserver shim in vitest.setup.ts lets react-resizable-panels mount under
// jsdom (the group measures itself on mount). We assert the observable DOM contract the primitive
// exposes - role, orientation data-attribute, focusability, the token classes we add - not the
// library's internal layout math (getBoundingClientRect is 0x0 in jsdom, so live pixel sizes are
// not meaningful here, per the Wave A "don't assert a 3rd-party library's browser internals"
// learning).

describe('Resizable', () => {
  it('renders the group with panels and a handle between them', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('exposes role="separator" on the handle with the horizontal group direction', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    // The primitive stamps the group direction on each handle; canopy's literal
    // `data-[panel-group-direction=...]` variants key off this attribute.
    expect(handle).toHaveAttribute('data-panel-group-direction', 'horizontal');
  });

  it('flips the group direction data-attribute to vertical (orientation)', () => {
    render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>Top</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Bottom</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('data-panel-group-direction', 'vertical');
  });

  it('marks the handle as an enabled resize handle (primitive data contract)', () => {
    // The primitive's `aria-valuenow`/`min`/`max` are written imperatively from real layout
    // geometry, which jsdom reports as 0x0, so they are not asserted here (the Wave A learning:
    // don't assert a 3rd-party library's browser internals under jsdom). The synchronous DOM
    // contract - the resize-handle marker and enabled flag - IS observable, so we guard that.
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={20} maxSize={80}>
          Left
        </ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('data-resize-handle');
    expect(handle).toHaveAttribute('data-panel-resize-handle-enabled', 'true');
  });

  it('supports an overridable aria-label on the handle', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize the sidebar" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator', { name: 'Resize the sidebar' })).toBeInTheDocument();
  });

  it('makes the handle keyboard-focusable (tabIndex=0) and focus lands on it', async () => {
    const user = userEvent.setup();
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveAttribute('tabindex', '0');
    await user.tab();
    expect(handle).toHaveFocus();
  });

  it('applies the focus-ring tokens on the handle (a11y)', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator')).toHaveClass(
      'focus-visible:ring-2',
      'focus-visible:ring-ring',
      'focus-visible:ring-offset-ring-offset',
    );
  });

  it('paints the divider with the border token', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator')).toHaveClass('bg-border');
  });

  it('renders the optional grip when withHandle is set (and not otherwise)', () => {
    const { rerender } = render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    // No grip glyph without withHandle: the separator has no child svg.
    expect(screen.getByRole('separator').querySelector('svg')).toBeNull();

    rerender(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" withHandle />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const grip = screen.getByRole('separator').querySelector('svg');
    expect(grip).not.toBeNull();
    // The grip box uses the border tokens.
    const gripBox = screen.getByRole('separator').querySelector('div');
    expect(gripBox).toHaveClass('border-border', 'bg-border');
  });

  it('passes collapsible / collapsedSize through to the underlying Panel', () => {
    // A panel collapsed to 0 by default should render its content at the collapsed size without
    // throwing; the constraint props pass straight through the alias.
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={0} collapsible collapsedSize={0} minSize={20}>
          Sidebar
        </ResizablePanel>
        <ResizableHandle aria-label="Resize" />
        <ResizablePanel defaultSize={100}>Main</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('merges a caller className over the group defaults (caller wins)', () => {
    const { container } = render(
      <ResizablePanelGroup direction="horizontal" className="h-40">
        <ResizablePanel defaultSize={100}>Only</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const group = container.querySelector('[data-panel-group]');
    expect(group).toHaveClass('h-40');
    // tailwind-merge drops the conflicting default height in favour of the caller value.
    expect(group).not.toHaveClass('h-full');
  });

  it('merges a caller className over the handle defaults (caller wins)', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" className="w-2" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    const handle = screen.getByRole('separator');
    expect(handle).toHaveClass('w-2');
    // The caller width wins over the default w-px.
    expect(handle).not.toHaveClass('w-px');
  });

  it('spreads native props (id) onto the handle', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Resize" id="split-handle" />
        <ResizablePanel defaultSize={50}>Right</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(screen.getByRole('separator')).toHaveAttribute('id', 'split-handle');
  });

  it('forwards a ref to the group (ImperativePanelGroupHandle)', () => {
    const ref = createRef<ImperativePanelGroupHandle>();
    render(
      <ResizablePanelGroup ref={ref} direction="horizontal">
        <ResizablePanel defaultSize={100}>Only</ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(ref.current).not.toBeNull();
    // The imperative group handle exposes getLayout / setLayout.
    expect(typeof ref.current?.getLayout).toBe('function');
    expect(typeof ref.current?.setLayout).toBe('function');
  });

  it('forwards a ref to a panel (ImperativePanelHandle)', () => {
    const ref = createRef<ImperativePanelHandle>();
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel ref={ref} defaultSize={100}>
          Only
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    expect(ref.current).not.toBeNull();
    // The imperative panel handle exposes collapse / expand / resize.
    expect(typeof ref.current?.getSize).toBe('function');
    expect(typeof ref.current?.resize).toBe('function');
  });

  it('supports nested groups (a group inside a panel)', () => {
    render(
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>Left</ResizablePanel>
        <ResizableHandle aria-label="Outer" />
        <ResizablePanel defaultSize={50}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>Top</ResizablePanel>
            <ResizableHandle aria-label="Inner" />
            <ResizablePanel defaultSize={50}>Bottom</ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    // Both handles render; the inner group carries the vertical direction.
    expect(screen.getByRole('separator', { name: 'Outer' })).toHaveAttribute(
      'data-panel-group-direction',
      'horizontal',
    );
    expect(screen.getByRole('separator', { name: 'Inner' })).toHaveAttribute(
      'data-panel-group-direction',
      'vertical',
    );
  });
});
