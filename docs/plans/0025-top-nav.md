# Plan 0025 - TopNav (responsive)

Source: `docs/specs/0025-top-nav.md`. Build in worktree `.worktrees/0025-top-nav` on branch
`0025-top-nav` (off `main`, which has the Branches layer + Dialog). Test before commit. Personas
(engineer · tester · architect · designer) review the PR.

## Key facts

- **No new dependency** - TopNav is hand-rolled (no Radix primitive for the disclosure). It uses
  the **Button** Seed (the ☰ menu button), and Radix **`Slot`** (already a dep) for `asChild` on
  Brand/Link. Composes Seeds/Twigs; adds **no token**.
- Ships on the existing `@rogueoak/canopy/branches` subpath - **no infra change** (the tsup entry,
  exports map, and `src/branches/index.ts` barrel already exist from 0024). Just add TopNav to the
  barrel.
- Models: `src/branches/Dialog.tsx` (Branches recipe - file-top doc comment, `forwardRef`,
  `cn()`, full-literal classes, `React.ComponentRef`), `src/twigs/FormField.tsx` (compound +
  React **context** + `useId`, the `Slot` injection pattern), `src/seeds/Button.tsx` (the menu
  button).

## Steps

1. **`src/branches/TopNav.tsx`** - the compound, on a small `TopNavContext`:
   - `TopNavContext` - `{ open, setOpen, panelId, close }`. The root creates a `useId` `panelId`
     so `TopNavMenuButton aria-controls` and `TopNavLinks id` agree.
   - `TopNav` (root) - renders `<header>` wrapping a `<nav aria-label>` (default
     `aria-label="Main"`, overridable). Bar: `flex h-14 w-full items-center gap-4 border-b
     border-border bg-surface px-4 text-text`. Provides the context. Owns the **Esc + outside-click**
     effect (a `ref` on the header/nav; on `pointerdown` outside → `close()`; on `Escape` →
     `close()` and **return focus to the menu button**). Use a `menuButtonRef` in context (or a
     ref registered by the button) for focus-return, mirroring Dialog's return-to-trigger.
   - `TopNavBrand` - leading brand slot; `asChild` (Radix `Slot`) so it can be the consumer's `<a>`
     to home. Default element `<div>`/`<span>` with `mr-*`/`font` styling for a wordmark; `text-h4`
     or `font-semibold` is fine.
   - `TopNavLinks` - the primary-links container, carrying `id={panelId}`. ONE element that is an
     **inline row on `md+`** and a **mobile disclosure panel** below the bar when `open`:
     `cn('md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent
     md:p-0 md:shadow-none', open ? 'absolute left-0 right-0 top-14 z-40 flex flex-col gap-1
     border-b border-border bg-surface p-2 shadow-md' : 'hidden')`. (The `md:flex` overrides the
     mobile `hidden` at the breakpoint; full-literal classes so Tailwind emits them.)
   - `TopNavLink` - a single link. `active?: boolean` → `aria-current={active ? 'page' :
     undefined}` AND the active styling vs muted idle: idle `text-text-muted hover:text-text`,
     active `text-text font-medium` (an accent underline is fine, e.g.
     `aria-[current=page]:…`/conditional class). `asChild` (Slot) to wrap a router `<Link>`; default
     `<a>`. `rounded-md px-3 py-2 text-body-sm` + focus-visible ring (the shared
     `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
     focus-visible:ring-offset-2 focus-visible:ring-offset-surface`). Closes the panel on click
     (`onClick` → `close()`), so a mobile tap navigates and dismisses.
   - `TopNavActions` - trailing right-aligned cluster: `ml-auto flex items-center gap-2`. Holds
     Buttons / Avatar / SearchBar (consumer-provided).
   - `TopNavMenuButton` - the ☰ toggle, **`md:hidden`**. Compose the **Button** Seed
     (`variant="ghost" size="icon"`), `aria-label` (default `"Open menu"` / `"Close menu"` by
     state), `aria-expanded={open}`, `aria-controls={panelId}`; `onClick` toggles. Register its
     ref into context for focus-return. Inline hamburger / X SVG (`currentColor`, `aria-hidden`),
     swapping with `open`.
   - Rules: `forwardRef` + native prop spread on every styled part, `displayName`, file-top doc
     comment in the house style, **no `dark:`**, semantic tokens only, full-literal classes.
     Export prop types. Place the `TopNavActions`/`TopNavMenuButton` order so actions sit left of
     the menu button on mobile or as the shadcn-ish layout reads best (menu button typically far
     right on mobile; on desktop it's hidden and actions are far right).

2. **`src/branches/index.ts`** - add the TopNav family + types to the barrel (keep Dialog exports).

3. **`src/branches/TopNav.test.tsx`** - Vitest + Testing Library + `user-event`, asserting
   behaviour:
   - renders a `<nav>` landmark (`getByRole('navigation')`) with its `aria-label`.
   - `TopNavLink active` carries `aria-current="page"`; a non-active link does not.
   - the menu button toggles the panel: `aria-expanded` flips false→true→false and the links
     container shows/hides; `aria-controls` === the links container `id`.
   - `Esc` closes the open panel and **returns focus to the menu button**.
   - an **outside click** (e.g. on `document.body` / an outside element) closes the panel.
   - `asChild` on `TopNavBrand`/`TopNavLink` renders the child element (e.g. an `<a href>`) carrying
     the classes (no wrapper).
   - `cn()` merges a caller `className`; ref forwards on the root.
   (jsdom: the outside-click uses a real `pointerdown`/`mousedown` on an element outside the nav;
   match whatever event the effect listens for. No portal here, so no Radix jsdom stubs needed.)

4. **`apps/storybook/src/TopNav.stories.tsx`** - `title: 'Branches/TopNav'`, import from
   `@rogueoak/canopy/branches` (+ Button/Avatar from `/seeds`, SearchBar from `/twigs` for the
   actions story). No per-story theme code (toolbar toggle drives both themes). State, if any
   needed, lives in a top-level component (never a hook in the `render` arrow - the 0021 learning).
   Stories:
   - **Basic** - brand + a few links + an actions cluster (a Button, an Avatar).
   - **ActiveLink** - one link marked `active`.
   - **Responsive** - a constrained-width wrapper (e.g. `max-w-md`) or a story note so the ☰ panel
     is exercisable; show the disclosure open/closed. (Storybook viewport addon optional; a narrow
     container is enough to render the mobile layout.)
   - both themes via the toggle.

5. **Docs (reflection - in this PR):**
   - `README.md` - TopNav now live under Branches (Dialog · TopNav); keep forward items honest
     (SideNav still to come).
   - `docs/overview/features.md` - add a **TopNav (0025)** entry under the Branches section.
   - `docs/overview/architecture.md` - note TopNav as the first **non-portalled, stateful** Branch
     (hand-rolled disclosure: context + `aria-expanded`/`aria-controls` + Esc/outside-click +
     focus-return, no Radix, no new dep, no new token), contrasted with Dialog (portalled/Radix).
   - `docs/overview/learnings.md` - only if a genuine friction/lesson emerges.

## Verification (before commit)

From the worktree root: `pnpm build`, `pnpm test` (TopNav tests green), `pnpm lint`,
`pnpm format:check` - all green. Grep the built Storybook/canopy source to confirm the responsive
literals (`md:hidden`, `md:flex`) and the `aria-current` styling are present. Confirm
`@rogueoak/canopy/branches` still resolves and exports both Dialog and TopNav.
