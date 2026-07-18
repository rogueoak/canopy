import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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
} from './AlertDialog';

// Radix drives dismissal on Pointer Events and locks scroll; jsdom implements neither, so without
// these stubs `user.click` throws (no `hasPointerCapture`) and `react-remove-scroll`'s scroll
// measurement throws (no `scrollIntoView`). Stubbing them lets the real Radix interaction run under
// jsdom - the standard Radix-in-jsdom workaround (mirrors the Dialog/Select tests).
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function Basic({
  onAction,
  onCancel,
}: {
  onAction?: () => void;
  onCancel?: () => void;
} = {}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger>Delete project</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this project?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the project and all of its data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onAction}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

describe('AlertDialog', () => {
  it('opens from its trigger and renders a role="alertdialog"', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('wires aria-modal, aria-labelledby (Title) and aria-describedby (Description)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    const labelledby = dialog.getAttribute('aria-labelledby');
    const describedby = dialog.getAttribute('aria-describedby');
    expect(labelledby).toBeTruthy();
    expect(describedby).toBeTruthy();
    expect(document.getElementById(labelledby!)).toHaveTextContent('Delete this project?');
    expect(document.getElementById(describedby!)).toHaveTextContent(
      'This permanently removes the project and all of its data.',
    );
  });

  it('has no X close affordance (only Cancel and Action)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('does NOT close when the overlay/outside is clicked (blocking)', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    // The portal renders the overlay then the content as siblings, so the scrim is the dialog's
    // previousElementSibling (no reliance on a `bg-overlay` class).
    const overlay = screen.getByRole('alertdialog').previousElementSibling;
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);
    // Still open - AlertDialog does not dismiss on outside-click.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('does NOT close when Escape is pressed (blocking)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    // Still open - AlertDialog does not dismiss on Esc by default.
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('closes and fires onClick when AlertDialogAction is clicked', async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<Basic onAction={onAction} />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('closes and fires onClick when AlertDialogCancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Basic onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('traps focus and lands it on Cancel by default', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    const dialog = screen.getByRole('alertdialog');
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    // Radix focuses Cancel on open (the safe default choice).
    await waitFor(() => expect(document.activeElement).toBe(cancel));
    // Focus is inside the dialog subtree (trapped).
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('activates the focused button with the keyboard (Enter on Cancel closes)', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<Basic onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    await waitFor(() => expect(document.activeElement).toBe(cancel));
    await user.keyboard('{Enter}');
    expect(onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('cycles focus within the trap with Tab', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const action = screen.getByRole('button', { name: 'Delete' });
    await waitFor(() => expect(document.activeElement).toBe(cancel));

    await user.tab();
    expect(document.activeElement).toBe(action);
  });

  it('supports controlled open via open/onOpenChange', async () => {
    const user = userEvent.setup();

    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            External open
          </button>
          <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogContent>
              <AlertDialogTitle>Controlled</AlertDialogTitle>
              <AlertDialogDescription>Body</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Confirm</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      );
    }

    render(<Controlled />);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'External open' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
  });

  it('supports uncontrolled open via defaultOpen', () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Default open</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('merges a caller className over the default on AlertDialogContent (cn, caller wins)', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogTitle>Sized</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    const dialog = screen.getByRole('alertdialog');
    // tailwind-merge de-dupes the conflicting max-width: the caller's `max-w-sm` wins.
    expect(dialog).toHaveClass('max-w-sm');
    expect(dialog).not.toHaveClass('max-w-lg');
    expect(dialog).toHaveClass('bg-surface-raised', 'border', 'shadow-lg');
  });

  it('styles Action with destructive tokens and Cancel with outline tokens', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    await user.click(screen.getByRole('button', { name: 'Delete project' }));

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass(
      'bg-danger',
      'text-danger-foreground',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('border', 'bg-transparent');
  });

  it('lets a caller className override the Action variant (caller wins)', async () => {
    const user = userEvent.setup();
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
          <AlertDialogAction className="bg-primary">Confirm</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );
    void user;

    const action = screen.getByRole('button', { name: 'Confirm' });
    // tailwind-merge resolves the background conflict in the caller's favour.
    expect(action).toHaveClass('bg-primary');
    expect(action).not.toHaveClass('bg-danger');
  });

  it('forwards a ref to the content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <AlertDialog>
        <AlertDialogTrigger>Open</AlertDialogTrigger>
        <AlertDialogContent ref={ref}>
          <AlertDialogTitle>Reffed</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open' }));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('alertdialog'));
  });

  it('forwards a ref to the Action and Cancel elements', () => {
    const actionRef = createRef<HTMLButtonElement>();
    const cancelRef = createRef<HTMLButtonElement>();
    render(
      <AlertDialog defaultOpen>
        <AlertDialogContent>
          <AlertDialogTitle>Reffed</AlertDialogTitle>
          <AlertDialogDescription>Body</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelRef}>Cancel</AlertDialogCancel>
            <AlertDialogAction ref={actionRef}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(actionRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(cancelRef.current).toBeInstanceOf(HTMLButtonElement);
  });
});
