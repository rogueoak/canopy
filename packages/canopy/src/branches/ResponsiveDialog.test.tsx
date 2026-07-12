import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from './ResponsiveDialog';

// Radix Dialog drives dismissal on Pointer Events and locks scroll; jsdom implements neither (see
// Dialog.test.tsx). jsdom also has no real `matchMedia`, so `useIsMobile()` can't detect a viewport -
// tests pin the form explicitly via the `mobile` prop rather than relying on media detection.
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

function Basic({ mobile }: { mobile?: boolean }) {
  return (
    <ResponsiveDialog>
      <ResponsiveDialogTrigger>Open dialog</ResponsiveDialogTrigger>
      <ResponsiveDialogContent mobile={mobile}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Invite teammate</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Send an invitation to join the workspace.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose>Cancel</ResponsiveDialogClose>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

describe.each([
  ['desktop (centred modal)', false],
  ['mobile (bottom sheet)', true],
])('ResponsiveDialog - %s', (_label, mobile) => {
  it('opens from its trigger and renders a role="dialog"', async () => {
    const user = userEvent.setup();
    render(<Basic mobile={mobile} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('wires aria-modal, aria-labelledby (Title) and aria-describedby (Description)', async () => {
    const user = userEvent.setup();
    render(<Basic mobile={mobile} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const labelledby = dialog.getAttribute('aria-labelledby');
    const describedby = dialog.getAttribute('aria-describedby');
    expect(document.getElementById(labelledby!)).toHaveTextContent('Invite teammate');
    expect(document.getElementById(describedby!)).toHaveTextContent(
      'Send an invitation to join the workspace.',
    );
  });

  it('closes via the built-in close button', async () => {
    const user = userEvent.setup();
    render(<Basic mobile={mobile} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Basic mobile={mobile} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('closes when the overlay scrim is clicked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Basic mobile={mobile} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    // The portal renders the overlay then the content as siblings, so the scrim is the dialog's
    // previousElementSibling in both forms (no reliance on a token class).
    const overlay = screen.getByRole('dialog').previousElementSibling;
    expect(overlay).not.toBeNull();
    await user.click(overlay as Element);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('forwards a ref to the content element', async () => {
    const user = userEvent.setup();
    const ref = createRef<HTMLDivElement>();
    render(
      <ResponsiveDialog>
        <ResponsiveDialogTrigger>Open dialog</ResponsiveDialogTrigger>
        <ResponsiveDialogContent mobile={mobile} ref={ref}>
          <ResponsiveDialogTitle>Reffed</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Body</ResponsiveDialogDescription>
        </ResponsiveDialogContent>
      </ResponsiveDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(ref.current).toBeInstanceOf(HTMLElement);
    expect(ref.current).toBe(screen.getByRole('dialog'));
  });
});

describe('ResponsiveDialog - form selection', () => {
  it('renders the bottom-sheet form (grab handle, bottom anchor) when mobile', async () => {
    const user = userEvent.setup();
    render(<Basic mobile />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    const dialog = screen.getByRole('dialog');
    // The sheet is anchored to the bottom edge and slides up; the centred modal is not.
    expect(dialog).toHaveClass('bottom-0', 'data-[state=open]:animate-bottom-sheet-in');
    expect(dialog).not.toHaveClass('top-1/2');
  });

  it('renders the centred-modal form (delegates to DialogContent) when not mobile', async () => {
    const user = userEvent.setup();
    render(<Basic mobile={false} />);
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    const dialog = screen.getByRole('dialog');
    // Desktop delegates to canopy DialogContent: centred + zoom animation, never the sheet slide.
    expect(dialog).toHaveClass('top-1/2', 'data-[state=open]:animate-dialog-content-in');
    expect(dialog).not.toHaveClass('data-[state=open]:animate-bottom-sheet-in');
  });

  it('merges a caller className over the default in both forms (cn)', async () => {
    const user = userEvent.setup();
    render(
      <ResponsiveDialog>
        <ResponsiveDialogTrigger>Open dialog</ResponsiveDialogTrigger>
        <ResponsiveDialogContent mobile className="max-w-sm">
          <ResponsiveDialogTitle>Sized</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>Body</ResponsiveDialogDescription>
        </ResponsiveDialogContent>
      </ResponsiveDialog>,
    );
    await user.click(screen.getByRole('button', { name: 'Open dialog' }));
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');
  });
});
