import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './Accordion';

/** A three-section harness so tests exercise the real family through the Radix root. */
function Basic(props: Partial<React.ComponentProps<typeof Accordion>>) {
  return (
    <Accordion type="single" collapsible {...(props as React.ComponentProps<typeof Accordion>)}>
      <AccordionItem value="one">
        <AccordionTrigger>Section one</AccordionTrigger>
        <AccordionContent>Body one</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Section two</AccordionTrigger>
        <AccordionContent>Body two</AccordionContent>
      </AccordionItem>
      <AccordionItem value="three" disabled>
        <AccordionTrigger>Section three</AccordionTrigger>
        <AccordionContent>Body three</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe('Accordion', () => {
  it('renders each section as a real button trigger, collapsed with aria-expanded false', () => {
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Section one' });
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    // Closed content is not exposed to the a11y tree.
    expect(screen.queryByText('Body one')).not.toBeInTheDocument();
  });

  it('expands a section on click, exposing its region and toggling aria-expanded / aria-controls', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Section one' });

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const region = screen.getByRole('region');
    expect(region).toHaveTextContent('Body one');
    // The trigger points at its region via aria-controls.
    expect(trigger.getAttribute('aria-controls')).toBe(region.id);
  });

  it('type="single" closes the previously open section when another opens', async () => {
    const user = userEvent.setup();
    render(<Basic />);

    await user.click(screen.getByRole('button', { name: 'Section one' }));
    expect(screen.getByText('Body one')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Section two' }));
    expect(screen.getByText('Body two')).toBeInTheDocument();
    // Opening two collapsed one.
    expect(screen.queryByText('Body one')).not.toBeInTheDocument();
  });

  it('collapsible lets the open section close on a re-click', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Section one' });

    await user.click(trigger);
    expect(screen.getByText('Body one')).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body one')).not.toBeInTheDocument();
  });

  it('type="multiple" keeps several sections open at once', async () => {
    const user = userEvent.setup();
    render(
      <Accordion type="multiple">
        <AccordionItem value="one">
          <AccordionTrigger>Section one</AccordionTrigger>
          <AccordionContent>Body one</AccordionContent>
        </AccordionItem>
        <AccordionItem value="two">
          <AccordionTrigger>Section two</AccordionTrigger>
          <AccordionContent>Body two</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );

    await user.click(screen.getByRole('button', { name: 'Section one' }));
    await user.click(screen.getByRole('button', { name: 'Section two' }));
    // Both stay open under type="multiple".
    expect(screen.getByText('Body one')).toBeInTheDocument();
    expect(screen.getByText('Body two')).toBeInTheDocument();
  });

  it('respects uncontrolled defaultValue (a section open on mount)', () => {
    render(<Basic defaultValue="two" />);
    expect(screen.getByRole('button', { name: 'Section two' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByText('Body two')).toBeInTheDocument();
  });

  it('respects controlled value / onValueChange (open owned by the caller)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    // Controlled with an empty value: clicking must NOT self-open; it only reports the request.
    render(<Basic value="" onValueChange={onValueChange} />);
    const trigger = screen.getByRole('button', { name: 'Section one' });

    await user.click(trigger);
    expect(onValueChange).toHaveBeenCalledWith('one');
    // State did not change on its own because the caller owns value.
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body one')).not.toBeInTheDocument();
  });

  it('reflects a controlled value flip driven by external state', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <>
          <button type="button" onClick={() => setValue('one')}>
            Open one externally
          </button>
          <Basic value={value} onValueChange={setValue} />
        </>
      );
    }
    render(<Controlled />);
    expect(screen.queryByText('Body one')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open one externally' }));
    expect(screen.getByText('Body one')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Section one' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('moves focus between triggers with Down/Up/Home/End (roving keyboard model)', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const one = screen.getByRole('button', { name: 'Section one' });
    const two = screen.getByRole('button', { name: 'Section two' });

    one.focus();
    expect(one).toHaveFocus();

    // ArrowDown/Up move between enabled triggers (the disabled third is skipped).
    await user.keyboard('{ArrowDown}');
    expect(two).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(one).toHaveFocus();

    await user.keyboard('{End}');
    expect(two).toHaveFocus();

    await user.keyboard('{Home}');
    expect(one).toHaveFocus();
  });

  it('toggles a section via the keyboard with Enter and Space', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Section one' });

    trigger.focus();
    await user.keyboard('{Enter}');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard(' ');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('renders a disabled item inert - its trigger cannot open the section', async () => {
    const user = userEvent.setup();
    render(<Basic />);
    const trigger = screen.getByRole('button', { name: 'Section three' });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Body three')).not.toBeInTheDocument();
  });

  it('rotates the chevron and drives the content animation off data-state, gated for reduced motion', () => {
    render(<Basic defaultValue="one" />);
    const trigger = screen.getByRole('button', { name: 'Section one' });
    // The chevron rotate rides the open data-state via the child-svg selector.
    expect(trigger).toHaveClass('[&[data-state=open]>svg]:rotate-180');

    const content = screen.getByText('Body one').closest('[data-state]') as HTMLElement;
    expect(content).toHaveAttribute('data-state', 'open');
    expect(content).toHaveClass(
      'overflow-hidden',
      'data-[state=open]:animate-accordion-down',
      'data-[state=closed]:animate-accordion-up',
      'motion-reduce:animate-none',
    );
  });

  it('merges a caller className on each part (caller wins on conflicts)', () => {
    render(
      <Accordion type="single" collapsible defaultValue="one" className="gap-2">
        <AccordionItem value="one" className="border-b-0">
          <AccordionTrigger className="py-8">Section one</AccordionTrigger>
          <AccordionContent className="overflow-visible">Body one</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const item = screen.getByText('Section one').closest('.border-b-0') as HTMLElement;
    // cn() de-dupes the conflicting border width: the caller's border-b-0 wins over border-b.
    expect(item).toHaveClass('border-b-0', 'border-border');
    expect(item).not.toHaveClass('border-b');

    const trigger = screen.getByRole('button', { name: 'Section one' });
    expect(trigger).toHaveClass('py-8');
    expect(trigger).not.toHaveClass('py-4');

    const content = screen.getByText('Body one').closest('[data-state]') as HTMLElement;
    expect(content).toHaveClass('overflow-visible');
    expect(content).not.toHaveClass('overflow-hidden');
  });

  it('forwards refs on each styled wrapper', () => {
    let itemEl: HTMLDivElement | null = null;
    let triggerEl: HTMLButtonElement | null = null;
    let contentEl: HTMLDivElement | null = null;
    render(
      <Accordion type="single" collapsible defaultValue="one">
        <AccordionItem value="one" ref={(el) => (itemEl = el)}>
          <AccordionTrigger ref={(el) => (triggerEl = el)}>Section one</AccordionTrigger>
          <AccordionContent ref={(el) => (contentEl = el)}>Body one</AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    expect(itemEl).toBeInstanceOf(HTMLDivElement);
    expect(triggerEl).toBeInstanceOf(HTMLButtonElement);
    expect(contentEl).toBeInstanceOf(HTMLDivElement);
  });
});
