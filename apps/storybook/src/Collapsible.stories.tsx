import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@rogueoak/canopy/seeds';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@rogueoak/canopy/twigs';

/**
 * Twigs/Collapsible - the single expand/collapse disclosure Twig (spec 0046), built on
 * `@radix-ui/react-collapsible`. One `CollapsibleTrigger` toggles one `CollapsibleContent` region:
 * the "show more / show less" primitive that sits one notch below Accordion (0052). Radix owns the
 * open-state machine (controlled `open` + `onOpenChange`, uncontrolled `defaultOpen`, root
 * `disabled`), the real `button` trigger with `aria-expanded` / `aria-controls`, and the
 * `data-state` + `--radix-collapsible-content-height` var driving the height animation.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004). The trigger, content text, and border all flip
 * through their semantic tokens.
 *
 * The trigger renders whatever children you pass - a rotating chevron is a story convention here,
 * not a mandated part. The content height animation is gated behind `motion-reduce:animate-none`,
 * so enabling "Reduce motion" in your OS turns it into an instant show/hide.
 */
const meta = {
  title: 'Twigs/Collapsible',
  component: Collapsible,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A small rotating chevron indicator - a story convention, not a built-in part of the trigger. */
function Chevron() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** The canonical disclosure: a bordered trigger row over a content region that shows and hides. */
export const Playground: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-label [&[data-state=open]>svg]:rotate-180">
        <span>Advanced options</span>
        <Chevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-2 text-body-sm text-text-muted">
          These options are hidden by default and revealed on toggle. Collapsible owns the open
          state; you supply the trigger and the content.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/** Uncontrolled with `defaultOpen`: Radix owns the state and it starts expanded. */
export const Uncontrolled: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-label [&[data-state=open]>svg]:rotate-180">
        <span>Starts open</span>
        <Chevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-2 text-body-sm text-text-muted">
          With `defaultOpen`, the disclosure mounts expanded and Radix tracks open/closed from there
          - no wiring required.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/** Controlled: the caller owns `open` via `useState` and a second Button drives it externally. */
export const Controlled: Story = {
  render: function ControlledStory() {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex w-80 flex-col gap-3">
        <Button variant="outline" onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Collapse from outside' : 'Expand from outside'}
        </Button>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-label [&[data-state=open]>svg]:rotate-180">
            <span>Controlled disclosure</span>
            <Chevron />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 py-2 text-body-sm text-text-muted">
              `open` is owned by the story via `useState`; both the trigger and the external Button
              flip the same state through `onOpenChange`.
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  },
};

/** Disabled root: the trigger is inert (`disabled:opacity-50` + `disabled:cursor-not-allowed`). */
export const Disabled: Story = {
  render: () => (
    <Collapsible disabled className="w-80">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-label [&[data-state=open]>svg]:rotate-180">
        <span>Disabled disclosure</span>
        <Chevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-2 text-body-sm text-text-muted">
          This content cannot be revealed: the disabled root makes the trigger non-togglable.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};

/**
 * Reduced motion: the height animation is gated behind `motion-reduce:animate-none`. Enable
 * "Reduce motion" in your OS (macOS: System Settings > Accessibility > Display) and the toggle
 * becomes an instant show/hide instead of the sliding height transition.
 */
export const ReducedMotion: Story = {
  render: () => (
    <Collapsible className="w-80">
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-label [&[data-state=open]>svg]:rotate-180">
        <span>Toggle (respects reduced motion)</span>
        <Chevron />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-2 text-body-sm text-text-muted">
          With reduced motion enabled, this region appears and disappears instantly - the sliding
          height keyframe is dropped via `motion-reduce:animate-none`.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
