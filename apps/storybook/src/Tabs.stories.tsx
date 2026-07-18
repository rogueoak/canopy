import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@rogueoak/canopy/branches';

/**
 * Branches/Tabs - the in-place panel switcher Branch (spec 0051), built on `@radix-ui/react-tabs`.
 * A Branch owns interaction state (the selected tab, roving focus) but no portal: Radix supplies
 * the `tablist`/`tab`/`tabpanel` roles, roving tabindex, arrow/Home/End navigation, `orientation`
 * handling, and the `aria-selected` / `aria-controls` / `aria-orientation` wiring, while canopy
 * paints the active-underline styling from the token layer.
 *
 * There is NO per-story theme code: toggle the toolbar Light / Dark control and every story
 * re-themes via the token layer (spec 0004). Active/inactive is driven entirely by Radix's
 * `data-state="active"`.
 */
const meta = {
  title: 'Branches/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

const panelText = 'text-body-sm text-text-muted';

/* --------------------------------------------------------------------- Playground */

/** The default horizontal Tabs: three sibling panels switched by an underlined tablist. */
export const Playground: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList aria-label="Account settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="pt-4">
        <p className={panelText}>Manage your name, email, and profile details here.</p>
      </TabsContent>
      <TabsContent value="password" className="pt-4">
        <p className={panelText}>Change your password and review active sessions.</p>
      </TabsContent>
      <TabsContent value="team" className="pt-4">
        <p className={panelText}>Invite teammates and set their roles.</p>
      </TabsContent>
    </Tabs>
  ),
};

/* -------------------------------------------------------------------- Orientations */

/** Horizontal (default) and vertical orientation side by side - the list layout and the arrow
 * keys that move between tabs change with `orientation`. */
export const Orientations: Story = {
  render: () => (
    <div className="flex flex-col gap-10">
      <Tabs defaultValue="overview" className="w-96">
        <TabsList aria-label="Horizontal">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4">
          <p className={panelText}>Horizontal: Left / Right arrow keys move between tabs.</p>
        </TabsContent>
        <TabsContent value="activity" className="pt-4">
          <p className={panelText}>Recent activity for this entity.</p>
        </TabsContent>
        <TabsContent value="files" className="pt-4">
          <p className={panelText}>Files attached to this entity.</p>
        </TabsContent>
      </Tabs>

      <Tabs defaultValue="overview" orientation="vertical" className="w-[28rem]">
        <TabsList aria-label="Vertical">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <p className={panelText}>Vertical: Up / Down arrow keys move between tabs.</p>
        </TabsContent>
        <TabsContent value="activity">
          <p className={panelText}>Recent activity for this entity.</p>
        </TabsContent>
        <TabsContent value="files">
          <p className={panelText}>Files attached to this entity.</p>
        </TabsContent>
      </Tabs>
    </div>
  ),
};

/* ---------------------------------------------------------------------- DisabledTab */

/** A disabled trigger is skipped by roving focus and is not selectable. */
export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-96">
      <TabsList aria-label="Account settings">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password" disabled>
          Password
        </TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="pt-4">
        <p className={panelText}>The Password tab is disabled and cannot be focused or selected.</p>
      </TabsContent>
      <TabsContent value="password" className="pt-4">
        <p className={panelText}>You should not be able to reach this panel.</p>
      </TabsContent>
      <TabsContent value="team" className="pt-4">
        <p className={panelText}>Invite teammates and set their roles.</p>
      </TabsContent>
    </Tabs>
  ),
};

/* ----------------------------------------------------------------------- Controlled */

/**
 * A controlled Tabs: the selected value lives in this top-level component (never a hook inside a
 * `render` arrow), so external buttons can drive selection and the current value is reported back.
 */
function ControlledTabs() {
  const [value, setValue] = useState('account');
  return (
    <div className="flex w-96 flex-col gap-4">
      <div className="flex gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-border px-3 py-1 text-label text-text-muted hover:text-text"
          onClick={() => setValue('account')}
        >
          Go to Account
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-border px-3 py-1 text-label text-text-muted hover:text-text"
          onClick={() => setValue('team')}
        >
          Go to Team
        </button>
      </div>
      <p className="text-body-sm text-text-muted">Selected: {value}</p>
      <Tabs value={value} onValueChange={setValue}>
        <TabsList aria-label="Account settings">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        <TabsContent value="account" className="pt-4">
          <p className={panelText}>Account panel.</p>
        </TabsContent>
        <TabsContent value="password" className="pt-4">
          <p className={panelText}>Password panel.</p>
        </TabsContent>
        <TabsContent value="team" className="pt-4">
          <p className={panelText}>Team panel.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Controlled: Story = {
  render: () => <ControlledTabs />,
};

/* ------------------------------------------------------------------------- ManyTabs */

/** A long tab list - the strip wraps natively in v1 (overflow affordances are a follow-up). */
export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="tab-1" className="w-[32rem]">
      <TabsList aria-label="Sections" className="flex-wrap">
        {Array.from({ length: 8 }, (_, i) => (
          <TabsTrigger key={i} value={`tab-${i + 1}`}>
            Section {i + 1}
          </TabsTrigger>
        ))}
      </TabsList>
      {Array.from({ length: 8 }, (_, i) => (
        <TabsContent key={i} value={`tab-${i + 1}`} className="pt-4">
          <p className={panelText}>Content for section {i + 1}.</p>
        </TabsContent>
      ))}
    </Tabs>
  ),
};
