import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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
} from './Toast';

// Radix Toast drives dismissal on Pointer Events; jsdom implements neither pointer capture nor
// scrollIntoView, so without these stubs `user.click` throws. Stubbing them lets the real Radix
// interaction run under jsdom - the standard Radix-in-jsdom workaround (mirrors the Dialog test).
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

/**
 * A declarative toast rendered under the provider + viewport, for the parts tests. Its `open` state
 * is controlled here so the Close button / Escape / swipe actually remove it (Radix reports the
 * close via `onOpenChange`, and a controlled root honours it) - mirroring how `Toaster` wires the
 * queue. `duration={Infinity}` disables the auto-dismiss timer so these tests are deterministic.
 */
function DeclarativeToast(props: {
  variant?: 'default' | 'success' | 'danger';
  className?: string;
  onAction?: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <ToastProvider>
      <Toast
        open={open}
        onOpenChange={setOpen}
        duration={Infinity}
        variant={props.variant}
        className={props.className}
        data-testid="toast"
      >
        <ToastTitle>Saved</ToastTitle>
        <ToastDescription>Your changes were saved.</ToastDescription>
        {props.onAction ? (
          <ToastAction altText="Undo the save" onClick={props.onAction}>
            Undo
          </ToastAction>
        ) : null}
        <ToastClose />
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );
}

describe('Toast (parts)', () => {
  it('renders the toast inside an announced live region (status role)', () => {
    render(<DeclarativeToast />);
    // Radix marks each Root role="status" and the viewport is the aria-live region.
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('applies the default variant token classes (raised surface)', () => {
    render(<DeclarativeToast variant="default" />);
    expect(screen.getByTestId('toast')).toHaveClass('bg-surface-raised', 'text-text', 'border-border');
  });

  it('applies the success variant token classes', () => {
    render(<DeclarativeToast variant="success" />);
    expect(screen.getByTestId('toast')).toHaveClass('bg-success', 'text-success-foreground');
  });

  it('applies the danger variant token classes', () => {
    render(<DeclarativeToast variant="danger" />);
    expect(screen.getByTestId('toast')).toHaveClass('bg-danger', 'text-danger-foreground');
  });

  it('renders a labelled Close button and dismisses the toast when clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeclarativeToast />);

    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toBeInTheDocument();
    await user.click(close);
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });

  it('fires the ToastAction onClick and exposes its altText', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onAction = vi.fn();
    render(<DeclarativeToast onAction={onAction} />);

    const action = screen.getByRole('button', { name: 'Undo' });
    // Radix mirrors the required altText onto the action element.
    expect(action).toHaveAttribute('data-radix-toast-announce-alt', 'Undo the save');
    await user.click(action);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('merges a caller className over the default on Toast (cn caller-wins)', () => {
    render(<DeclarativeToast className="rounded-lg" />);
    const toast = screen.getByTestId('toast');
    // tailwind-merge de-dupes the conflicting radius: the caller's rounded-lg wins.
    expect(toast).toHaveClass('rounded-lg');
    expect(toast).not.toHaveClass('rounded-md');
    // Non-conflicting base classes survive.
    expect(toast).toHaveClass('shadow-md', 'border');
  });

  it('forwards a ref to the toast root element', () => {
    const ref = createRef<HTMLLIElement>();
    render(
      <ToastProvider>
        <Toast open ref={ref} data-testid="toast">
          <ToastTitle>Reffed</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>,
    );
    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByTestId('toast'));
  });

  it('dismisses on Escape', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<DeclarativeToast />);
    expect(screen.getByText('Saved')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Saved')).not.toBeInTheDocument());
  });
});

/* ---------------------------------------------------------------- imperative API */

/** A harness exercising the imperative `toast()` / `dismiss()` from `useToast`. */
function ImperativeHarness() {
  const { toast, dismiss } = useToast();
  return (
    <div>
      <button
        type="button"
        onClick={() => toast({ title: 'Enqueued', description: 'From toast()', variant: 'success' })}
      >
        Notify
      </button>
      <button type="button" onClick={() => dismiss()}>
        Dismiss all
      </button>
    </div>
  );
}

describe('Toast (imperative useToast + Toaster)', () => {
  it('enqueues a toast that appears in the viewport when toast() fires', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Toaster>
        <ImperativeHarness />
      </Toaster>,
    );

    expect(screen.queryByText('Enqueued')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(await screen.findByText('Enqueued')).toBeInTheDocument();
    expect(screen.getByText('From toast()')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('dismiss() removes the enqueued toast', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Toaster>
        <ImperativeHarness />
      </Toaster>,
    );

    await user.click(screen.getByRole('button', { name: 'Notify' }));
    expect(await screen.findByText('Enqueued')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Dismiss all' }));
    await waitFor(() => expect(screen.queryByText('Enqueued')).not.toBeInTheDocument());
  });

  it('throws when useToast is used outside a Toaster', () => {
    // Suppress the expected error boundary noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Orphan() {
      useToast();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/useToast must be used within/);
    spy.mockRestore();
  });

  it('auto-dismisses a toast after its duration', async () => {
    // A short real duration is more reliable than fake timers here: Radix Toast's internal timer
    // uses layout-effect scheduling that fake timers do not advance deterministically. We assert
    // the observable outcome - the toast auto-removes without any user dismissal.
    function TimedHarness() {
      const { toast } = useToast();
      return (
        <button type="button" onClick={() => toast({ title: 'Fleeting', duration: 150 })}>
          Fire
        </button>
      );
    }
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <Toaster>
        <TimedHarness />
      </Toaster>,
    );

    await user.click(screen.getByRole('button', { name: 'Fire' }));
    expect(screen.getByText('Fleeting')).toBeInTheDocument();

    // No user interaction: the toast disappears on its own once the duration elapses.
    await waitFor(() => expect(screen.queryByText('Fleeting')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  });
});
