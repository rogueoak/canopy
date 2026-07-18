import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage, Badge, Button } from '@rogueoak/canopy/seeds';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@rogueoak/canopy/twigs';

/**
 * Twigs/Item - the generic row/list-item primitive Twig (spec 0042): a presentational compound
 * that owns the horizontal `[media] [title + description] [actions]` shape reused by every list,
 * menu, settings row, notification entry, and search result. The family is `Item` +
 * `ItemMedia` / `ItemContent` / `ItemTitle` / `ItemDescription` / `ItemActions`. `variant` selects
 * the surface (`default` transparent, `outline` bordered, `muted` filled); `asChild` makes the
 * whole row a clickable `<a>`/`<button>`.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004) - the surfaces, borders, and muted description text all
 * flip through their tokens, exactly as `Card` does.
 */
const meta = {
  title: 'Twigs/Item',
  component: Item,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------- Playground */

/** The canonical row: a media cell, a title + description content column, and trailing actions. */
export const Playground: Story = {
  render: (args) => (
    <Item {...args} className="w-96">
      <ItemMedia>
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/80?img=5" alt="Ada Lovelace" />
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Ada Lovelace</ItemTitle>
        <ItemDescription>ada@example.com</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">
          Message
        </Button>
      </ItemActions>
    </Item>
  ),
};

/* --------------------------------------------------------------------- Variants */

/** The three surface treatments: `default` (transparent), `outline` (bordered), `muted` (filled). */
export const Variants: Story = {
  render: () => (
    <div className="flex w-96 flex-col gap-3">
      <Item variant="default">
        <ItemContent>
          <ItemTitle>Default</ItemTitle>
          <ItemDescription>Transparent - for use inside another surface.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="outline">
        <ItemContent>
          <ItemTitle>Outline</ItemTitle>
          <ItemDescription>A bordered standalone row.</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="muted">
        <ItemContent>
          <ItemTitle>Muted</ItemTitle>
          <ItemDescription>A bg-muted filled row.</ItemDescription>
        </ItemContent>
      </Item>
    </div>
  ),
};

/* ----------------------------------------------------------------------- AsLink */

/**
 * The whole row as a clickable link via `asChild`: it becomes a real `<a>`, focusable and keyboard
 * activatable, and gains the `bg-muted-raised` hover affordance and focus-visible ring.
 */
export const AsLink: Story = {
  render: () => (
    <Item asChild variant="outline" className="w-96">
      <a href="#report">
        <ItemMedia>
          <Badge variant="neutral">PDF</Badge>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Q3-report.pdf</ItemTitle>
          <ItemDescription>Updated 2 hours ago - 4.2 MB</ItemDescription>
        </ItemContent>
        <ItemActions>
          <span aria-hidden="true" className="text-text-muted">
            &rarr;
          </span>
        </ItemActions>
      </a>
    </Item>
  ),
};

/* -------------------------------------------------------------------- WithAvatar */

/** Media = an `Avatar`: the member/assignee row shape. */
export const WithAvatar: Story = {
  render: () => (
    <Item variant="muted" className="w-96">
      <ItemMedia>
        <Avatar>
          <AvatarImage src="https://i.pravatar.cc/80?img=12" alt="Grace Hopper" />
          <AvatarFallback>GH</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Grace Hopper</ItemTitle>
        <ItemDescription>Owner - last active yesterday</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Badge variant="success">Online</Badge>
      </ItemActions>
    </Item>
  ),
};

/* ------------------------------------------------------------------- WithActions */

/** Trailing `Button`s: the settings-row / list-with-controls shape. */
export const WithActions: Story = {
  render: () => (
    <Item variant="outline" className="w-96">
      <ItemContent>
        <ItemTitle>Two-factor authentication</ItemTitle>
        <ItemDescription>Add an extra layer of security to your account.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm">
          Learn more
        </Button>
        <Button size="sm">Enable</Button>
      </ItemActions>
    </Item>
  ),
};

/* ------------------------------------------------------------------------- List */

/** Several items stacked as a list (the caller provides the `<ul role="list">` structure). */
export const List: Story = {
  render: () => {
    const files = [
      { name: 'design-system.fig', meta: '12.4 MB - edited 5m ago' },
      { name: 'roadmap.md', meta: '8 KB - edited 1h ago' },
      { name: 'budget-2026.xlsx', meta: '240 KB - edited yesterday' },
    ];
    return (
      <ul role="list" className="flex w-96 flex-col gap-1">
        {files.map((file) => (
          <li key={file.name}>
            <Item asChild>
              <a href={`#${file.name}`}>
                <ItemMedia>
                  <Badge variant="neutral">FILE</Badge>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{file.name}</ItemTitle>
                  <ItemDescription>{file.meta}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <span aria-hidden="true" className="text-text-muted">
                    &rarr;
                  </span>
                </ItemActions>
              </a>
            </Item>
          </li>
        ))}
      </ul>
    );
  },
};
