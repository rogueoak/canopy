# Plan 0026 — SideNav (collapsible + responsive)

Source: `docs/specs/0026-side-nav.md`. Build in worktree `.worktrees/0026-side-nav` on branch
`0026-side-nav` (off `main`, which has the Branches layer + Dialog). Test before commit. Personas
review the PR. **Note:** TopNav (0025) is being built in parallel on its own branch; both add to
`src/branches/index.ts` + the overview docs — expect a small rebase when the second PR merges.

## Key decisions (locked for this build)

- **No new dependency.** The mobile drawer uses **`@radix-ui/react-dialog` directly** (already a
  canopy dep from 0024) — Radix gives the focus trap, return-focus, scroll lock, `Esc`, and scrim
  dismiss for free; we style its `Overlay` as the `bg-overlay/80` scrim and its `Content` as a
  left-anchored full-height panel. This is the spec's "reuse Dialog's pattern, don't re-invent modal
  mechanics" — reusing the Radix **primitive**, NOT importing canopy's centered `Dialog` component
  (whose centering/`max-w-lg`/baked close-button would fight a side drawer). Add
  `@radix-ui/react-dialog` to tsup `external` is already done (0024) — nothing to change there.
- **Render the nav content ONCE.** A `useIsMobile()` hook (matchMedia `(max-width: 767px)`,
  SSR-safe default `false`) picks the wrapper: desktop → a static `<aside>` rail; mobile → the
  Radix-Dialog drawer. The single `<nav aria-label>` lives inside whichever wrapper renders, so
  there is exactly **one** navigation landmark and no duplicated `aria-current`.
- **No new token.** Rail/drawer/scrim/items use existing semantic tokens (`bg-surface`,
  `border-border`, `color-overlay`, `muted`, the text roles). No `dark:`.
- Ships on the existing `@rogueoak/canopy/branches` subpath — no infra change; just extend the
  barrel.

Model on: `src/branches/Dialog.tsx` (Radix-dialog usage, overlay/scrim classes, focus-return),
`src/twigs/FormField.tsx` (compound + React context + `useId`), `src/seeds/Tooltip.tsx` +
`TooltipProvider` (collapsed-label tooltips), `src/seeds/Button.tsx` (trigger + collapse toggle).

## Steps

1. **`src/branches/SideNav.tsx`** — the compound:
   - `useIsMobile()` — `useState(false)` + an effect subscribing to
     `window.matchMedia('(max-width: 767px)')` (`change` listener; set initial from `.matches`).
     SSR/first-render returns `false` (desktop).
   - `SideNavContext` — `{ collapsed, open, setOpen, mobile, drawerId, triggerRef, closeDrawer }`.
     `drawerId` from `useId` (so `SideNavTrigger aria-controls` matches the drawer).
   - `SideNav` (root) — props: `collapsed?`/`defaultCollapsed?`/`onCollapsedChange?` (controlled or
     uncontrolled desktop collapse), `open?`/`onOpenChange?`/`defaultOpen?` (mobile drawer; may be
     internal-only with the trigger driving it), `aria-label?` (default `"Main"`). Wraps everything
     in a **`TooltipProvider`** (so collapsed item tooltips work with no consumer setup). Then:
     - **desktop** (`!mobile`): a static `<aside>` → `<nav aria-label>` landmark; column
       `flex h-full flex-col border-r border-border bg-surface text-text`, width
       `w-60` expanded / `w-16` collapsed (full-literal both), a `transition-[width]`.
     - **mobile** (`mobile`): `<DialogPrimitive.Root open={open} onOpenChange={setOpen}>` →
       `Trigger` is the separate `SideNavTrigger` (rendered by the consumer; it calls
       `setOpen(true)`), `Portal` → `Overlay` (`fixed inset-0 z-50 bg-overlay/80` +
       `motion-reduce:animate-none`) + `Content` (`fixed inset-y-0 left-0 z-50 w-60 border-r
       border-border bg-surface p-2` left-drawer) containing an **sr-only `DialogPrimitive.Title`**
       (e.g. "Navigation" — Radix requires a Title for a11y) and the `<nav aria-label>` landmark
       with the children. Radix owns focus trap / return-to-trigger / Esc / outside-click / scroll
       lock. On mobile the rail is always expanded (ignore `collapsed`).
   - `SideNavHeader` / `SideNavFooter` — optional slots: `flex items-center gap-2 p-2` (header at
     top, footer `mt-auto`). `asChild` on Header is optional; keep simple.
   - `SideNavSection` — `role="group"`; optional `label` → a muted `text-caption px-3 py-1` heading
     that is **hidden when `collapsed`** (desktop collapsed only). Children stack `flex flex-col
     gap-1`.
   - `SideNavItem` — a nav link. Default `<a>`, `asChild` (Radix `Slot`) to wrap a router `<Link>`.
     Layout: `flex items-center gap-3 rounded-md px-3 py-2 text-body-sm` + the shared focus-visible
     ring. `active?` → `aria-current={active ? 'page' : undefined}` + `bg-muted text-text font-medium`;
     idle `text-text-muted hover:bg-muted hover:text-text`. Leading **icon** slot (the consumer
     passes an `icon` prop or the first child — pick one: an `icon?: React.ReactNode` prop is
     cleanest; render it in a fixed `h-5 w-5 shrink-0` box). **Label** is the children/`label`.
     **When `collapsed`** (desktop): center the icon (`justify-center`), visually hide the label
     (`sr-only`), and **wrap the item in a `Tooltip`** whose `TooltipContent` is the label (so the
     label shows on hover/focus); the link keeps an accessible name (the `sr-only` label inside the
     anchor satisfies this — never render an icon-only link with no name). On mobile/expanded the
     label shows inline and no Tooltip wraps it. Clicking an item **closes the mobile drawer**
     (`closeDrawer()`).
   - `SideNavTrigger` — the mobile menu Button (`variant="ghost" size="icon"`, hamburger SVG,
     `aria-label="Open navigation"`), `md:hidden`, `aria-expanded={open}`,
     `aria-controls={drawerId}`; `onClick` → `setOpen(true)`. Registers its ref in context for
     Radix's return-focus (Radix Dialog returns focus to the element that had it; ensure the trigger
     is that element, or pass it as the Dialog trigger).
   - `SideNavCollapseToggle` — a Button that flips `collapsed` (chevron SVG, `aria-label="Collapse
     sidebar"`/`"Expand sidebar"` by state), for composing into Header/Footer. Desktop only
     (`max-md:hidden` or just rendered in the desktop aside).
   - Rules: `forwardRef` + native prop spread + `displayName` on every styled part, full-literal
     classes (incl. `w-60`/`w-16`/`md:hidden`/`sr-only`), `React.ComponentRef` for Radix refs,
     file-top doc comment, NO `dark:`, semantic tokens only. Export all prop types.

2. **`src/branches/index.ts`** — add the SideNav family (`SideNav`, `SideNavHeader`,
   `SideNavFooter`, `SideNavSection`, `SideNavItem`, `SideNavTrigger`, `SideNavCollapseToggle`) +
   their prop types to the barrel (keep the Dialog exports).

3. **`src/branches/SideNav.test.tsx`** — Vitest + Testing Library + `user-event`. **Stub
   `window.matchMedia`** in a `beforeAll` (jsdom lacks it) — a factory that lets each test force
   desktop (`matches:false`) or mobile (`matches:true`). Also mirror Dialog's jsdom stubs
   (`hasPointerCapture`/`releasePointerCapture`/`scrollIntoView`) for the Radix drawer tests.
   Assert behaviour:
   - desktop: renders the `<nav>` landmark with its `aria-label`; an `active` item has
     `aria-current="page"`, a non-active one does not.
   - collapse: with `collapsed` (or via the toggle) the rail width class switches and section/item
     labels are visually hidden (`sr-only`) while the item keeps an accessible name (the link's
     accessible name still equals the label).
   - drawer (force mobile): `SideNavTrigger` has `aria-expanded=false`/`aria-controls`; clicking it
     opens a `role="dialog"` drawer containing the nav; `Esc` closes it and returns focus to the
     trigger; an outside (overlay) click closes it.
   - `asChild` on `SideNavItem` renders the child `<a href>` with the classes.
   - `cn()` merges a caller `className`; ref forwards on the root.

4. **`apps/storybook/src/SideNav.stories.tsx`** — `title: 'Branches/SideNav'`, import SideNav from
   `@rogueoak/canopy/branches`, Button/Avatar from `/seeds`. Inline simple SVG icons for items
   (literal class names; no icon lib). Stories: **Expanded** (grouped sections + an active item),
   **Collapsed** (icon-rail; hover an item to show the Tooltip label — set `defaultCollapsed`),
   **MobileDrawer** (a top-level component holding `open` state + the `SideNavTrigger`, narrow
   container so the drawer path is exercisable). No per-story theme code; state in a top-level
   component (never a hook in the `render` arrow — the 0021 learning).

5. **Docs (reflection — in this PR):**
   - `README.md` — SideNav now live (Branches: Dialog · TopNav · SideNav). (If TopNav hasn't merged
     yet, still list it as the parallel sibling; keep forward items honest.)
   - `docs/overview/features.md` — a **SideNav (0026)** entry under the Branches section.
   - `docs/overview/architecture.md` — SideNav reuses `@radix-ui/react-dialog` (the existing dep)
     for its mobile drawer (the spec's "reuse Dialog's pattern" — Radix primitive, not the canopy
     Dialog component), with a `useIsMobile` matchMedia hook so the nav renders once (single
     landmark); collapsed labels ride the Tooltip Seed; no new dep, no new token.
   - `docs/overview/learnings.md` — capture any genuine friction (e.g. the single-render/landmark
     decision, or the Radix-Title-required-for-drawer-a11y point) if it rises to a reusable lesson.

## Verification (before commit)

From the worktree root: `pnpm build`, `pnpm test` (SideNav tests green), `pnpm lint`,
`pnpm format:check` — all green. Grep built output for the responsive/width literals
(`w-60`, `w-16`, `md:hidden`, `sr-only`) and confirm `@rogueoak/canopy/branches` exports Dialog +
SideNav.
