import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, Button } from '@rogueoak/canopy/seeds';
import { SearchBar } from '@rogueoak/canopy/twigs';
import {
  TopNav,
  TopNavActions,
  TopNavBrand,
  TopNavLink,
  TopNavLinks,
  TopNavMenuButton,
} from '@rogueoak/canopy/branches';

/**
 * Branches/TopNav — the responsive top navigation bar (spec 0025), and the first **non-portalled,
 * stateful** Branch. Where Dialog leans on Radix for a portal + focus trap, TopNav owns its
 * interaction state directly: a hand-rolled disclosure (a ☰ menu button + `aria-expanded` /
 * `aria-controls`, an `Esc` + outside-click effect, and focus-return-to-toggle), coordinated through
 * a small context — no Radix disclosure primitive, no new dependency, no new token.
 *
 * It is a slot-based compound rendered as a `<header>` + `<nav aria-label>` landmark: a brand slot,
 * a primary-links container (inline on `md+`, a disclosure panel below the bar on mobile), and a
 * right-aligned actions cluster composing Seeds/Twigs (Button, Avatar, SearchBar). Active links are
 * the consumer's, surfaced accessibly: `active` sets `aria-current="page"` AND the active styling.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story re-themes
 * through the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/TopNav',
  component: TopNav,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TopNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ----------------------------------------------------------------------- Basic */

/** Brand + primary links + a right-aligned actions cluster (a Button and an Avatar). */
export const Basic: Story = {
  render: () => (
    <TopNav>
      <TopNavMenuButton />
      <TopNavBrand asChild>
        <a href="#">Acme</a>
      </TopNavBrand>
      <TopNavLinks>
        <TopNavLink href="#">Dashboard</TopNavLink>
        <TopNavLink href="#">Projects</TopNavLink>
        <TopNavLink href="#">Team</TopNavLink>
      </TopNavLinks>
      <TopNavActions>
        <Button variant="ghost" size="sm">
          Sign in
        </Button>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </TopNavActions>
    </TopNav>
  ),
};

/* -------------------------------------------------------------------- ActiveLink */

/** One link marked `active` — it carries `aria-current="page"` and the active styling. */
export const ActiveLink: Story = {
  render: () => (
    <TopNav>
      <TopNavMenuButton />
      <TopNavBrand asChild>
        <a href="#">Acme</a>
      </TopNavBrand>
      <TopNavLinks>
        <TopNavLink href="#" active>
          Dashboard
        </TopNavLink>
        <TopNavLink href="#">Projects</TopNavLink>
        <TopNavLink href="#">Team</TopNavLink>
      </TopNavLinks>
      <TopNavActions>
        <div className="hidden w-56 md:block">
          <SearchBar placeholder="Search…" />
        </div>
        <Avatar>
          <AvatarFallback>AL</AvatarFallback>
        </Avatar>
      </TopNavActions>
    </TopNav>
  ),
};

/* -------------------------------------------------------------------- Responsive */

/**
 * The responsive collapse, in a constrained-width container so the layout is below the `md`
 * breakpoint: the links collapse behind the ☰ `TopNavMenuButton` into a disclosure panel. Click the
 * ☰ to open the panel; `Esc`, an outside click, or tapping a link closes it (and `Esc` returns focus
 * to the toggle).
 */
export const Responsive: Story = {
  render: () => (
    <div className="mx-auto max-w-md border border-border">
      <TopNav>
        <TopNavMenuButton />
        <TopNavBrand asChild>
          <a href="#">Acme</a>
        </TopNavBrand>
        <TopNavLinks>
          <TopNavLink href="#" active>
            Dashboard
          </TopNavLink>
          <TopNavLink href="#">Projects</TopNavLink>
          <TopNavLink href="#">Team</TopNavLink>
        </TopNavLinks>
        <TopNavActions>
          <Avatar>
            <AvatarFallback>AL</AvatarFallback>
          </Avatar>
        </TopNavActions>
      </TopNav>
      <p className="p-4 text-body-sm text-text-muted">
        Below the <code>md</code> breakpoint the links collapse behind the ☰ button. Open it to see
        the disclosure panel; <code>Esc</code>, an outside click, or tapping a link closes it.
      </p>
    </div>
  ),
};
