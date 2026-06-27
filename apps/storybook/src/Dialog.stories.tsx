import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, Input } from '@rogueoak/canopy/seeds';
import { FormField, FormFieldControl, FormFieldLabel } from '@rogueoak/canopy/twigs';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Dialog — the first canopy Branch (organism, spec 0024), built on
 * `@radix-ui/react-dialog`. A Branch owns interaction state and a portal: Radix supplies the
 * open/close state machine, the focus trap, return-focus, scroll lock, and the `aria-modal` ARIA
 * contract, while the surface is the established raised-surface pattern (`bg-surface-raised` +
 * `border` + the primitive `shadow-lg`) and the scrim is the pre-provisioned `color-overlay` token
 * at reduced opacity (`bg-overlay/80`).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story —
 * including the portalled overlay + content — re-themes via the token layer (spec 0004). Dialog
 * composes lower layers: Button Seeds for the trigger / footer, and a FormField Twig in the body.
 */
const meta = {
  title: 'Branches/Dialog',
  component: Dialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------------- Basic */

/** A trigger Button opening a titled + described dialog, with a footer Close Button. */
export const Basic: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share this project</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this project in read-only mode.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/* --------------------------------------------------------------------- FormBody */

/**
 * A form dialog: a FormField Twig (Label + Input) in the body, with Cancel / Save footer Buttons —
 * proving a Branch composes Twigs and Seeds.
 */
export const FormBody: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Rename workspace</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
          <DialogDescription>Pick a name your team will recognise.</DialogDescription>
        </DialogHeader>
        <FormField>
          <FormFieldLabel>Workspace name</FormFieldLabel>
          <FormFieldControl>
            <Input defaultValue="Acme Inc." />
          </FormFieldControl>
        </FormField>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Save changes</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/* ----------------------------------------------------- DestructiveConfirmation */

/**
 * A destructive confirmation framed with a `destructive` Button. (This is a regular Dialog; the
 * role-`alertdialog` primitive is a later spec.)
 */
export const DestructiveConfirmation: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This permanently removes the project and all of its data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button variant="destructive">Delete project</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/* ------------------------------------------------------------------ Controlled */

/**
 * A controlled dialog: `open` state lives in this top-level component (never a hook inside a
 * `render` arrow), so an external Button can open it and a Save action can close it
 * programmatically.
 */
function ControlledDialog() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open from outside
      </Button>
      <p className="text-body-sm text-text-muted">The dialog is {open ? 'open' : 'closed'}.</p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Controlled dialog</DialogTitle>
            <DialogDescription>
              Its open state is owned by the surrounding component.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledDialog />,
};
