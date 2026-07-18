# 0039 - Toggle

## Problem

Canopy has a `Switch` (0010) for a form-style on/off value and a `Button` (0005) for one-shot
actions, but no **toggle**: a two-state *pressed* button that flips between an on and off look and
reports its state with `aria-pressed`. This is the bold / italic / underline button in a rich-text
toolbar, the "grid vs list" view switch, the "mute" button that stays lit while active - a control
that reads as a button, not as a form field. Switch is deliberately a settings value
(`role="switch"`, `aria-checked`, a sliding track); it is the wrong semantic and the wrong shape
for an in-toolbar pressed button, and 0010 keeps that behaviour out of scope.

shadcn ships a Toggle on `@radix-ui/react-toggle` for exactly this, and canopy is missing the
primitive. Without it a consumer hand-rolls a `Button` plus manual `aria-pressed` and
`data-state` styling every time. Toggle is also the atom that **ToggleGroup (0049)** composes into
a segmented, single- or multi-select bar; shipping the single Toggle first gives 0049 a styled,
tested part to build on. This is for anyone building a toolbar, a formatting bar, or a compact
mode/view switcher where the control needs to look and behave like a button that stays pressed.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Toggle`, a two-state pressed button
  built on `@radix-ui/react-toggle`, so it ships the correct `aria-pressed` and the full
  controlled (`pressed` + `onPressedChange`) and uncontrolled (`defaultPressed`) APIs.
- **States**: off and on, driven by Radix's `data-state="off"` / `data-state="on"`; the on state
  applies a filled background (`bg-accent` on the default variant, `bg-muted` on the outline
  variant per the raised-surface / neutral token vocabulary) with `text-text`. Hover and
  focus-visible are always visible; `disabled` renders the button inert.
- **Variants + sizes**: `variant` `default` / `outline` and `size` `sm` / `md` / `lg`, mapped by
  cva to full literal token-utility strings.
- **a11y**: it is a real `button` with `aria-pressed` reflecting the pressed state (supplied by
  Radix); keyboard operable (`Space` / `Enter` toggle, `Tab` reaches it); focus-visible ring.
- **Theming**: styled with the 0005 recipe (semantic-token Tailwind utilities, `cn()` merge,
  `forwardRef` + native prop spread), so it themes light / dark through the token layer with no
  `dark:` on the common path.
- **Docs**: a Storybook catalog entry (playground, variants, sizes, states incl. pressed /
  disabled, icon content) in both themes; canopy README component list and the `overview/` living
  docs updated on completion.

## Scope

### In
- `packages/canopy/src/seeds/Toggle.tsx` (+ `Toggle.test.tsx`) - the component, styled per the
  0005 recipe: cva mapping `variant` x `size` to full literal token classes, `cn()` merge (caller
  `className` wins), `React.forwardRef` with `React.ComponentRef` and a full native prop spread.
- Barrel export `export { Toggle, toggleVariants } from './Toggle';` and
  `export type { ToggleProps } from './Toggle';` added to `packages/canopy/src/seeds/index.ts`
  (Seeds are also re-exported from `src/index.ts` root).
- One new runtime dependency: **`@radix-ui/react-toggle`**, added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix deps; `pnpm install`
  at the repo root after.
- `variant` (`default` / `outline`) and `size` (`sm` / `md` / `lg`) via cva; on-state styling
  through Radix's `data-[state=on]:` variants (raised-surface / neutral tokens, never a palette
  value, no `dark:`).
- Story `apps/storybook/src/Toggle.stories.tsx` importing from `@rogueoak/canopy/seeds`. Stories:
  Playground, Variants (default / outline), Sizes (sm / md / lg), States (off / on / disabled),
  and WithIcon (a bold-style icon child) - no per-story theme code; light / dark via the toolbar.
- Tests (`Toggle.test.tsx`): renders as a `button` with `aria-pressed`; click toggles the pressed
  state and reflects `data-state`; each variant and size renders; `Space` / `Enter` toggle
  (keyboard); controlled (`pressed` + `onPressedChange`) **and** uncontrolled (`defaultPressed`);
  `disabled` is inert (no toggle on click); `className` merge (caller wins); `ref` forwarding.
- Canopy `README.md` component list, `overview/features.md`, and `overview/architecture.md`
  (recording the new `@radix-ui/react-toggle` dependency in the canopy footprint) updated on
  completion.

### Out
- **ToggleGroup (0049)** - the segmented single- / multi-select bar built on
  `@radix-ui/react-toggle-group`. Toggle is the atom it will compose; the group is its own spec.
- **Switch (0010)** - unchanged. Toggle is additive and semantically distinct (pressed button vs
  form on/off); this spec does not touch Switch.
- A separate **icon-button** primitive or built-in icon slot - callers pass icon content as
  children; a dedicated icon-only affordance is a later concern.
- Any other existing component - no unrelated changes.

## Approach

**Primitive stack: `@radix-ui/react-toggle` + the 0005 canopy recipe.** Canopy is built entirely
on Radix primitives; Toggle follows suit rather than re-deriving pressed-button state by hand.
Radix `Toggle.Root` owns the two-state logic and emits the correct `button` element,
`aria-pressed`, controlled (`pressed` / `onPressedChange`) and uncontrolled (`defaultPressed`)
APIs, and the `data-state="on" | "off"` attribute we style against - mirroring how `Switch` (0010)
sits on `@radix-ui/react-switch`. It is added as a runtime **dependency** of `@rogueoak/canopy` and
externalized in tsup exactly like the other Radix deps (per the canopy externalization rule).

**Part surface.** A single Seed, no sub-parts:
- `Toggle` - the styled `Toggle.Root`. Its props are
  `React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>` intersected with
  `VariantProps<typeof toggleVariants>`, so it accepts the full Radix API plus `variant` / `size`.
- `toggleVariants` (cva) and the `ToggleProps` type are exported so ToggleGroup (0049) can reuse
  the exact same class recipe on its items and stay visually identical.

**Styling & recipe.** cva maps `variant` x `size` to FULL LITERAL token-utility strings (so
Tailwind v4's source scanner emits each one). Base classes give the button shape, focus-visible
ring (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset`), a `cursor-pointer` (matching
Button's base recipe), a color transition, and the toggle-family disabled treatment
(`disabled:pointer-events-none disabled:opacity-50`). `default` is a bare button that fills to
`data-[state=on]:bg-accent data-[state=on]:text-text` when pressed with a `hover:bg-muted`
resting hover; `outline` adds `border border-border bg-surface` and fills to
`data-[state=on]:bg-muted` when pressed. On-state uses neutral / accent semantic tokens only - no
palette, and **no `dark:` on the common path** (light / dark flips through the token layer, 0004).
`cn()` merges the caller `className` last so callers can override.

**Accessibility.** Radix supplies the `button` role and `aria-pressed`; `Space` / `Enter` toggle
and `Tab` reaches the control natively. The focus-visible ring on the Root keeps keyboard focus
visible. Icon-only usages should pass an `aria-label` (documented in the story); the a11y promises
are guarded by observable tests (button role + `aria-pressed` present, keyboard toggle works,
disabled does not toggle), per the repo learning that a11y is verified by outcomes, not scaffolding.

**Motion.** None beyond a `transition-colors` on the state change; no keyframe animation.

**Trade-offs.**
- *New dep (`@radix-ui/react-toggle`)*: one more runtime dep on canopy, but it is the exact
  missing primitive, tiny, and from the same Radix family as every other canopy component;
  hand-rolling pressed-button state would be more code to own and easy to get subtly wrong on
  `aria-pressed` / controlled semantics. Security / architecture personas should weigh the
  new-dependency surface in review.
- *Ship Toggle before ToggleGroup*: the single atom is independently useful (a lone formatting
  button) and gives 0049 a tested, styled part; exporting `toggleVariants` avoids a later
  style fork between the two.
- *`default` fills with `bg-accent` vs `bg-muted`*: default uses the accent fill so a pressed
  toolbar button reads clearly as active; outline uses the quieter `bg-muted` so a bordered
  segment does not shout. Both are semantic tokens and theme-agnostic.

## Acceptance

- [ ] `Toggle` (with `toggleVariants` and `ToggleProps`) ships from `@rogueoak/canopy/seeds`
      (exported via `seeds/index.ts`), built on `@radix-ui/react-toggle` (added to
      `packages/canopy/package.json` dependencies **and** externalized in
      `packages/canopy/tsup.config.ts`); semantic tokens only, **no `dark:` on the common path**.
- [ ] Renders a real `button` with `aria-pressed`; clicking toggles the pressed state and flips
      `data-state` between `off` and `on`.
- [ ] `variant` `default` / `outline` and `size` `sm` / `md` / `lg` each render, mapped by cva to
      full literal token classes; the on state applies the filled tokens (`bg-accent` default /
      `bg-muted` outline) and the focus-visible ring is present.
- [ ] Keyboard: `Space` / `Enter` toggle and `Tab` reaches the control; `disabled` renders it
      inert (no toggle on click, `disabled:opacity-50`).
- [ ] Controlled (`pressed` + `onPressedChange`) **and** uncontrolled (`defaultPressed`) both work;
      `className` merge lets the caller win; `ref` is forwarded.
- [ ] Storybook catalog entry with Playground, Variants, Sizes, States (off / on / disabled), and
      WithIcon stories, rendering correctly in **both** themes; `pnpm storybook` build is green.
- [ ] Tests cover: button role + `aria-pressed`, click toggles + reflects `data-state`, each
      variant / size, keyboard toggle, controlled + uncontrolled, disabled inert, `className` merge,
      `ref` forwarding. `pnpm test` / `pnpm lint` / `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Toggle; `overview/features.md` (new capability)
      and `overview/architecture.md` (new `@radix-ui/react-toggle` primitive in the canopy
      dependency footprint) updated on completion.
