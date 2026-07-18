import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from '@rogueoak/canopy/twigs';

/**
 * Twigs/Alert - the static inline notice banner (spec 0040): a presentational compound that sits
 * in the page flow and tells the user something now (a form-level error summary, a "changes
 * saved" confirmation, a deprecation warning, an informational callout). It is neither
 * AlertDialog (0053, a modal interruption) nor Toast (0058, a transient notification): it has no
 * state, no timers, and no portal, and stays where it is rendered.
 *
 * The family is `Alert` + `AlertTitle` / `AlertDescription`. A `variant`
 * (`default` / `info` / `success` / `warning` / `danger`) maps the banner to its paired semantic
 * tokens; an optional `icon` slot renders a decorative leading graphic. There is NO per-story
 * theme code: toggle the toolbar Light / Dark control and every story re-themes through the token
 * layer (spec 0004).
 *
 * Semantics: `Alert` defaults to `role="alert"` (assertive) for urgent notices; pass
 * `role="status"` (polite) for passive confirmations - a real, overridable native prop.
 */
const meta = {
  title: 'Twigs/Alert',
  component: Alert,
  parameters: { layout: 'centered' },
  args: {
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'info', 'success', 'warning', 'danger'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A simple decorative info glyph the caller supplies (canopy ships no icon library). */
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
  </svg>
);

/* ------------------------------------------------------------------- Playground */

/** Drive the `variant` control from the toolbar; a title over a description. */
export const Playground: Story = {
  render: (args) => (
    <Alert {...args} className="w-96">
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>
        This is a static inline notice that stays in the page flow.
      </AlertDescription>
    </Alert>
  ),
};

/* --------------------------------------------------------------------- Variants */

/** All five variants stacked, each mapping to its paired semantic tokens. */
export const Variants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Alert variant="default">
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>A neutral callout on the muted surface.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>An informational message.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Your changes were saved.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This action is deprecated.</AlertDescription>
      </Alert>
      <Alert variant="danger">
        <AlertTitle>Danger</AlertTitle>
        <AlertDescription>We could not process your request.</AlertDescription>
      </Alert>
    </div>
  ),
};

/* --------------------------------------------------------------------- With icon */

/**
 * A banner with a leading decorative icon in the start column. The icon is `aria-hidden`; the
 * meaning stays in the text, so screen-reader users lose nothing.
 */
export const WithIcon: Story = {
  render: (args) => (
    <Alert {...args} icon={<InfoIcon />} variant="info" className="w-96">
      <AlertTitle>Scheduled maintenance</AlertTitle>
      <AlertDescription>The service will be briefly unavailable at 02:00 UTC.</AlertDescription>
    </Alert>
  ),
};

/* -------------------------------------------------------------------- Title only */

/** A banner with only a title (no description) - the layout collapses to a single line. */
export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args} variant="success" className="w-96">
      <AlertTitle>Changes saved.</AlertTitle>
    </Alert>
  ),
};

/* -------------------------------------------------------------- Description only */

/** A banner with only body text (no title). */
export const DescriptionOnly: Story = {
  render: (args) => (
    <Alert {...args} variant="warning" className="w-96">
      <AlertDescription>Your trial ends in three days. Upgrade to keep access.</AlertDescription>
    </Alert>
  ),
};

/* ---------------------------------------------------------------------- As status */

/**
 * A non-urgent, passive notice: `role="status"` (polite) overrides the default `role="alert"`
 * (assertive) via a native prop, so assistive tech announces it without interrupting the user.
 */
export const AsStatus: Story = {
  render: (args) => (
    <Alert {...args} role="status" variant="info" className="w-96">
      <AlertTitle>Draft autosaved</AlertTitle>
      <AlertDescription>We saved your progress a moment ago.</AlertDescription>
    </Alert>
  ),
};
