import type { Meta, StoryObj } from '@storybook/react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Resizable - the canopy resizable split-layout Branch (spec 0063), built on
 * `react-resizable-panels` (canopy's first non-Radix Branch; the same primitive shadcn's
 * `Resizable` uses). A Branch owns interaction state - here the live drag / keyboard resizing of
 * adjacent panes. The primitive owns pointer tracking, min/max clamping, the `separator` ARIA role,
 * keyboard resize, and collapsible panels; canopy wraps its three parts (`ResizablePanelGroup`,
 * `ResizablePanel`, `ResizableHandle`) with the 0005 recipe.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004). The divider paints with `border` tokens
 * (`bg-border`), keyboard focus shows the standard focus ring, and `withHandle` adds a visible
 * grip. Drag a divider with the pointer, or focus a handle (Tab) and resize with the arrow keys.
 */
const meta = {
  title: 'Branches/Resizable',
  component: ResizablePanelGroup,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ResizablePanelGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------- helpers */

function Pane({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-body-sm text-text-muted">
      {label}
    </div>
  );
}

/* -------------------------------------------------------------- Horizontal */

/** A two-pane horizontal split with a draggable divider between them. */
export const Horizontal: Story = {
  render: () => (
    <div className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50}>
          <Pane label="Sidebar" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize sidebar" />
        <ResizablePanel defaultSize={50}>
          <Pane label="Content" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/* ---------------------------------------------------------------- Vertical */

/** A two-pane vertical split; the group and handle flip to a stacked layout via the direction. */
export const Vertical: Story = {
  render: () => (
    <div className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel defaultSize={50}>
          <Pane label="Header" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize header" />
        <ResizablePanel defaultSize={50}>
          <Pane label="Body" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/* -------------------------------------------------------------- WithHandle */

/** The `withHandle` prop renders a visible centered grip on the divider for an explicit affordance. */
export const WithHandle: Story = {
  render: () => (
    <div className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={40}>
          <Pane label="List" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize list" withHandle />
        <ResizablePanel defaultSize={60}>
          <Pane label="Detail" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/* ------------------------------------------------------------------ Nested */

/**
 * A nested layout: a vertical group lives inside the right panel of a horizontal group, giving a
 * sidebar plus a stacked editor / preview split.
 */
export const Nested: Story = {
  render: () => (
    <div className="h-72 w-[36rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30}>
          <Pane label="Files" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize files" withHandle />
        <ResizablePanel defaultSize={70}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={60}>
              <Pane label="Editor" />
            </ResizablePanel>
            <ResizableHandle aria-label="Resize editor" withHandle />
            <ResizablePanel defaultSize={40}>
              <Pane label="Preview" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/* ------------------------------------------------------------- Collapsible */

/**
 * A collapsible sidebar: the left panel collapses to zero width when dragged past its collapse
 * threshold and snaps back open, while the main panel keeps its minimum size.
 */
export const Collapsible: Story = {
  render: () => (
    <div className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={30} minSize={15} collapsible collapsedSize={0}>
          <Pane label="Collapsible rail" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize rail" withHandle />
        <ResizablePanel defaultSize={70} minSize={30}>
          <Pane label="Workspace" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};

/* ------------------------------------------------------------------ MinMax */

/** Clamped sizes: each panel is bounded by `minSize` / `maxSize`, so the divider stops at the edges. */
export const MinMax: Story = {
  render: () => (
    <div className="h-64 w-[32rem] overflow-hidden rounded-lg border border-border bg-surface">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <Pane label="min 30% / max 70%" />
        </ResizablePanel>
        <ResizableHandle aria-label="Resize" withHandle />
        <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
          <Pane label="min 30% / max 70%" />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  ),
};
