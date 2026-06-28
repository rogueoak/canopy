# 0026 - SideNav (collapsible + responsive)

## Problem

The companion to TopNav (0025): the **vertical side navigation rail** - the second half of the
app shell, and the third Branch. Shipped as its **own component** (not a `NavBar` with an
`orientation` prop, per 0025's locked decision), because a side rail's layout, grouping, and
responsive behaviour differ materially from a top bar's.

A SideNav is a **landmark organism** that lists grouped navigation items (icon + label, with an
`active` affordance) down the side of an app. Per the chosen scope it is **responsive in two
axes**: a **collapsed (icon-rail) ↔ expanded** toggle on desktop (labels hide, icons remain, with
the item's label surfaced via a Tooltip on hover), and an **off-canvas drawer** at small widths
(hidden by default, opened by a menu trigger, dismissible).

Audience: rogueoak app teams building application shells with a persistent side rail.

## Outcome

When done:

- `@rogueoak/canopy/branches` exports an accessible, themed `SideNav` family.
- SideNav is a **slot-based compound** - optional header/footer, grouped sections with optional
  labels, and items (icon + label + `active`) - rendered as an `<aside>`/`<nav>` landmark.
- **Collapsible** (desktop): a controlled/uncontrolled `collapsed` state shrinks the rail to an
  icon column; collapsed items show their label via a **Tooltip** Seed on hover/focus, so the rail
  stays usable without labels.
- **Responsive** (mobile): below a breakpoint the rail becomes an **off-canvas drawer** - hidden,
  opened by a trigger, with a scrim, `Esc`/outside-click dismiss, and focus management.
- Active items expose `aria-current="page"`; styling is consumer-driven (router), not inferred.
- Composition only - **no new token**; semantic tokens, light/dark via the layer.
- Storybook **Branches** stories (expanded, collapsed icon-rail, the mobile drawer, active item)
  and tests (landmark, active wiring, collapse toggle, drawer open/close + dismiss + focus).

## Scope

### In

- **SideNav** - a compound:
  - `SideNav` - the root, an `<aside>` containing a `<nav aria-label>` landmark; a full-height
    column (`w-60` expanded / `w-16` collapsed, `border-r border-border`, `bg-surface`). Owns the
    `collapsed` and mobile-`open` state in a small `SideNavContext`.
  - `SideNavHeader` / `SideNavFooter` - optional top/bottom slots (brand, a user Avatar, a collapse
    toggle).
  - `SideNavSection` - a group of items with an optional `label` (a muted `text-caption` heading
    that hides when collapsed).
  - `SideNavItem` - a nav link: leading icon + label, `active?: boolean` → `aria-current="page"` +
    active token styling (`bg-muted text-text`) vs muted idle (`text-text-muted hover:bg-muted`);
    `asChild` to wrap a router `<Link>`. **When the rail is collapsed**, the label is visually
    hidden and surfaced via a **Tooltip** (the 0014 Seed) on hover/focus; the icon retains an
    accessible name so the link is never label-less.
  - `SideNavTrigger` - the mobile menu button (a Button Seed) that opens the drawer below the
    breakpoint; `aria-expanded` / `aria-controls`.
- **Collapse (desktop)** - a `collapsed` prop (controlled) / `defaultCollapsed` (uncontrolled) +
  `onCollapsedChange`; a built-in collapse toggle composes into the header/footer. Collapsed: width
  shrinks, section labels + item labels hide, Tooltips carry the labels.
- **Drawer (mobile)** - below the breakpoint the rail is off-canvas; `SideNavTrigger` opens it over
  a `bg-overlay/80` scrim (the same token Dialog uses), with `Esc`/outside-click dismiss and
  focus moved into the drawer + returned to the trigger on close.
- **Accessibility** - `<nav>` landmark with `aria-label`; `aria-current="page"` on the active item;
  collapsed items keep an accessible name (Tooltip is supplementary, not the only label); the
  drawer manages focus and is dismissible; the collapse toggle is a labelled button.
- **Stories** - expanded rail with grouped sections + active item; the collapsed icon-rail (Tooltip
  labels on hover); the mobile drawer (open/close); all in both themes.
- **Tests** - renders the `<nav>` landmark; active item carries `aria-current="page"`; the collapse
  toggle shrinks/expands and hides/shows labels; the drawer trigger opens the panel, `Esc`/outside
  click close it and return focus to the trigger.

### Out

- **Multi-level / nested expanding tree nav** (accordion sub-items) - SideNav items are flat within
  a section; a nested tree is a later spec.
- **Resizable / drag-to-width rail, persisted collapse state** - the consumer can persist
  `collapsed`; SideNav doesn't own storage or drag.
- **A shared, standalone `Drawer`/`Sheet` Branch** - SideNav ships its **own** drawer here; if a
  second consumer (TopNav's mobile menu) needs the same primitive later, it can be extracted into a
  `Drawer` Branch then, not pre-abstracted now.
- **TopNav** → 0025.

## Approach

- **Slot-based compound + a state context**, same Branches recipe as TopNav: the root owns the
  interaction state (`collapsed`, mobile `open`) in a `SideNavContext`; the parts consume it. The
  mobile drawer follows Dialog's behavioural lead (scrim on `color-overlay`, focus
  trap/return, `Esc`/outside-click dismiss) - reusing the **pattern** proven in 0024 rather than
  re-inventing modal mechanics.
- **Collapse surfaces labels without losing them.** When collapsed, labels are visually hidden but
  the **Tooltip Seed** carries them on hover/focus and the item keeps an accessible name - the
  collapsed rail stays operable and never ships an unlabelled link (the a11y rule the portalled/
  icon-only patterns already established).
- **Active state is the consumer's, surfaced accessibly** - `SideNavItem active` sets both the
  styling and `aria-current="page"`, driven from the consumer's router (same attribute-in-lockstep
  pattern as TopNav).
- **Composes Seeds/Twigs, adds no token.** Items/toggle/trigger are Buttons/Tooltips/Avatars; the
  rail and drawer style on existing semantic tokens (`bg-surface`, `border-border`, `color-overlay`,
  `muted`, the text roles). No new token, no `dark:`.
- **Same recipe rules** - `cn()` merge, full-literal classes (including the responsive width and
  `md:` visibility literals), `forwardRef` + native prop spread, `asChild` on Item/Header for
  router/brand polymorphism, `React.ComponentRef` for any Radix refs.
- **Testing** - Vitest + Testing Library + `user-event` assert the landmark, `aria-current`, the
  collapse toggle (width/label visibility), and the drawer behaviour (open/dismiss/focus).

### Decision (locked) - SideNav owns its drawer; no shared `Drawer` yet
Rather than first building a generic `Drawer`/`Sheet` Branch, SideNav implements its own
off-canvas behaviour by **reusing Dialog's pattern** (overlay token, focus management, dismiss).
A shared `Drawer` primitive is extracted only when a **second** consumer needs it (rule of three),
keeping this spec shippable on its own and avoiding a speculative abstraction.

## Acceptance

- [ ] `@rogueoak/canopy/branches` exports the `SideNav` family; semantic tokens only, light **and**
      dark, no per-component theme code; no new token.
- [ ] SideNav renders an `<aside>` + `<nav aria-label>` landmark with optional header/footer,
      grouped `SideNavSection`s, and `SideNavItem`s; Item/Header support `asChild`.
- [ ] `SideNavItem active` sets `aria-current="page"` **and** the active styling (idle stays muted).
- [ ] `collapsed` (controlled) / `defaultCollapsed` shrinks the rail to an icon column, hides
      section + item labels, and surfaces each item's label via a **Tooltip** on hover/focus while
      keeping an accessible name.
- [ ] Below the breakpoint the rail is an off-canvas **drawer** on a `color-overlay` scrim, opened
      by `SideNavTrigger`, dismissed by `Esc` **and** outside click, with focus moved in and
      returned to the trigger.
- [ ] Storybook stories cover expanded, collapsed icon-rail (Tooltip labels), and the mobile drawer
 - in both themes.
- [ ] Tests (landmark + `aria-current` + collapse toggle + drawer open/dismiss/focus) pass;
      `pnpm build`/`test`/`lint`/`format:check` green.
- [ ] README + `docs/overview/` updated (Branches layer complete-for-now: Dialog · TopNav ·
      SideNav); developer sign-off on SideNav in Storybook.
