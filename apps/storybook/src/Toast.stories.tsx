import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  Toaster,
  useToast,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Toast - the canopy transient-notification Branch (spec 0058), built on
 * `@radix-ui/react-toast`. A Branch owns interaction state and a portal: Radix supplies the
 * enqueue/dequeue queue, the auto-dismiss timers with hover/focus pause, swipe-to-dismiss, and the
 * portalled `ToastViewport` that is a managed ARIA live region (so screen readers announce new
 * toasts). Toast is the non-blocking sibling to the focus-trapping Dialog family.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled viewport - re-themes via the token layer (spec 0004). The common case is
 * the imperative `useToast()` hook under a single `<Toaster />`; the declarative parts stories show
 * the raw surface (`Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`, `ToastClose`).
 */
const meta = {
  title: 'Branches/Toast',
  component: Toast,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

/* --------------------------------------------------------------------- Playground */

/**
 * A single default toast held open (via a Show/Hide toggle) so its surface is inspectable. Real
 * toasts auto-dismiss; here `duration={Infinity}` pins it for the catalog.
 */
function PlaygroundToast() {
  const [open, setOpen] = useState(true);
  return (
    <ToastProvider>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show toast
      </Button>
      <Toast open={open} onOpenChange={setOpen} duration={Infinity}>
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Changes saved</ToastTitle>
          <ToastDescription>Your workspace is up to date.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

export const Playground: Story = {
  render: () => <PlaygroundToast />,
};

/* ----------------------------------------------------------------------- Variants */

/** The three variants side by side: `default` (neutral raised), `success`, and `danger`. */
export const Variants: Story = {
  render: () => (
    <ToastProvider>
      <Toast open duration={Infinity} variant="default" className="static w-80">
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Default</ToastTitle>
          <ToastDescription>A neutral notification on the raised surface.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <Toast open duration={Infinity} variant="success" className="static w-80">
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Saved</ToastTitle>
          <ToastDescription>Your changes were saved successfully.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <Toast open duration={Infinity} variant="danger" className="static w-80">
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Could not save</ToastTitle>
          <ToastDescription>Something went wrong. Please try again.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  ),
  decorators: [
    (StoryFn) => (
      <div className="flex flex-col gap-3">
        <StoryFn />
      </div>
    ),
  ],
};

/* --------------------------------------------------------------------- WithAction */

/** A toast with an inline `ToastAction` ("Undo"), carrying the Radix-required `altText`. */
function ActionToast() {
  const [open, setOpen] = useState(true);
  return (
    <ToastProvider>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Delete item
      </Button>
      <Toast open={open} onOpenChange={setOpen} duration={Infinity}>
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Item deleted</ToastTitle>
          <ToastDescription>The item was moved to the trash.</ToastDescription>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ToastAction altText="Undo deleting the item" onClick={() => setOpen(false)}>
            Undo
          </ToastAction>
          <ToastClose />
        </div>
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

export const WithAction: Story = {
  render: () => <ActionToast />,
};

/* ---------------------------------------------------------------------- WithClose */

/** A toast whose only affordance is the labelled `ToastClose` dismiss control. */
function CloseToast() {
  const [open, setOpen] = useState(true);
  return (
    <ToastProvider>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show dismissable toast
      </Button>
      <Toast open={open} onOpenChange={setOpen} duration={Infinity}>
        <div className="flex min-w-0 flex-col gap-1">
          <ToastTitle>Heads up</ToastTitle>
          <ToastDescription>Dismiss me with the close button.</ToastDescription>
        </div>
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

export const WithClose: Story = {
  render: () => <CloseToast />,
};

/* --------------------------------------------------------------------- Imperative */

/** The common case: `useToast()` under a `<Toaster />`, fired from a Button - no hand-written JSX. */
function ImperativeDemo() {
  const { toast } = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => toast({ title: 'Saved', variant: 'success' })}>Success toast</Button>
      <Button
        variant="destructive"
        onClick={() =>
          toast({ title: 'Could not save', description: 'Retry in a moment.', variant: 'danger' })
        }
      >
        Danger toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast({
            title: 'Item deleted',
            description: 'The item was moved to the trash.',
            action: { label: 'Undo', altText: 'Undo deleting the item', onClick: () => {} },
          })
        }
      >
        With action
      </Button>
    </div>
  );
}

export const Imperative: Story = {
  render: () => (
    <Toaster>
      <ImperativeDemo />
    </Toaster>
  ),
};

/* ------------------------------------------------------------------------ Stacked */

/** Multiple queued toasts stacking in the viewport, newest first (Radix ordering). */
function StackedDemo() {
  const { toast } = useToast();
  return (
    <Button
      onClick={() => {
        toast({ title: 'First', description: 'Queued at the bottom.', variant: 'default' });
        toast({ title: 'Second', description: 'Queued above the first.', variant: 'success' });
        toast({ title: 'Third', description: 'Newest, on top.', variant: 'danger' });
      }}
    >
      Queue three toasts
    </Button>
  );
}

export const Stacked: Story = {
  render: () => (
    <Toaster>
      <StackedDemo />
    </Toaster>
  ),
};

/* -------------------------------------------------------------------- ReducedMotion */

/**
 * Reduced motion: the slide/fade is gated with `motion-reduce:animate-none`, so a user with
 * "reduce motion" enabled gets an instant, static toast. Enable the OS/browser reduced-motion
 * setting to observe the difference.
 */
function ReducedMotionDemo() {
  const { toast } = useToast();
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast({
          title: 'Instant toast',
          description: 'With reduced motion enabled, this appears without a slide.',
        })
      }
    >
      Show toast
    </Button>
  );
}

export const ReducedMotion: Story = {
  render: () => (
    <Toaster>
      <ReducedMotionDemo />
    </Toaster>
  ),
};
