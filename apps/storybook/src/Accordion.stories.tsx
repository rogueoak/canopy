import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/Accordion - the inline multi-section disclosure Branch (spec 0052), built on
 * `@radix-ui/react-accordion`. A stack of headed sections whose bodies expand and collapse in place,
 * in the normal document flow - the canonical pattern for FAQs, settings groups, and filter panels.
 * A Branch owns interaction state: Radix supplies `type` single / multiple, `collapsible`,
 * controlled (`value` / `onValueChange`) and uncontrolled (`defaultValue`) state, the header `button`
 * with `aria-expanded` / `aria-controls`, the content `region`, roving keyboard focus
 * (Up/Down/Home/End across triggers, Enter/Space to toggle), and the `--radix-accordion-content-height`
 * var driving the height animation. Unlike Dialog it is portalless - the content lives inline.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story re-themes
 * via the token layer (spec 0004). The trigger chevron rotates 180 degrees on open via
 * `data-[state=open]`, and the content height slide is gated behind `motion-reduce:animate-none`, so
 * enabling "Reduce motion" in your OS turns it into an instant show/hide.
 */
const meta = {
  title: 'Branches/Accordion',
  component: Accordion,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The canonical single accordion: one section open at a time, collapsible so the open one can close. */
export const Playground: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="what">
        <AccordionTrigger>What is Canopy?</AccordionTrigger>
        <AccordionContent>
          Canopy is a design system built on Roots tokens, Tailwind v4, and Radix primitives, styled
          with the 0005 recipe so every component themes light and dark through the token layer.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="who">
        <AccordionTrigger>Who is it for?</AccordionTrigger>
        <AccordionContent>
          Any surface that groups related content into collapsible sections: settings pages, FAQs,
          filter sidebars, and progressive-disclosure detail regions.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="how">
        <AccordionTrigger>How does it theme?</AccordionTrigger>
        <AccordionContent>
          Through semantic tokens only - there is no dark: on the common path. Light and dark flip via
          the token layer, so the accordion re-themes with the toolbar control above.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Single: `type="single"` opens exactly one section at a time; opening another closes the first. */
export const Single: Story = {
  render: () => (
    <Accordion type="single" className="w-96">
      <AccordionItem value="one">
        <AccordionTrigger>First section</AccordionTrigger>
        <AccordionContent>
          Only one section can be open at a time. Opening another closes this one.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Second section</AccordionTrigger>
        <AccordionContent>
          There is no `collapsible` here, so once a section is open one always stays open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="three">
        <AccordionTrigger>Third section</AccordionTrigger>
        <AccordionContent>Opening this collapses whichever section was open before.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Multiple: `type="multiple"` lets any number of sections stay open at once. */
export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a', 'b']} className="w-96">
      <AccordionItem value="a">
        <AccordionTrigger>Shipping</AccordionTrigger>
        <AccordionContent>
          Any number of sections can be open together. This one and the next both start open.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Returns</AccordionTrigger>
        <AccordionContent>Toggling a section never closes the others under `type="multiple"`.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="c">
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>Open me too - all three can be expanded at the same time.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Collapsible: `type="single"` + `collapsible` lets the open section close on a re-click. */
export const Collapsible: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="one">
        <AccordionTrigger>Click me, then click me again</AccordionTrigger>
        <AccordionContent>
          With `collapsible`, re-clicking the open trigger closes it, leaving every section collapsed.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Another section</AccordionTrigger>
        <AccordionContent>Only one is ever open, but none has to be.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** DisabledItem: a `disabled` item's trigger is inert - it cannot be opened or focused. */
export const DisabledItem: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="one">
        <AccordionTrigger>Enabled section</AccordionTrigger>
        <AccordionContent>This section toggles normally.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two" disabled>
        <AccordionTrigger>Disabled section</AccordionTrigger>
        <AccordionContent>You should not be able to reach this content.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="three">
        <AccordionTrigger>Another enabled section</AccordionTrigger>
        <AccordionContent>
          The disabled trigger is skipped by the roving keyboard focus model.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** DefaultOpen: uncontrolled `defaultValue` mounts a section already expanded. */
export const DefaultOpen: Story = {
  render: () => (
    <Accordion type="single" collapsible defaultValue="details" className="w-96">
      <AccordionItem value="summary">
        <AccordionTrigger>Summary</AccordionTrigger>
        <AccordionContent>A short overview, collapsed on mount.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="details">
        <AccordionTrigger>Details (open by default)</AccordionTrigger>
        <AccordionContent>
          With `defaultValue="details"`, this section starts expanded and Radix tracks open/closed
          from there - no wiring required.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** LongContent: a section whose body is long enough to show the height slide over a real distance. */
export const LongContent: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="terms">
        <AccordionTrigger>Terms of service</AccordionTrigger>
        <AccordionContent>
          <div className="flex flex-col gap-3">
            <p>
              These terms govern your use of the service. By accessing it you agree to the conditions
              below, which we may update from time to time with notice.
            </p>
            <p>
              You are responsible for keeping your account credentials secure and for all activity that
              occurs under your account. Notify us promptly of any unauthorized use.
            </p>
            <p>
              The service is provided as-is. To the extent permitted by law we disclaim all warranties,
              and our liability is limited to the amount you paid in the preceding twelve months.
            </p>
            <p>
              The height animation runs over this taller body so you can see the accordion-down and
              accordion-up slide, gated behind reduced motion for an instant toggle when requested.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="privacy">
        <AccordionTrigger>Privacy policy</AccordionTrigger>
        <AccordionContent>A short second section for contrast.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

/** Controlled: the caller owns `value` via `useState`; an external control drives the same state. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [value, setValue] = useState('one');
    return (
      <div className="flex w-96 flex-col gap-3">
        <div className="flex gap-2 text-body-sm text-text-muted">
          <span>Open:</span>
          <span className="text-text">{value || 'none'}</span>
        </div>
        <Accordion type="single" collapsible value={value} onValueChange={setValue}>
          <AccordionItem value="one">
            <AccordionTrigger>Section one</AccordionTrigger>
            <AccordionContent>`value` is owned by the story via `useState`.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="two">
            <AccordionTrigger>Section two</AccordionTrigger>
            <AccordionContent>
              Both the triggers and the readout above reflect the same controlled state.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  },
};
