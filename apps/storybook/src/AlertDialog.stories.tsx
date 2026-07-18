import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/AlertDialog - the confirmation sibling to `Dialog` (spec 0053), built on
 * `@radix-ui/react-alert-dialog`. Where a `Dialog` is dismissable (scrim click, `Esc`, corner `X`),
 * an AlertDialog is **blocking**: it advertises `role="alertdialog"`, ships no `X`, and does not
 * close on outside-click or `Esc` - the only way out is the danger `AlertDialogAction` or the safe
 * `AlertDialogCancel` (focused by default). It reuses the shared dialog scrim, raised-surface card,
 * and `animate-dialog-*` motion, and composes the Button Seed's `destructive` / `outline` tokens.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled overlay + content - re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/AlertDialog',
  component: AlertDialog,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/* -------------------------------------------------------------------- Playground */

/** A trigger Button opening a titled + described blocking alert, with Cancel + danger Action. */
export const Playground: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the project and all of its data. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/* -------------------------------------------------------------- DestructiveConfirm */

/**
 * A delete-style confirmation: the danger `AlertDialogAction` is the affirmative choice and the
 * neutral `AlertDialogCancel` (focused by default) is the safe path. Clicking outside or pressing
 * `Esc` does nothing - the user must make a deliberate choice.
 */
export const DestructiveConfirm: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Revoke access</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this member&apos;s access?</AlertDialogTitle>
          <AlertDialogDescription>
            They will immediately lose access to the workspace and all shared projects. You can
            re-invite them later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep access</AlertDialogCancel>
          <AlertDialogAction>Revoke access</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/* ------------------------------------------------------------------- Controlled */

/**
 * A controlled alert: `open` state lives in this top-level component (never a hook inside a `render`
 * arrow), so an external Button can open it and the Action / Cancel close it programmatically.
 */
function ControlledAlertDialog() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('No action taken yet.');

  return (
    <div className="flex flex-col items-center gap-4">
      <Button variant="outline" onClick={() => setOpen(true)}>
        Discard changes
      </Button>
      <p className="text-body-sm text-text-muted">{status}</p>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Its open state is owned by the surrounding component. Any edits you made will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStatus('Kept editing.')}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setStatus('Discarded changes.')}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledAlertDialog />,
};

/* ------------------------------------------------------------------- LongContent */

/**
 * A long-description alert whose body scrolls within a capped-height card, proving the blocking
 * card handles long confirmation copy (e.g. a terms-of-action recap) without breaking layout.
 */
export const LongContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Close account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Permanently close your account?</AlertDialogTitle>
          <AlertDialogDescription>
            Read carefully before you confirm. This action is irreversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-body-sm text-text-muted flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <p key={i}>
              Closing your account deletes all workspaces you own, revokes every member&apos;s access,
              cancels active subscriptions with no refund for the current period, and removes all
              stored data after a 30-day grace window. Exported archives are not recoverable once
              the grace window closes.
            </p>
          ))}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Close account</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
