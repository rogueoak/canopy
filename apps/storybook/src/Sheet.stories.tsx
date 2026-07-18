import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, Input } from '@rogueoak/canopy/seeds';
import { FormField, FormFieldControl, FormFieldLabel } from '@rogueoak/canopy/twigs';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Sheet - the edge-anchored side-panel Branch (spec 0068), built on the existing
 * `@radix-ui/react-dialog` primitive (**no new dependency**). It is the same Radix Dialog state
 * machine and ARIA contract as `Dialog` (0024) - Radix supplies the open/close state, focus trap,
 * return-focus, scroll lock, `Esc`-to-close, and the `aria-modal` contract - but anchored to a
 * viewport edge with a slide-in instead of centred with a zoom.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled overlay + content - re-themes via the token layer (spec 0004). The `side`
 * prop (`top` / `right` / `bottom` / `left`, default `right`) anchors the panel and picks the
 * matching slide motion.
 */
const meta = {
  title: 'Branches/Sheet',
  component: Sheet,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------- Playground */

/** The default right-anchored sheet: a titled + described panel with a footer Close Button. */
export const Playground: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open sheet</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Refine the results shown in the table.</SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Done</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

/* --------------------------------------------------------------------- Right */

/** `side="right"` (the default) - a right-edge flyout, the canonical settings/detail panel. */
export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open right</Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Right sheet</SheetTitle>
          <SheetDescription>
            Anchored to the right edge, sliding in from the right.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

/* ---------------------------------------------------------------------- Left */

/** `side="left"` - a left-edge panel, the canonical mobile navigation sheet. */
export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open left</Button>
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Left sheet</SheetTitle>
          <SheetDescription>Anchored to the left edge, sliding in from the left.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

/* ----------------------------------------------------------------------- Top */

/** `side="top"` - a full-width panel dropping in from the top edge. */
export const Top: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open top</Button>
      </SheetTrigger>
      <SheetContent side="top">
        <SheetHeader>
          <SheetTitle>Top sheet</SheetTitle>
          <SheetDescription>Anchored to the top edge, sliding in from the top.</SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

/* -------------------------------------------------------------------- Bottom */

/** `side="bottom"` - a full-width panel rising from the bottom edge. */
export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open bottom</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Bottom sheet</SheetTitle>
          <SheetDescription>
            Anchored to the bottom edge, sliding in from the bottom.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};

/* ----------------------------------------------------------------- FormBody */

/**
 * A form sheet: header + a FormField Twig (Label + Input) in the body, with Cancel / Save footer
 * Buttons - proving a Branch composes Twigs and Seeds.
 */
export const FormBody: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Edit profile</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription>Update your details, then save when you are done.</SheetDescription>
        </SheetHeader>
        <FormField>
          <FormFieldLabel>Display name</FormFieldLabel>
          <FormFieldControl>
            <Input defaultValue="Ada Lovelace" />
          </FormFieldControl>
        </FormField>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button>Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

/* ------------------------------------------------------------------ Controlled */

/**
 * A controlled sheet: `open` state lives in this top-level component (never a hook inside a `render`
 * arrow), so an external Button can open it and a Save action can close it programmatically.
 */
function ControlledSheet() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from outside
      </Button>
      <p className="text-body-sm text-text-muted">The sheet is {open ? 'open' : 'closed'}.</p>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Controlled sheet</SheetTitle>
            <SheetDescription>
              Its open state is owned by the surrounding component.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledSheet />,
};

/* --------------------------------------------------------------- ReducedMotion */

/**
 * Reduced motion: the slide is gated with `motion-reduce:animate-none`, so a user with
 * `prefers-reduced-motion: reduce` gets an instant show/hide. Enable "Reduce motion" in the OS
 * accessibility settings (or the browser emulation) to see the sheet appear without the slide.
 */
export const ReducedMotion: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open sheet (reduced motion)</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Reduced motion</SheetTitle>
          <SheetDescription>
            With reduced motion enabled this appears instantly, with no slide.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  ),
};
