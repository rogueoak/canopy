import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback } from '@rogueoak/canopy/seeds';
import {
  SideNav,
  SideNavCollapseToggle,
  SideNavFooter,
  SideNavHeader,
  SideNavItem,
  SideNavSection,
  SideNavTrigger,
} from '@rogueoak/canopy/branches';

/**
 * Branches/SideNav - the vertical side-navigation Branch (spec 0026), the companion to TopNav. A
 * landmark organism that lists grouped items down the side of an app shell, responsive in two axes:
 * a collapsed icon-rail ↔ expanded toggle on desktop (labels surface via a Tooltip when collapsed),
 * and an off-canvas drawer below `768px` (built on the `@radix-ui/react-dialog` primitive - Radix
 * gives the focus trap, return-focus, `Esc`/outside-click dismiss).
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story - the
 * portalled mobile drawer included - re-themes via the token layer (spec 0004). SideNav composes
 * lower layers (Button / Avatar Seeds) and adds no new token. The icons below are inline literal-class
 * SVGs (no icon library).
 */
const meta = {
  title: 'Branches/SideNav',
  component: SideNav,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

/* ------------------------------------------------------------------------- icons */

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M11 12H3" />
      <path d="m15 6-8 0" />
      <path d="M21 6h-6" />
      <path d="m21 12-6 0" />
      <path d="M11 18H3" />
      <path d="m21 18-6 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

/* ----------------------------------------------------------------------- Expanded */

/**
 * The full rail: grouped sections with headings, icon + label items, an active item carrying
 * `aria-current="page"`, a header collapse toggle, and a footer Avatar. Sits in a fixed-height shell.
 */
export const Expanded: Story = {
  render: () => (
    <div className="flex h-[32rem]">
      <SideNav aria-label="Primary">
        <SideNavHeader>
          <span className="px-1 text-h4 text-text">Canopy</span>
          <SideNavCollapseToggle className="ml-auto" />
        </SideNavHeader>
        <SideNavSection label="Workspace">
          <SideNavItem icon={<HomeIcon />} active href="#home">
            Home
          </SideNavItem>
          <SideNavItem icon={<ProjectsIcon />} href="#projects">
            Projects
          </SideNavItem>
          <SideNavItem icon={<TasksIcon />} href="#tasks">
            Tasks
          </SideNavItem>
        </SideNavSection>
        <SideNavSection label="Account">
          <SideNavItem icon={<SettingsIcon />} href="#settings">
            Settings
          </SideNavItem>
        </SideNavSection>
        <SideNavFooter>
          <Avatar size="sm">
            <AvatarFallback>RO</AvatarFallback>
          </Avatar>
          <span className="text-body-sm text-text-muted">rogueoak</span>
        </SideNavFooter>
      </SideNav>
      <main className="flex-1 p-6 text-text-muted">
        <p className="text-body-sm">Page content.</p>
      </main>
    </div>
  ),
};

/* ---------------------------------------------------------------------- Collapsed */

/**
 * The collapsed icon-rail (`defaultCollapsed`): labels are hidden, icons remain centred, and each
 * item surfaces its label via a Tooltip on hover/focus. The collapse toggle in the header expands it.
 */
export const Collapsed: Story = {
  render: () => (
    <div className="flex h-[32rem]">
      <SideNav aria-label="Primary" defaultCollapsed>
        <SideNavHeader>
          <SideNavCollapseToggle />
        </SideNavHeader>
        <SideNavSection label="Workspace">
          <SideNavItem icon={<HomeIcon />} active href="#home">
            Home
          </SideNavItem>
          <SideNavItem icon={<ProjectsIcon />} href="#projects">
            Projects
          </SideNavItem>
          <SideNavItem icon={<TasksIcon />} href="#tasks">
            Tasks
          </SideNavItem>
        </SideNavSection>
        <SideNavSection label="Account">
          <SideNavItem icon={<SettingsIcon />} href="#settings">
            Settings
          </SideNavItem>
        </SideNavSection>
        <SideNavFooter>
          <Avatar size="sm">
            <AvatarFallback>RO</AvatarFallback>
          </Avatar>
        </SideNavFooter>
      </SideNav>
      <main className="flex-1 p-6 text-text-muted">
        <p className="text-body-sm">Hover an icon to reveal its label.</p>
      </main>
    </div>
  ),
};

/* -------------------------------------------------------------------- MobileDrawer */

/**
 * The off-canvas drawer. This story defaults to a mobile viewport (use the toolbar Viewport control
 * to change it) so SideNav renders its Radix-Dialog drawer rather than the desktop rail: a
 * `SideNavTrigger` (a `md:hidden` hamburger Button, visible below `768px`) opens the rail over a
 * scrim - dismissed by `Esc`, an outside click, or selecting an item. Open state lives in this
 * top-level component (never a hook in the `render` arrow).
 */
function MobileDrawerShell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-[32rem] flex-col border border-border">
      <header className="flex items-center gap-2 border-b border-border p-3">
        <SideNavTrigger
          aria-expanded={open}
          aria-controls="mobile-app-nav"
          onClick={() => setOpen(true)}
        />
        <span className="text-h4 text-text">Canopy</span>
      </header>
      <SideNav id="mobile-app-nav" aria-label="Primary" open={open} onOpenChange={setOpen}>
        <SideNavHeader>
          <span className="px-1 text-h4 text-text">Canopy</span>
        </SideNavHeader>
        <SideNavSection label="Workspace">
          <SideNavItem icon={<HomeIcon />} active href="#home">
            Home
          </SideNavItem>
          <SideNavItem icon={<ProjectsIcon />} href="#projects">
            Projects
          </SideNavItem>
          <SideNavItem icon={<TasksIcon />} href="#tasks">
            Tasks
          </SideNavItem>
        </SideNavSection>
        <SideNavSection label="Account">
          <SideNavItem icon={<SettingsIcon />} href="#settings">
            Settings
          </SideNavItem>
        </SideNavSection>
      </SideNav>
      <main className="p-6 text-text-muted">
        <p className="text-body-sm">Tap the menu button to open the navigation drawer.</p>
      </main>
    </div>
  );
}

export const MobileDrawer: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
  render: () => <MobileDrawerShell />,
};
