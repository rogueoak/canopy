import type { Meta, StoryObj } from '@storybook/react';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/NavigationMenu - the canopy horizontal site-navigation Branch (spec 0069), built on
 * `@radix-ui/react-navigation-menu`. A Branch owns interaction state and a portal: Radix supplies
 * roving focus and arrow-key traversal between triggers, the hover / focus open-close model,
 * single-open coordination, the `Indicator` that tracks the active trigger, and the portalled,
 * size-synced `Viewport` the active content renders into. The surface is the established
 * raised-surface pattern (`bg-surface-raised` + `border` + the primitive `shadow-md`).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story -
 * including the portalled viewport content - re-themes via the token layer (spec 0004).
 */
const meta = {
  title: 'Branches/NavigationMenu',
  component: NavigationMenu,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof NavigationMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------ Playground */

/** A product menu, a mega-menu, and a couple of plain destinations - the canonical site header. */
export const Playground: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-56 gap-1">
              <li>
                <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#reports">Reports</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#automations">Automations</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[32rem] grid-cols-2 gap-2">
              <NavigationMenuLink href="#startups">For Startups</NavigationMenuLink>
              <NavigationMenuLink href="#enterprise">For Enterprise</NavigationMenuLink>
              <NavigationMenuLink href="#agencies">For Agencies</NavigationMenuLink>
              <NavigationMenuLink href="#education">For Education</NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#docs">Docs</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuIndicator />
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------ SimpleDropdown */

/** A single trigger opening a plain column of links. */
export const SimpleDropdown: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1">
              <li>
                <NavigationMenuLink href="#blog">Blog</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#guides">Guides</NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink href="#changelog">Changelog</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------ MegaMenu */

/** A multi-column mega-menu: rich, categorized content inside one trigger. */
export const MegaMenu: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Platform</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[40rem] grid-cols-3 gap-4">
              <div className="grid gap-1">
                <p className="px-3 py-2 text-caption text-text-subtle">Build</p>
                <NavigationMenuLink href="#editor">Editor</NavigationMenuLink>
                <NavigationMenuLink href="#components">Components</NavigationMenuLink>
                <NavigationMenuLink href="#templates">Templates</NavigationMenuLink>
              </div>
              <div className="grid gap-1">
                <p className="px-3 py-2 text-caption text-text-subtle">Ship</p>
                <NavigationMenuLink href="#deploy">Deploy</NavigationMenuLink>
                <NavigationMenuLink href="#preview">Previews</NavigationMenuLink>
                <NavigationMenuLink href="#rollback">Rollbacks</NavigationMenuLink>
              </div>
              <div className="grid gap-1">
                <p className="px-3 py-2 text-caption text-text-subtle">Observe</p>
                <NavigationMenuLink href="#logs">Logs</NavigationMenuLink>
                <NavigationMenuLink href="#metrics">Metrics</NavigationMenuLink>
                <NavigationMenuLink href="#alerts">Alerts</NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------ PlainLinks */

/** Bare destinations only - no trigger, no dropdown (the flat `TopNavLink` idiom). */
export const PlainLinks: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#home">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#features">Features</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#contact">Contact</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------ ActiveItem */

/** The current page: `active` surfaces `aria-current="page"` + the active styling in lockstep. */
export const ActiveItem: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink href="#home">Home</NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#features" active>
            Features
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="#pricing">Pricing</NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};

/* ------------------------------------------------------------------ DisabledTrigger */

/** A disabled trigger is inert - it never opens its content. */
export const DisabledTrigger: Story = {
  render: () => (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Products</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1">
              <li>
                <NavigationMenuLink href="#analytics">Analytics</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger disabled>Coming soon</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-48 gap-1">
              <li>
                <NavigationMenuLink href="#future">Hidden</NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  ),
};
