import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Drawer - the edge-anchored, drag-to-dismiss modal Branch (spec 0067), built on `vaul`.
 * A Drawer anchors to an edge of the viewport (`bottom` (default) / `top` / `left` / `right`), slides
 * in, and can be **dragged to dismiss** with a finger - vaul supplies the pointer-drag physics,
 * velocity/threshold dismiss, and the anchored `direction` API on top of Radix Dialog. The surface is
 * the established raised-surface pattern (`bg-surface-raised` + `border` + `shadow-lg`) over the shared
 * `bg-overlay/80` scrim.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled panel + scrim - re-themes via the token layer (spec 0004). Try dragging the
 * grab handle down (or toward the anchored edge) to dismiss.
 */
const meta = {
  title: 'Branches/Drawer',
  component: Drawer,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------------- Playground */

/** A trigger Button opening a titled + described bottom drawer, with a footer Close Button. */
export const Playground: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit filters</DrawerTitle>
          <DrawerDescription>
            Drag the handle down to dismiss, or use the buttons below.
          </DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button>Apply</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/* --------------------------------------------------------------------- Directions */

/** The default: a sheet anchored to the bottom edge that slides up into thumb reach. */
export const Bottom: Story = {
  render: () => (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <Button>Open bottom</Button>
      </DrawerTrigger>
      <DrawerContent direction="bottom">
        <DrawerHeader>
          <DrawerTitle>Bottom sheet</DrawerTitle>
          <DrawerDescription>Anchored to the bottom edge; drag down to close.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};

/** Anchored to the top edge; slides down. */
export const Top: Story = {
  render: () => (
    <Drawer direction="top">
      <DrawerTrigger asChild>
        <Button>Open top</Button>
      </DrawerTrigger>
      <DrawerContent direction="top">
        <DrawerHeader>
          <DrawerTitle>Top sheet</DrawerTitle>
          <DrawerDescription>Anchored to the top edge; drag up to close.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};

/** A left off-canvas rail (the SideNav mobile pattern); slides in from the left. */
export const Left: Story = {
  render: () => (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <Button>Open left</Button>
      </DrawerTrigger>
      <DrawerContent direction="left">
        <DrawerHeader>
          <DrawerTitle>Left panel</DrawerTitle>
          <DrawerDescription>Anchored to the left edge; drag left to close.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};

/** A right off-canvas panel (cart / details); slides in from the right. */
export const Right: Story = {
  render: () => (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button>Open right</Button>
      </DrawerTrigger>
      <DrawerContent direction="right">
        <DrawerHeader>
          <DrawerTitle>Right panel</DrawerTitle>
          <DrawerDescription>Anchored to the right edge; drag right to close.</DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};

/* --------------------------------------------------------------- WithHeaderFooter */

/** Header (title + description) and a right-aligned action footer with a Close. */
export const WithHeaderFooter: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Move to project</DrawerTitle>
          <DrawerDescription>Choose a destination for the selected items.</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button>Move</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};

/* ---------------------------------------------------------------------- Controlled */

/** External state drives `open`; an outside Button opens the drawer, the footer Close closes it. */
export const Controlled: Story = {
  render: () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [open, setOpen] = useState(false);
    return (
      <div className="flex flex-col items-center gap-3">
        <Button onClick={() => setOpen(true)}>Open from outside</Button>
        <span className="text-body-sm text-text-muted">open: {String(open)}</span>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Controlled drawer</DrawerTitle>
              <DrawerDescription>Its open state lives in the parent component.</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
};

/* --------------------------------------------------------------------- LongContent */

/** A scrollable body: the content caps at `85vh` and scrolls when it overflows. */
export const LongContent: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open long drawer</Button>
      </DrawerTrigger>
      <DrawerContent className="overflow-y-auto">
        <DrawerHeader>
          <DrawerTitle>Terms</DrawerTitle>
          <DrawerDescription>Scroll to read the full terms.</DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {Array.from({ length: 24 }, (_, i) => (
            <p key={i} className="text-body-sm text-text-muted">
              Paragraph {i + 1}. This is placeholder body copy to demonstrate a tall, scrollable
              drawer that stays anchored to its edge while the content scrolls within.
            </p>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  ),
};

/* --------------------------------------------------------------------- ReducedMotion */

/**
 * The same drawer under a reduced-motion preference: the enter/exit motion is gated with
 * `motion-reduce:animate-none`, so the drawer shows/hides instantly. Emulate reduced motion in the
 * OS / browser to see the difference.
 */
export const ReducedMotion: Story = {
  render: () => (
    <Drawer>
      <DrawerTrigger asChild>
        <Button>Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Reduced motion</DrawerTitle>
          <DrawerDescription>
            With a reduced-motion preference, this opens and closes without the slide animation.
          </DrawerDescription>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  ),
};
