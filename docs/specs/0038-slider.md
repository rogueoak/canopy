# 0038 - Slider

## Problem

Canopy has form-value Seeds for choosing among discrete options (`Checkbox` 0011, `RadioGroup`
0014, `Switch` 0012, `Select` 0013) and for free text (`Input` 0006, `Textarea` 0007), but no
control for picking a **number from a continuous range** by dragging. A volume level, a price
filter, an opacity or zoom setting, a min/max range filter - all of these want a slider, and
today a consumer has to hand-roll one against pointer math, keyboard handling, and ARIA
(`role="slider"`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`), re-implementing the same
accessible machinery the design system exists to own once.

shadcn/ui fills this gap with a Slider built on `@radix-ui/react-slider`; canopy has every other
shadcn form primitive on its Radix equivalent but not this one. This spec adds the **Slider** Seed
for any form or filter surface that captures a bounded numeric value: a single value or a **range**
(two thumbs), driven by mouse, touch, or keyboard, and pairing with `Label` (0009) / `FormField`
like the other field Seeds.

## Outcome

- `@rogueoak/canopy/seeds` exports a themed, accessible `Slider` built on
  `@radix-ui/react-slider`.
- **Single value**: one thumb over a track; the filled portion (range) grows from `min` to the
  thumb. **Range**: pass two values and the component renders **two thumbs** with the filled range
  between them.
- **Controlled and uncontrolled**: `value` / `onValueChange` for controlled use, `defaultValue`
  for uncontrolled - value is always a number array, matching the Radix surface (one entry per
  thumb).
- **Bounds and stepping**: `min`, `max`, and `step` constrain and quantize the value; `orientation`
  defaults to horizontal.
- **Keyboard + a11y**: each thumb is a `role="slider"` with `aria-valuenow`/`aria-valuemin`/
  `aria-valuemax`; Arrow keys nudge by `step`, `Home`/`End` jump to `min`/`max`, `PageUp`/
  `PageDown` step larger - all provided by Radix. `disabled` makes the control inert; native
  `aria-invalid` applies a danger ring on the thumbs.
- **Theming**: styled with the 0005 recipe - the track is `bg-muted`, the filled range is
  `bg-primary`, and each thumb is a rounded token surface with a focus-visible ring. Themes
  light/dark through the token layer with no `dark:` on the common path.
- **Docs**: a Storybook catalog entry (single, range, steps/marks, disabled, invalid, vertical,
  both themes); canopy `README.md` component list and the `overview/` living docs updated on
  completion.

## Scope

### In

- `packages/canopy/src/seeds/Slider.tsx` (+ `packages/canopy/src/seeds/Slider.test.tsx`) - the
  component, exported from `packages/canopy/src/seeds/index.ts` (Seeds are re-exported from the
  package root, so it also ships from `@rogueoak/canopy`).
- One `Slider` component wrapping `@radix-ui/react-slider` `Root` + `Track` + `Range` + `Thumb`;
  the thumb count is derived from `value`/`defaultValue` length so **single value and range (two
  thumbs)** come from one API with no extra prop.
- Props: `value` / `defaultValue` / `onValueChange` (controlled + uncontrolled), `min`, `max`,
  `step`, `orientation`, `disabled`, plus native prop spread and `ref` forwarding to the Root.
  `aria-invalid` is honoured as a native attribute (no custom prop), applying the danger ring per
  the recipe.
- One new runtime dependency, **`@radix-ui/react-slider`**, added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (matching every other Radix dep); run
  `pnpm install` at the repo root after adding it.
- Story in `apps/storybook/src/Slider.stories.tsx` (title `Seeds/Slider`), imported from
  `@rogueoak/canopy/seeds`, no per-story theme code.
- Stories: Playground, Single value, Range (two thumbs), Steps, Disabled, Invalid
  (`aria-invalid`), Vertical (orientation) - each rendering correctly light and dark.
- Tests: renders with `role="slider"`; single vs range renders one vs two thumbs;
  `aria-valuenow`/`aria-valuemin`/`aria-valuemax` reflect `value`/`min`/`max`; keyboard
  (`ArrowRight`/`ArrowLeft`, `Home`/`End`) moves the thumb by `step`; controlled `onValueChange`
  fires and uncontrolled `defaultValue` works; `disabled` is inert; `aria-invalid` present;
  `className` merge (caller wins); `ref` forwards to the Root.
- Canopy `README.md` component list plus `overview/features.md` and `overview/architecture.md`
  (the new `@radix-ui/react-slider` dependency in the canopy footprint) updated on completion.

### Out

- **Value labels / tooltips on the thumb** and **tick marks / step labels** rendered under the
  track - a follow-up (they layer on top of this primitive without changing its API).
- **Non-linear scales** (logarithmic, custom easing) - v1 is linear over `min`/`max`/`step`.
- **`FormField` integration wiring** beyond honouring native `id`/`aria-*` - the `FormField` Twig
  composes this Seed later; no change to `FormField` here.
- **Multi-thumb (3+) ranges** beyond the standard two-thumb range - deferred; Radix supports more
  thumbs but v1 documents single and two-thumb range only.
- **Per-thumb accessible names for range sliders** - a single-thumb slider inherits the control's
  `aria-label` / `aria-labelledby`, but the two thumbs of a range each want a DISTINCT name (e.g.
  "minimum" / "maximum") and v1 ships no per-thumb naming API (copying one shared name onto both
  would mislead). Deferred; callers needing named range thumbs drop to raw Radix until a follow-up
  adds a typed escape hatch (e.g. `thumbLabels?: string[]`).
- Changing any other component - Slider is purely additive.

## Approach

**Primitive stack: `@radix-ui/react-slider` + the 0005 recipe.** Canopy is built entirely on Radix
primitives styled with the recipe; Slider follows suit. Radix `Slider.Root` owns the value state
(controlled via `value`/`onValueChange`, uncontrolled via `defaultValue`), pointer and keyboard
interaction, stepping/bounds, orientation, and the `role="slider"` ARIA on each thumb - so the Seed
adds styling, not behaviour. It is added as a runtime **dependency** of `@rogueoak/canopy` and
**externalized in tsup** exactly like the sibling Radix deps (per the canopy externalization rule),
so consumers install one copy.

**Part surface.** A single default export composing the Radix sub-parts internally, so callers use
one component:

- `Slider` - `forwardRef` over `Slider.Root` (ref and native props spread onto Root), rendering
  `Slider.Track` (the rail), `Slider.Range` (the filled portion), and one `Slider.Thumb` per entry
  in the resolved value array. The thumb count is computed from
  `value ?? defaultValue ?? [min]`, so a single value yields one thumb and a two-entry value yields
  two - **single and range from one API**, no `range` boolean to keep in sync with the value shape.

**Styling & recipe.** FULL LITERAL token-utility strings on each part (so the Tailwind v4 scanner
emits them), `cn()` merge with caller `className` winning, `forwardRef` + native prop spread, and
**no `dark:` on the common path** - light/dark is a token-layer property. Concretely:

- Root: `relative flex w-full touch-none select-none items-center` (and the vertical variant when
  `orientation="vertical"`), plus `data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed`
  for the disabled treatment (a toggle-style control, so opacity + not-allowed per the recipe -
  the filled range must survive).
- Track: `relative h-2 w-full grow overflow-hidden rounded-full bg-muted`.
- Range: `absolute h-full bg-primary`.
- Thumb: `block h-5 w-5 rounded-full border border-border bg-surface shadow-sm
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset
  aria-invalid:ring-2 aria-invalid:ring-danger` - the focus-visible ring is the standard recipe
  ring, and `aria-invalid:` drives the danger state off the native attribute (no custom prop).

**Accessibility.** Radix supplies `role="slider"`, `aria-valuenow`/`aria-valuemin`/
`aria-valuemax`, `aria-orientation`, and the full keyboard model (Arrow nudge by `step`, `Home`/
`End` to bounds, `PageUp`/`PageDown` larger steps). The Seed forwards native `aria-*`/`id` so it
pairs with `Label`/`FormField`. These promises are **guarded by observable tests** (the slider role
appears, value attributes reflect props, keyboard moves the value, disabled is inert) rather than
asserting class strings, per the repo learning that a11y is verified by outcomes.

**Motion.** None beyond the browser's native thumb drag - no keyframe animation, so no
`motion-reduce` gate is needed.

**Key decisions & trade-offs.**

- *Value-length-derived thumbs vs a `range` prop*: deriving thumb count from the value array keeps
  the API minimal and mirrors the Radix surface (value is always a number array); the cost is that
  "range" is expressed by passing two values rather than a boolean, which is documented in the
  Range story.
- *New dependency `@radix-ui/react-slider`*: one more runtime dep on canopy, but it is the exact
  missing primitive, small, and consistent with the whole Radix-based system - hand-rolling
  accessible slider math would be far more code to own. **Security/architecture personas should
  weigh the new-dependency surface in review**, and the dep is recorded in
  `overview/architecture.md`.
- *Single value is still a number array*: matching Radix keeps controlled/uncontrolled semantics
  uniform; callers read `value[0]` for the single case, which the stories show.

## Acceptance

- [ ] `Slider` ships from `@rogueoak/canopy` (exported via `packages/canopy/src/seeds/index.ts`),
      built on `@radix-ui/react-slider` added to `packages/canopy/package.json` **and**
      externalized in `packages/canopy/tsup.config.ts`; `pnpm install` run at the root.
- [ ] Recipe obeyed: full literal token-utility classes, `cn()` merge (caller `className` wins),
      `forwardRef` + native prop spread, `React.ComponentRef` for the ref type, semantic tokens
      only, and **no `dark:` on the common path**.
- [ ] Track renders `bg-muted`, the filled range renders `bg-primary`, and each thumb has the
      focus-visible ring; renders correctly light **and** dark.
- [ ] **Single value** renders one thumb; **range** (two-entry value) renders two thumbs with the
      filled range between them - both from one API.
- [ ] **Controlled** (`value` + `onValueChange`) and **uncontrolled** (`defaultValue`) both work;
      `min`/`max`/`step` constrain and quantize the value.
- [ ] Each thumb is `role="slider"` with `aria-valuenow`/`aria-valuemin`/`aria-valuemax`; keyboard
      (Arrow keys, `Home`/`End`) moves the value by `step`.
- [ ] `disabled` renders the control inert (opacity + `cursor-not-allowed`, filled range survives);
      native `aria-invalid` applies the danger ring on the thumbs.
- [ ] Storybook catalog entry with Playground, Single, Range, Steps, Disabled, Invalid, and
      Vertical stories; `pnpm storybook` build is green.
- [ ] Tests cover: `role="slider"` present, single-vs-range thumb count, value/min/max attributes,
      keyboard movement, controlled `onValueChange` + uncontrolled `defaultValue`, disabled inert,
      `aria-invalid` present, `className` merge, `ref` forwarding. `pnpm test` / `pnpm lint` /
      `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Slider; `overview/features.md` (new capability)
      and `overview/architecture.md` (new `@radix-ui/react-slider` dependency in the canopy
      footprint) updated on completion.
