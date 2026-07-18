# 0049 - ToggleGroup

## Problem

Canopy ships `Toggle` (0039), a single two-state pressed button on `@radix-ui/react-toggle`, and
`ButtonGroup`-style joined segmenting on `Button` (0005), but it has no **ToggleGroup**: a set of
Toggles wired together as one control where selection is coordinated across the members - a text
alignment picker (left / center / right, single choice), a formatting bar (bold + italic +
underline, several on at once), or a "grid vs list vs board" view switch. Today a consumer who
needs "pick one of these segments" or "toggle several of these together" has to lay out lone
`Toggle` (0039) atoms and hand-roll the shared selection state, the roving-tabindex keyboard
model, the radiogroup-like ARIA for the single-choice case, and the joined segmented styling -
re-deriving exactly the coordination the design system exists to own once.

shadcn ships a ToggleGroup on `@radix-ui/react-toggle-group` for precisely this, and canopy is
missing it. This is for anyone building a toolbar, a formatting bar, a segmented view switch, or a
compact filter bar where several pressed buttons act as one control with either single or multiple
selection. It composes the existing `Toggle` (0039) atom (reusing its `toggleVariants` and
`size` / `variant` recipe through context) and borrows the joined, segmented look of the
`Button` (0005) group idiom, so the members stay visually identical to a lone Toggle while reading
as a single grouped control.

## Outcome

- `@rogueoak/canopy/twigs` exports an accessible, themed `ToggleGroup` family built on
  `@radix-ui/react-toggle-group`: a `ToggleGroup` root and a `ToggleGroupItem` member, so callers
  compose `<ToggleGroup><ToggleGroupItem/>...</ToggleGroup>` like the other Twigs.
- **Selection modes**: `type="single"` (at most one item on, single-choice, radiogroup-like) and
  `type="multiple"` (any number on) from the one Radix API, with controlled (`value` +
  `onValueChange`) and uncontrolled (`defaultValue`) both supported; `value` is a `string` in
  single mode and `string[]` in multiple mode.
- **Shared variant / size**: `variant` (`default` / `outline`) and `size` (`sm` / `md` / `lg`)
  set once on the root are shared to every `ToggleGroupItem` through **context**, so items reuse
  the exact `toggleVariants` recipe from `Toggle` (0039) and stay visually identical to a lone
  Toggle; an item may still be overridden individually.
- **States**: each item is off / on via Radix's `data-state="off"` / `data-state="on"` (the same
  filled tokens as Toggle), hover and focus-visible always visible, and the whole group or a single
  item can be `disabled` and rendered inert.
- **Joined segmented styling**: items are butted together into one bar (shared borders, outer
  corners rounded, inner corners squared) like the `Button` (0005) group idiom, with full literal
  token classes only.
- **Keyboard + a11y**: **roving tabindex** across the group (one tab stop; `Arrow` keys move
  between items) via Radix; correct grouping roles - `radiogroup` semantics in single mode and a
  plain `group` in multiple mode - with `aria-pressed` / `aria-checked` supplied by the primitive.
- **Theming**: styled with the 0005 recipe (semantic-token Tailwind utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light / dark through the token layer with **no
  `dark:` on the common path**.
- **Docs**: a Storybook catalog entry (playground, single vs multiple, variants, sizes, disabled,
  icon content) in both themes; canopy README component list and the `overview/` living docs
  updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/ToggleGroup.tsx` (+ `ToggleGroup.test.tsx`) - the `ToggleGroup` root
  and `ToggleGroupItem` member, styled per the 0005 recipe: `toggleVariants` (reused from
  `Toggle`, 0039) mapping `variant` x `size` to full literal token classes, a small React
  **context** carrying `variant` / `size` from root to item, `cn()` merge (caller `className`
  wins), `React.forwardRef` with `React.ComponentRef` and a full native prop spread on both parts.
- Barrel export `export { ToggleGroup, ToggleGroupItem } from './ToggleGroup';` and
  `export type { ToggleGroupProps, ToggleGroupItemProps } from './ToggleGroup';` added to
  `packages/canopy/src/twigs/index.ts`.
- One new runtime dependency: **`@radix-ui/react-toggle-group`**, added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix deps; `pnpm install`
  at the repo root after.
- Both `type="single"` and `type="multiple"` selection through the one Radix API (controlled +
  uncontrolled), with `variant` / `size` shared to items via context and the joined segmented
  layout (shared borders, rounded outer corners) built with literal token classes.
- Story `apps/storybook/src/ToggleGroup.stories.tsx` importing from `@rogueoak/canopy/twigs`.
  Stories: Playground, Single (alignment-style, single choice), Multiple (formatting-style, several
  on), Variants (default / outline), Sizes (sm / md / lg), and Disabled - no per-story theme code;
  light / dark via the toolbar.
- Tests (`ToggleGroup.test.tsx`): renders the grouping role (radiogroup in single, group in
  multiple); single mode selects at most one and switching selection deselects the prior item;
  multiple mode toggles items independently; controlled (`value` + `onValueChange`) **and**
  uncontrolled (`defaultValue`); `variant` / `size` from the root reach the items (observable
  on-state tokens / rendered class); roving keyboard - one tab stop, `Arrow` keys move focus, and
  the focused item toggles on `Enter` / `Space`; `disabled` group and disabled item are inert;
  `className` merge (caller wins) on root and item; `ref` forwarded on both parts.
- Canopy `README.md` component list, `overview/features.md`, and `overview/architecture.md`
  (recording the new `@radix-ui/react-toggle-group` dependency in the canopy footprint) updated on
  completion.

### Out
- **Toggle (0039)** - unchanged. ToggleGroup composes it and reuses its `toggleVariants`; this spec
  does not modify the single Toggle's public API or source.
- **A standalone `ButtonGroup` primitive** - the segmented styling here is scoped to ToggleGroup;
  lifting a general joined-button container out is a separate, later concern.
- **Overflow / wrapping / scroll behaviour** for very wide bars (a "more" menu, horizontal scroll)
  - v1 lays the items in a single flex row; overflow handling is a clean follow-up.
- **Vertical orientation as a first-class themed layout** - Radix supports `orientation`, but v1
  styles the horizontal segmented bar; vertical joined styling is deferred.
- Any other existing component - no unrelated changes.

## Approach

**Primitive stack: `@radix-ui/react-toggle-group` + the 0005 canopy recipe.** Canopy is built
entirely on Radix primitives; ToggleGroup follows suit rather than re-deriving shared selection and
roving-focus state by hand. Radix `ToggleGroup.Root` owns the `type="single" | "multiple"`
selection logic, the controlled (`value` / `onValueChange`) and uncontrolled (`defaultValue`)
APIs, the roving-tabindex keyboard model, and the grouping ARIA (radiogroup semantics for single,
group for multiple); `ToggleGroup.Item` emits each pressed button with `data-state="on" | "off"` -
exactly mirroring how `Toggle` (0039) sits on `@radix-ui/react-toggle` and reusing that atom's
look. `@radix-ui/react-toggle-group` is added as a runtime **dependency** of `@rogueoak/canopy` and
externalized in tsup exactly like the other Radix deps (per the canopy externalization rule).

**Layer decision (Twig).** ToggleGroup composes 2+ `Toggle`-style members and shares `variant` /
`size` down through **context**; the interaction state (which items are on, roving focus) is owned
by the Radix primitive rather than by hand-written canopy state, and there is no portal. That
places it in `src/twigs/` (composes atoms via context, no portal), not a Branch.

**Part surface (mirrors the shadcn toggle-group, canopy-styled).** A two-part family:
- `ToggleGroup` - the styled `ToggleGroup.Root`. Props are
  `React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>` intersected with
  `VariantProps<typeof toggleVariants>`, so it accepts the full Radix API (`type`, `value`,
  `defaultValue`, `onValueChange`, `disabled`, `orientation`) plus `variant` / `size`. It provides
  `variant` / `size` to items through a small React context and renders the joined segmented row
  (`inline-flex`, shared `border-border`, `rounded-md` on the outer corners) with literal token
  classes.
- `ToggleGroupItem` - the styled `ToggleGroup.Item`. It reads `variant` / `size` from context
  (falling back to its own props) and applies `toggleVariants({ variant, size })` reused from
  `Toggle` (0039), plus the segment-join classes (squared inner corners, single shared border edge)
  so members butt together into one bar while an individual member reads identically to a lone
  Toggle.

**Styling & recipe.** The item reuses `toggleVariants` exported by `Toggle` (0039) - FULL LITERAL
token-utility strings (so Tailwind v4's source scanner emits each) - so a grouped item is visually
identical to a lone Toggle. Base group classes give the joined row and shared focus-visible ring
(`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset`); the on state uses the same
neutral / accent semantic tokens as Toggle via Radix's `data-[state=on]:` variants, and the
toggle-family disabled treatment (`disabled:pointer-events-none disabled:opacity-50`). No palette
values, and **no `dark:` on the common path** (light / dark flips through the token layer, 0004).
`cn()` merges the caller `className` last on both root and item so callers can override.

**Accessibility.** Radix supplies the grouping role (radiogroup semantics in single mode, group in
multiple), the roving tabindex (one tab stop; `Arrow` keys move between items), and the per-item
pressed / checked state; each item is a real `button` operable with `Enter` / `Space`. The
focus-visible ring keeps keyboard focus visible on the active item. Icon-only usages pass an
`aria-label` per item (documented in the story). The a11y promises are guarded by **observable
tests** (grouping role present, single-mode single-selection enforced, roving keyboard moves focus
and toggles, disabled does not toggle), per the repo learning that a11y is verified by outcomes,
not scaffolding.

**Motion.** None beyond a `transition-colors` on the state change; no keyframe animation.

**Trade-offs.**
- *New dep (`@radix-ui/react-toggle-group`)*: one more runtime dep on canopy, but it is the exact
  missing primitive, tiny, and from the same Radix family as `Toggle` (0039) and every other canopy
  component; hand-rolling shared selection, roving focus, and radiogroup ARIA would be more code to
  own and easy to get subtly wrong. Security / architecture personas should weigh the
  new-dependency surface in review.
- *Share `variant` / `size` via context vs per-item props*: a context set once on the root keeps
  the caller surface small and guarantees a uniform bar, at the cost of a tiny context module; an
  item may still override locally when a mixed bar is wanted. Chosen for the common uniform case.
- *One `type` prop (single / multiple) vs two components*: a single component with Radix's `type`
  switch mirrors the primitive and keeps one mental model; the value-type discrimination
  (`string` vs `string[]`) is the documented cost.
- *Reuse `toggleVariants` from Toggle (0039) vs a fresh recipe*: reusing the exported variants
  avoids a style fork between a lone Toggle and a grouped one; the group only adds the segment-join
  classes on top.

## Acceptance

- [ ] `ToggleGroup` and `ToggleGroupItem` (with `ToggleGroupProps` / `ToggleGroupItemProps`) ship
      from `@rogueoak/canopy/twigs` (exported via `twigs/index.ts`), built on
      `@radix-ui/react-toggle-group` (added to `packages/canopy/package.json` dependencies **and**
      externalized in `packages/canopy/tsup.config.ts`); reuse `toggleVariants` from `Toggle`
      (0039); semantic tokens only, **no `dark:` on the common path**.
- [ ] **Single** (`type="single"`): exposes radiogroup semantics; at most one item is on; selecting
      a different item deselects the prior one; controlled (`value` + `onValueChange`) and
      uncontrolled (`defaultValue`) both work.
- [ ] **Multiple** (`type="multiple"`): exposes group semantics; items toggle independently; several
      can be on at once; controlled and uncontrolled both work.
- [ ] `variant` (`default` / `outline`) and `size` (`sm` / `md` / `lg`) set on the root reach every
      item through context (observable on-state tokens on the items), and items butt together into a
      joined segmented bar (rounded outer corners, squared inner) with full literal token classes;
      an item may override locally.
- [ ] Keyboard: roving tabindex gives the group one tab stop; `Arrow` keys move focus between items;
      the focused item toggles on `Enter` / `Space`; a disabled group and a disabled item render
      inert (no toggle, `disabled:opacity-50`).
- [ ] `className` merge lets the caller win on both root and item; `ref` is forwarded on both parts.
- [ ] Storybook catalog entry with Playground, Single, Multiple, Variants, Sizes, and Disabled
      stories, rendering correctly in **both** themes; `pnpm storybook` build is green.
- [ ] Tests cover: grouping role (radiogroup single / group multiple), single-mode single-selection,
      multiple-mode independent toggle, controlled + uncontrolled, `variant` / `size` reach items via
      context, roving keyboard (one tab stop, arrows move focus, `Enter` / `Space` toggle), disabled
      group + item inert, `className` merge, `ref` forwarding. `pnpm test` / `pnpm lint` /
      `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes ToggleGroup; `overview/features.md` (new
      capability) and `overview/architecture.md` (new `@radix-ui/react-toggle-group` primitive in the
      canopy dependency footprint) updated on completion.
