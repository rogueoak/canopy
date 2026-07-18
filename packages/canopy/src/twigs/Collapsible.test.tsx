import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible';

/** A small harness composing the three parts, so tests exercise the real family. */
function Basic(props: React.ComponentProps<typeof Collapsible>) {
  return (
    <Collapsible {...props}>
      <CollapsibleTrigger>Toggle</CollapsibleTrigger>
      <CollapsibleContent>Hidden details</CollapsibleContent>
    </Collapsible>
  );
}

describe('Collapsible', () => {
  it('renders a real button trigger and hides the content when closed', () => {
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });
    expect(trigger.tagName).toBe('BUTTON');
    // Closed: aria-expanded is false and the content is not exposed to the a11y tree.
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden details')).not.toBeInTheDocument();
  });

  it('links the trigger to the content via aria-controls', () => {
    render(<Basic defaultOpen />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });
    const controls = trigger.getAttribute('aria-controls');
    expect(controls).toBeTruthy();
    expect(screen.getByText('Hidden details')).toHaveAttribute('id', controls);
  });

  it('expands on click and collapses on a second click, flipping aria-expanded', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden details')).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden details')).not.toBeInTheDocument();
  });

  it('toggles via the keyboard with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('respects uncontrolled defaultOpen (content visible on mount)', () => {
    render(<Basic defaultOpen />);
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Hidden details')).toBeInTheDocument();
  });

  it('respects controlled open / onOpenChange (open is owned by the caller)', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    // Controlled + open=false: clicking must NOT self-open; it only reports the request.
    render(<Basic open={false} onOpenChange={onOpenChange} />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });

    await user.click(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    // State did not change on its own because the caller owns `open`.
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden details')).not.toBeInTheDocument();
  });

  it('reflects a controlled open flip driven by external state', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open externally
          </button>
          <Basic open={open} onOpenChange={setOpen} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.queryByText('Hidden details')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open externally' }));
    expect(screen.getByText('Hidden details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('renders the trigger inert with the toggle-disabled tokens when the root is disabled', async () => {
    const user = userEvent.setup();
    render(<Basic disabled />);
    const trigger = screen.getByRole('button', { name: 'Toggle' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');

    // Clicking a disabled trigger does nothing - content stays hidden.
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Hidden details')).not.toBeInTheDocument();
  });

  it('drives the content height animation off data-state, gated for reduced motion', () => {
    render(<Basic defaultOpen />);
    const content = screen.getByText('Hidden details');
    // Open state carries the down keyframe; the gate is always present.
    expect(content).toHaveAttribute('data-state', 'open');
    expect(content).toHaveClass(
      'overflow-hidden',
      'data-[state=open]:animate-collapsible-down',
      'data-[state=closed]:animate-collapsible-up',
      'motion-reduce:animate-none',
    );
  });

  it('renders the trigger via asChild, merging the button behavior onto the caller element', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger asChild>
          <span role="button" tabIndex={0}>
            Custom trigger
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent>Hidden details</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByText('Custom trigger');
    // asChild renders the caller's element (a span), not the primitive's default button.
    expect(trigger.tagName).toBe('SPAN');
    // ARIA wiring and toggle behavior still ride on the provided element.
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Hidden details')).toBeInTheDocument();
  });

  it('merges a caller className on each part (caller wins on conflicts)', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="cursor-default">Toggle</CollapsibleTrigger>
        <CollapsibleContent className="overflow-visible">Hidden details</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = screen.getByRole('button', { name: 'Toggle' });
    // cn() de-dupes the conflicting cursor: the caller's wins over the base cursor-pointer.
    expect(trigger).toHaveClass('cursor-default');
    expect(trigger).not.toHaveClass('cursor-pointer');

    const content = screen.getByText('Hidden details');
    expect(content).toHaveClass('overflow-visible');
    expect(content).not.toHaveClass('overflow-hidden');
  });

  it('forwards refs on each part', () => {
    let rootEl: HTMLDivElement | null = null;
    let triggerEl: HTMLButtonElement | null = null;
    let contentEl: HTMLDivElement | null = null;
    render(
      <Collapsible defaultOpen ref={(el) => (rootEl = el)}>
        <CollapsibleTrigger ref={(el) => (triggerEl = el)}>Toggle</CollapsibleTrigger>
        <CollapsibleContent ref={(el) => (contentEl = el)}>Hidden details</CollapsibleContent>
      </Collapsible>,
    );
    expect(rootEl).toBeInstanceOf(HTMLDivElement);
    expect(triggerEl).toBeInstanceOf(HTMLButtonElement);
    expect(contentEl).toBeInstanceOf(HTMLDivElement);
  });
});
