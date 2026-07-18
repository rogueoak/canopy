# 0046 - Collapsible

## Problem

Canopy has no primitive for a **single expand/collapse disclosure**: one trigger that shows or
hides one region of content. Consumers who need a "show more / show less" toggle, an expandable
row, or a foldaway sidebar section today either hand-roll the open state, ARIA wiring
(`aria-expanded` / `aria-controls`), and height animation themselves, or reach for the
multi-section **Accordion** (0052) and fight its one-of-many semantics for what is really a
lone toggle. shadcn ships a dedicated Collapsible on top of `@radix-ui/react-collapsible`
precisely because this disclosure is common and small; canopy is missing that gap.

This is for any surface with an optional, secondary block of content: "advanced options" in a
form, a collapsible filter group, expandable table detail, a foldable nav section. It sits one
notch below Accordion: Accordion (0052) manages a *set* of sections with roving state and
single/multiple expansion, while Collapsible is the *single* disclosure the Accordion is built
from. Twig layer, because it owns interaction state (open/closed) but does not portal.

## Outcome

- `@rogueoak/canopy/twigs` exports a `Collapsible` family with three parts: **`Collapsible`**
  (root), **`CollapsibleTrigger`** (the toggle button), and **`CollapsibleContent`** (the
  region that shows/hides), all built on `@radix-ui/react-collapsible`.
- **Open state** works both **controlled** (`open` + `onOpenChange`) and **uncontrolled**
  (`defaultOpen`), matching the Radix primitive surface.
- **Disabled**: setting `disabled` on the root makes the trigger inert and non-togglable, with
  the shared toggle-disabled tokens (`disabled:opacity-50` + `disabled:cursor-not-allowed`).
- **Animated height**: `CollapsibleContent` animates open/close via `data-state`
  (`data-[state=open]` / `data-[state=closed]`) using the Radix
  `--radix-collapsible-content-height` CSS var, gated behind `motion-reduce:animate-none` so
  reduced-motion users get an instant show/hide.
- **A11y**: the trigger is a real `button` carrying `aria-expanded` and `aria-controls`, and the
  content region is referenced by it - all supplied by the Radix primitive; guarded by
  observable tests (expanded state flips, content appears/hides, keyboard toggle works).
- **Theming**: styled with the 0005 recipe - full literal semantic-token utilities, `cn()`
  merge (caller `className` wins), `forwardRef` + native prop spread, `React.ComponentRef`, no
  `dark:` on the common path - so it themes light/dark through the token layer.
- **Docs**: a Storybook catalog entry (Playground, Uncontrolled, Controlled, Disabled,
  reduced-motion) in both themes; canopy `README.md` component list and the `overview/` living
  docs updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/Collapsible.tsx` (+ `packages/canopy/src/twigs/Collapsible.test.tsx`)
  - the `Collapsible` / `CollapsibleTrigger` / `CollapsibleContent` family, styled with the 0005
  recipe.
- Barrel export from `packages/canopy/src/twigs/index.ts` (both the three components and their
  prop types).
- One new runtime dependency: **`@radix-ui/react-collapsible`**, added to
  `packages/canopy/package.json` `dependencies` AND externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (matching every other Radix dep); run
  `pnpm install` at the repo root after.
- Controlled + uncontrolled open, `disabled` on the root, and `data-state`-driven height
  animation gated by `motion-reduce:animate-none`.
- Storybook story `apps/storybook/src/Collapsible.stories.tsx` importing from
  `@rogueoak/canopy/twigs`. Stories: **Playground**, **Uncontrolled** (`defaultOpen`),
  **Controlled** (external `open`/`onOpenChange` with a state button), **Disabled**, and a
  reduced-motion story - shown in light and dark via the toolbar (no per-story theme code).
- Tests (Vitest + Testing Library): renders trigger + hidden content; clicking the trigger
  expands and re-clicking collapses; `aria-expanded` flips and content appears/disappears;
  keyboard toggle (Enter / Space) works; `disabled` root leaves the trigger inert; controlled
  mode respects `open`/`onOpenChange` and uncontrolled mode respects `defaultOpen`; caller
  `className` merges (caller wins); `ref` forwards on each part.
- `README.md` component list, `docs/overview/features.md`, and `docs/overview/architecture.md`
  (including the new `@radix-ui/react-collapsible` dependency) updated on completion.

### Out
- **Accordion** (0052) - the multi-section, single/multiple-expand disclosure is a separate
  spec; Collapsible is the single-disclosure primitive it composes, and this spec does not touch
  it.
- **Trigger chevron / caret affordance as a built-in** - the trigger renders whatever children
  the caller passes; a rotating indicator is a story/example convention, not a mandated part.
- **Async / lazy content loading** (mount content only when first opened, loading state) -
  defer to a follow-up; v1 always renders the content region and lets Radix show/hide it.
- Changing any unrelated component; no edits outside the files listed in **In**.

## Approach

**Primitive stack: `@radix-ui/react-collapsible` + the 0005 recipe.** Canopy is built entirely
on Radix primitives; Collapsible follows suit. Radix supplies the open-state machine
(controlled `open`/`onOpenChange`, uncontrolled `defaultOpen`, `disabled`), the correct
`button` trigger with `aria-expanded` / `aria-controls`, and the `data-state` +
`--radix-collapsible-content-height` CSS variable that drives the height animation. We add only
canopy styling and the barrel export. The dep is added as a runtime **dependency** and
externalized in tsup exactly like the other Radix deps (per the canopy externalization rule).

**Part surface (mirrors shadcn/Radix, canopy-styled).** Thin wrappers, one per Radix part:
- `Collapsible` - the root; passes `open` / `defaultOpen` / `onOpenChange` / `disabled` straight
  through to `CollapsiblePrimitive.Root`. Typed as
  `React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>`.
- `CollapsibleTrigger` - wraps `CollapsiblePrimitive.Trigger` (a real `button`); styled with the
  focus-visible ring token set and the toggle-disabled tokens
  (`disabled:opacity-50 disabled:cursor-not-allowed`), `cursor-pointer` on the base to match the
  Button idiom. Supports `asChild` via the primitive so callers can render their own trigger
  element.
- `CollapsibleContent` - wraps `CollapsiblePrimitive.Content`; carries the
  `overflow-hidden` + `data-[state=open]:animate-...` / `data-[state=closed]:animate-...`
  height animation classes gated with `motion-reduce:animate-none`.

**Styling & recipe.** FULL LITERAL semantic-token utility strings (so Tailwind v4's scanner
emits each - no dynamic class names), `cn()` merge with caller `className` winning, `forwardRef`
on every part with a native prop spread, `React.ComponentRef` for ref typing (not the
deprecated `React.ElementRef`), semantic tokens only (`text-text`, `border-border`,
focus-visible ring tokens), and **no `dark:` on the common path** - light/dark is a token-layer
property. `displayName` set from the Radix part on each wrapper.

**Motion.** The open/close height transition uses `data-state` and the Radix content-height CSS
var. If a suitable collapsible keyframe is not already present in the Roots preset, add
`collapsible-down` / `collapsible-up` keyframes there (not inline) and reference them as
`animate-...` utilities; the animation is gated behind `motion-reduce:animate-none` so
reduced-motion users get an instant, un-animated toggle.

**Accessibility.** The Radix primitive provides the `button` trigger, `aria-expanded`, and the
`aria-controls` link to the content region; the content is hidden from the accessibility tree
when closed. We add no custom ARIA. These promises are guarded by observable tests (expanded
state flips, content appears/hides, keyboard toggle works, disabled trigger is inert), per the
repo learning that a11y is tested by outcomes, not scaffolding.

**Trade-offs / review flags.**
- *New dependency (`@radix-ui/react-collapsible`)*: one more runtime dep on canopy, but it is
  the exact missing primitive, small, first-party Radix, and consistent with the rest of the
  system; hand-rolling the open-state + ARIA + height-var wiring would be more code to own.
  Security/architecture personas should weigh the new-dependency surface in review.
- *Twig vs Seed*: placed at the Twig layer because it owns interaction (open/close) state across
  a trigger and a content region; it does not portal, so it is not a Branch.
- *Single disclosure vs Accordion overlap*: Collapsible deliberately stays the single-region
  primitive; multi-section behaviour lives in Accordion (0052), which composes this pattern.

## Acceptance

- [ ] `Collapsible`, `CollapsibleTrigger`, and `CollapsibleContent` (and their prop types) ship
      from `@rogueoak/canopy/twigs` via `packages/canopy/src/twigs/index.ts`, built on
      `@radix-ui/react-collapsible`.
- [ ] `@radix-ui/react-collapsible` is added to `packages/canopy/package.json` dependencies AND
      externalized in `packages/canopy/tsup.config.ts`; `pnpm install` run at the root.
- [ ] Recipe obeyed: full literal semantic-token utilities, `cn()` merge (caller `className`
      wins), `forwardRef` + native prop spread, `React.ComponentRef`, semantic tokens only, and
      **no `dark:` on the common path**.
- [ ] **Uncontrolled** (`defaultOpen`) and **controlled** (`open` + `onOpenChange`) open state
      both work; clicking / keyboard-toggling the trigger expands and collapses the content.
- [ ] A11y: trigger is a real `button` with `aria-expanded` that flips and `aria-controls`
      linking the content; keyboard toggle (Enter / Space) works; content is hidden when closed.
- [ ] `disabled` on the root renders the trigger inert with the toggle-disabled tokens
      (`disabled:opacity-50 disabled:cursor-not-allowed`) and it cannot be toggled.
- [ ] `CollapsibleContent` animates height via `data-state`, gated behind
      `motion-reduce:animate-none` (any new keyframe added to the Roots preset, not inline).
- [ ] Storybook catalog entry with Playground, Uncontrolled, Controlled, Disabled, and
      reduced-motion stories in both themes; `pnpm storybook` build is green.
- [ ] Tests cover: render + hidden content, click expand/collapse, `aria-expanded` flip +
      content appears/hides, keyboard toggle, disabled inert, controlled `open`/`onOpenChange`,
      uncontrolled `defaultOpen`, `className` merge (caller wins), and `ref` forwarding on each
      part.
- [ ] `pnpm test`, `pnpm lint`, and `pnpm build` all pass from the repo root.
- [ ] Canopy `README.md` component list includes Collapsible; `docs/overview/features.md` (new
      capability) and `docs/overview/architecture.md` (new `@radix-ui/react-collapsible`
      dependency in the canopy footprint) updated on completion.
