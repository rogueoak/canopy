import type { Meta, StoryObj } from '@storybook/react';
import { SubscribeForm } from '@rogueoak/canopy/branches';

/**
 * Branches/SubscribeForm - an email-capture Branch (spec 0035): a themed subscribe box with an
 * optional Name field that reveals on email focus, a submit/success/error state machine, a
 * honeypot, and a success card. It is the first **transport-agnostic by injection** Branch -
 * Canopy owns the UI, state, and a11y, but does no network I/O and knows nothing about any
 * analytics SDK: the consumer supplies `onSubscribe` (the submit) and, optionally, `onEvent`
 * (analytics).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004). These stories pass mock `onSubscribe` handlers to
 * exercise each state.
 */
const meta = {
  title: 'Branches/SubscribeForm',
  component: SubscribeForm,
  parameters: { layout: 'padded' },
  args: { source: 'storybook' },
} satisfies Meta<typeof SubscribeForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A resolving submit - click Subscribe to see the success card. */
export const Playground: Story = {
  args: {
    onSubscribe: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

/** The optional Name field revealed from first paint (the dedicated-page layout). */
export const AlwaysShowName: Story = {
  args: {
    alwaysShowName: true,
    onSubscribe: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

/** No box heading - a page supplies its own copy above the form. */
export const NoHeading: Story = {
  args: {
    heading: false,
    onSubscribe: () => new Promise((resolve) => setTimeout(resolve, 600)),
  },
};

/** A rejected submit - fill the email and click Subscribe to see the error alert. */
export const ErrorState: Story = {
  args: {
    onSubscribe: () =>
      Promise.reject(
        Object.assign(new Error('Could not reach the server. Please try again.'), {
          reason: 'network',
        }),
      ),
  },
};
