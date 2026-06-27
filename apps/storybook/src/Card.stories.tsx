import type { Meta, StoryObj } from '@storybook/react';
import { Button, Input } from '@rogueoak/canopy/seeds';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FormField,
  FormFieldControl,
  FormFieldDescription,
  FormFieldLabel,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/Card - the surface container Twig (spec 0022): a presentational compound that frames
 * related content on a raised surface, and the first Twig to exercise the surface / elevation
 * tokens at the molecule layer. The family is `Card` + `CardHeader` / `CardTitle` /
 * `CardDescription` / `CardContent` / `CardFooter`, sharing a consistent `p-6` inset so the slots
 * align.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004) - the raised surface, border, and muted description
 * text all flip through their tokens, exactly as the portalled Seeds do.
 */
const meta = {
  title: 'Twigs/Card',
  component: Card,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------------- Basic */

/** The canonical content card: a header (title + description) over a body region. */
export const Basic: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Monthly revenue</CardTitle>
        <CardDescription>Across all active workspaces.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-display text-text">$48,250</p>
      </CardContent>
    </Card>
  ),
};

/* ------------------------------------------------------------------- With footer */

/** A card with header, body, and a footer holding action Buttons. */
export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Delete workspace</CardTitle>
        <CardDescription>This permanently removes the workspace and its data.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-body-sm text-text-muted">
          You can export your data first from the settings page.
        </p>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </CardFooter>
    </Card>
  ),
};

/* --------------------------------------------------------------- Composing Seeds */

/**
 * Molecules nesting: a card framing a FormField (Label + Input + help text) over a submit Button,
 * showing the Card as the layout primitive other compositions sit inside.
 */
export const ComposingSeeds: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Join the waitlist</CardTitle>
        <CardDescription>We will email you when a spot opens up.</CardDescription>
      </CardHeader>
      <CardContent>
        <FormField>
          <FormFieldLabel>Email address</FormFieldLabel>
          <FormFieldControl>
            <Input type="email" placeholder="you@example.com" />
          </FormFieldControl>
          <FormFieldDescription>We never share your email.</FormFieldDescription>
        </FormField>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Request access</Button>
      </CardFooter>
    </Card>
  ),
};
