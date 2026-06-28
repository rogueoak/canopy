# 0025 — TopNav (responsive)

## Problem

With the Branches layer open (Dialog, 0024) and its recipe locked, the next organism is the
**top navigation bar** — the primary application chrome most apps need first. Canopy intentionally
ships **TopNav** and **SideNav** as **two distinct components** (not one polymorphic `NavBar`),
because a horizontal top bar and a vertical side rail differ in layout, responsive behaviour, and
slot model enough that one component with an `orientation` prop would be a leaky compromise. This
spec is **TopNav**; SideNav is 0026.

A top bar is a **landmark organism**: it composes Seeds (Button, Avatar, a SearchBar Twig) into a
branded header with primary links and a right-aligned actions cluster, and — per the chosen scope
— it is **responsive**: above a breakpoint the links sit inline; below it they collapse behind a
menu (☰) button into a disclosure panel.

Audience: rogueoak app teams building application shells.

## Outcome

When done:

- `@rogueoak/canopy/branches` exports an accessible, themed `TopNav` family.
- TopNav is a **slot-based compound** — brand, primary links (with an `active` affordance), and a
  right-aligned actions area — rendered as a proper `<header>` + `<nav>` landmark.
- It is **responsive**: a `menu` button appears below a breakpoint and toggles a disclosure panel
  holding the links; the panel is keyboard-operable (`aria-expanded` / `aria-controls`, `Esc`
  closes, focus returns to the toggle) and closes on outside click.
- Active links expose `aria-current="page"`; styling is driven by the consumer (from their router),
  not inferred.
- Composition only — **no new token**; semantic tokens, light/dark via the layer.
- Storybook **Branches** stories (brand + links + actions, active state, the responsive collapse)
  and tests (landmark, active wiring, menu toggle open/close + `Esc` + outside-click).

## Scope

### In

- **TopNav** — a compound:
  - `TopNav` — the root, a `<header>` containing a `<nav aria-label>` landmark; a full-width bar
    (`h-14`, `border-b border-border`, `bg-surface`) with a horizontal flex layout
    (brand · links · actions). Owns the responsive open/close state in a small `TopNavContext`.
  - `TopNavBrand` — the leading brand slot (logo/wordmark); `asChild` so it can be the consumer's
    link/`<a>` to home.
  - `TopNavLinks` — the primary-links container; inline above the breakpoint, and the body of the
    collapsed disclosure panel below it.
  - `TopNavLink` — a single nav link. Takes `active?: boolean` → sets `aria-current="page"` and the
    active token styling (`text-text` + an underline/`primary` accent) vs the muted idle
    (`text-text-muted hover:text-text`); `asChild` to wrap the consumer's router `<Link>`.
  - `TopNavActions` — the trailing, right-aligned cluster for Buttons / Avatar / SearchBar.
  - `TopNavMenuButton` — the ☰ toggle, **only visible below the breakpoint** (`md:hidden`); a
    Button Seed (icon) wired with `aria-expanded` + `aria-controls` to the panel.
- **Responsive collapse** — above `md`, links render inline and the menu button is hidden; below
  `md`, links collapse into a disclosure panel anchored under the bar, toggled by
  `TopNavMenuButton`. `Esc` and an outside click close it; focus returns to the toggle on close.
- **Accessibility** — `<nav>` landmark with an `aria-label`; `aria-current="page"` on the active
  link; the menu button/panel `aria-expanded` / `aria-controls`; the panel is dismissible and
  manages focus.
- **Stories** — brand + links + actions (an Avatar and a Button in the actions slot); an active
  link; the responsive collapse (a narrow-viewport story showing the ☰ panel) — all in both themes.
- **Tests** — renders the `<nav>` landmark; the active link carries `aria-current="page"`; the menu
  button toggles the panel (`aria-expanded` flips, panel shows/hides); `Esc` and outside click
  close it and return focus to the toggle.

### Out

- **Dropdown/mega menus** (nested fly-outs under a link) — TopNav links are flat; a
  `NavigationMenu` Branch (on `@radix-ui/react-navigation-menu`) is a later spec.
- **Sticky/scroll-shrink behaviour, theme toggle, command-palette wiring** — app concerns the
  consumer composes into the slots, not baked in.
- **A full off-canvas drawer** for the mobile menu — the collapse is a lightweight disclosure
  panel; a side `Drawer`/`Sheet` Branch (shared with SideNav's mobile mode) is a later spec.
- **SideNav** → 0026.

## Approach

- **Slot-based compound + a tiny state context.** Like a Twig, TopNav coordinates parts through a
  small React context — but the state it owns is **interaction state** (the responsive panel's
  open/closed), which is what makes it a Branch. The disclosure is hand-rolled (a button +
  `aria-expanded`/`aria-controls` + an `Esc`/outside-click effect) rather than pulling a Radix
  primitive, keeping the dep surface flat; the focus-return-to-toggle pattern follows Dialog's
  lead (0024) without the modal weight.
- **Active state is the consumer's, surfaced accessibly.** `TopNavLink active` both styles the
  link and sets `aria-current="page"` — the accessible attribute and the styling stay in lockstep
  (the attribute-driven pattern from Input's `aria-invalid`, learnings), and the consumer drives
  `active` from their router so Canopy stays router-agnostic.
- **Composes Seeds/Twigs, adds no token.** The menu button and actions are Button/Avatar/SearchBar;
  the bar styles on existing semantic tokens (`bg-surface`, `border-border`, the text roles). No
  new token, no `dark:`.
- **Same recipe rules** — `cn()` merge, full-literal classes (including the responsive
  `md:hidden` / `md:flex` literals so Tailwind emits them), `forwardRef` + native prop spread,
  `asChild` (Radix `Slot`) on Brand/Link for router polymorphism.
- **Testing** — Vitest + Testing Library + `user-event` assert the landmark, the `aria-current`
  wiring, and the disclosure behaviour (toggle, `Esc`, outside-click, focus return).

### Decision (locked) — two components, not one `NavBar`
TopNav and SideNav ship as **separate components** (the developer's explicit choice). A horizontal
bar and a vertical rail differ in layout, slot names, and responsive behaviour; one `NavBar` with
an `orientation` prop would force divergent concerns through one API. Any genuinely shared nav
primitive that emerges (e.g. an active-link helper) is small and lives where first needed; the two
specs stay independent and independently shippable.

## Acceptance

- [ ] `@rogueoak/canopy/branches` exports the `TopNav` family; semantic tokens only, light **and**
      dark, no per-component theme code; no new token.
- [ ] TopNav renders a `<header>` + `<nav aria-label>` landmark with brand, links, and a
      right-aligned actions slot; `TopNavBrand` and `TopNavLink` support `asChild`.
- [ ] `TopNavLink active` sets `aria-current="page"` **and** the active styling (idle stays muted).
- [ ] Below the `md` breakpoint the links collapse behind a ☰ `TopNavMenuButton` into a disclosure
      panel; above it the links are inline and the button is hidden.
- [ ] The menu panel toggles via `aria-expanded`/`aria-controls`, closes on `Esc` **and** outside
      click, and returns focus to the toggle.
- [ ] Storybook stories cover brand+links+actions, the active link, and the responsive collapse —
      in both themes.
- [ ] Tests (landmark + `aria-current` + menu toggle/`Esc`/outside-click/focus-return) pass;
      `pnpm build`/`test`/`lint`/`format:check` green.
- [ ] README + `docs/overview/` updated; developer sign-off on TopNav in Storybook.
