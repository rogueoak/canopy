# 0037 - Progress

## Problem

Canopy has a `Spinner` (0017) for **indeterminate** "working..." states, but no
**determinate progress bar** - a control that shows *how far along* a task is (an upload, a
multi-step form, a quota meter). Spinner deliberately puts this out of scope (see its Out
list): a spinner is `role="status"` busy semantics with no value, whereas a progress bar is
`role="progressbar"` carrying `aria-valuenow` / `aria-valuemin` / `aria-valuemax`. The two
answer different questions ("is it busy?" vs "how much is done?") and screen readers announce
them differently.

Today a consumer who needs a filled bar - "43% uploaded", step 2 of 4 - has to hand-roll a
track and indicator `div`, wire the ARIA value attributes by hand, and re-derive the fill width
from a value every time. shadcn ships exactly this as its `Progress` component on
`@radix-ui/react-progress`, and canopy has the gap. This is for any surface with a bounded,
measurable task: file uploads, onboarding/checkout steppers, storage meters, download
indicators. It is the determinate sibling to Spinner (0017) and complements the primitive
recipe established in `Button` (0005).

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Progress` - a single Seed built on
  `@radix-ui/react-progress`.
- **Determinate**: given a `value` (0-100), it renders a `role="progressbar"` element with
  correct `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`, and fills the
  indicator proportionally (the track shows how far along the task is).
- **Indeterminate** (optional variant): omitting `value` (passing `null`/`undefined`) yields an
  animated indeterminate bar with no `aria-valuenow`, for bounded-but-unknown-duration tasks;
  the animation is gated behind reduced-motion.
- **Sizes**: `sm` and `md` (track height).
- **Theming**: styled with the 0005 recipe - the track uses `bg-muted`, the indicator uses
  `bg-primary`, full literal semantic-token utility strings, `cn()` merge, `forwardRef` + native
  prop spread - so it themes light/dark through the token layer with **no `dark:` on the common
  path**.
- **Docs**: a Storybook catalog entry (values, sizes, indeterminate, on surfaces, both themes);
  canopy `README.md` component list and the `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/seeds/Progress.tsx` (+ `Progress.test.tsx`) - the component, exported
  from `packages/canopy/src/seeds/index.ts` (Seeds are re-exported from the package root).
- **Determinate** rendering: a `value` prop (0-100) drives `aria-valuenow` and the indicator
  fill width; `aria-valuemin="0"` / `aria-valuemax="100"` fixed for v1.
- **Indeterminate** variant: when `value` is `null`/`undefined`, render an animated
  indeterminate indicator with no `aria-valuenow`, gated by `motion-reduce:animate-none`.
- **Sizes** `sm` / `md` via cva (track height); track `bg-muted`, indicator `bg-primary`,
  rounded track, indicator inherits the radius.
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-progress`** (the Root +
  Indicator primitive that owns the value math and ARIA). Added to
  `packages/canopy/package.json` dependencies AND externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (per the canopy externalization rule),
  with `pnpm install` run at the repo root after.
- Storybook stories (Playground, Values, Sizes, Indeterminate, OnSurfaces) and canopy
  `README.md` + `overview/features.md` / `overview/architecture.md` updates on completion.
- Tests: renders `role="progressbar"`; determinate value sets `aria-valuenow` /
  `aria-valuemin` / `aria-valuemax`; indeterminate (no value) omits `aria-valuenow`; both sizes
  render their track token classes; `className` merge (caller wins); `ref` forwards to the Root.

### Out
- **Buffered / secondary progress** (a second "loaded" band behind the primary indicator, e.g.
  video buffering) - additive follow-up.
- **Progress ring / circular** variant - different geometry; a later spec if wanted.
- **Label / percentage text and Twig composition** (Progress + `Label` + value readout) - v1 is
  the bare bar; a labelled Twig can compose it later.
- **Configurable min/max or arbitrary ranges** - v1 fixes 0-100; a `max` prop is a clean
  follow-up.
- Changing `Spinner` (0017) or any other component - Progress is purely additive.

## Approach

**Primitive stack: `@radix-ui/react-progress` + the 0005 recipe.** Canopy is built on Radix
primitives styled with the 0005 recipe, and Progress follows suit rather than hand-rolling the
value math and ARIA. Radix `Progress.Root` owns `role="progressbar"`, clamps the value, and
emits `aria-valuenow` / `aria-valuemin` / `aria-valuemax` (and correctly omits `aria-valuenow`
in the indeterminate state); `Progress.Indicator` is the fill element we translate by
`100 - value` percent. The dependency is added as a runtime **dependency** of
`@rogueoak/canopy` and externalized in tsup exactly like the existing Radix deps, so it is not
bundled into the package.

**Part surface (single Seed).** One exported component, `Progress`, matching the Seed skeleton:
a `React.forwardRef` over `Progress.Root` typed with `React.ComponentRef` and
`React.ComponentPropsWithoutRef`, rendering an internal `Progress.Indicator`. `value` is the
Radix value (number for determinate, `null`/`undefined` for indeterminate). No custom state -
Radix owns it - so this is correctly a Seed, not a Twig or Branch.

**Styling & recipe.** cva maps `size` (`sm` / `md`) to full literal token-utility strings so
Tailwind v4's scanner emits each - no dynamically built class names. The track is
`bg-muted` with `rounded-full overflow-hidden`; the indicator is `bg-primary` with a full-height
fill and a `transition-transform` on the width. The indicator's fill uses an inline
`transform: translateX(-(100 - value)%)` (a per-instance style value, not a Tailwind class, so
it is safe from the scanner). `cn()` merges the caller `className` (caller wins), `forwardRef`
forwards to the Root, and native props spread. **No `dark:` on the common path** - `bg-muted`
and `bg-primary` carry light/dark through the token layer.

**Indeterminate motion.** When `value` is nullish, the indicator gets an animated indeterminate
class (a slide/pulse keyframe) gated by `motion-reduce:animate-none` so reduced-motion users see
a static or gently-pulsed bar. Prefer an existing token-preset animation (`animate-pulse`, or a
dedicated `animate-progress-indeterminate` keyframe added to the Roots preset - **not** inline)
per the motion rule; the concrete keyframe choice is settled in the build, but it must live in
the preset, never inline.

**Accessibility.** The `progressbar` role and value attributes come from Radix; we guard them
with **observable tests** (role present, `aria-valuenow`/min/max correct for determinate,
`aria-valuenow` absent for indeterminate) per the repo learning that a11y is proven by outcomes,
not scaffolding. Progress is non-interactive (no keyboard surface), matching Spinner.

**Trade-offs.**
- *New dep (`@radix-ui/react-progress`)*: one more small, widely-used Radix runtime dep on
  canopy, but it is exactly the missing primitive and owns the value clamping + ARIA that would
  otherwise be hand-maintained. Vendoring it would be more code to own. Security/architecture
  personas should weigh the new-dependency surface in review.
- *Fixed 0-100 range in v1*: keeps the API tiny and matches the common percentage case; an
  arbitrary `max` is a clean, additive follow-up rather than upfront complexity.
- *Indeterminate as a value-omission (not a separate prop)*: mirrors Radix's own contract
  (nullish value => indeterminate), keeping one surface instead of a redundant boolean.

## Acceptance

- [ ] `Progress` exported from `@rogueoak/canopy/seeds` (via `seeds/index.ts`, and thus the
      package root), built on `@radix-ui/react-progress` (added to `packages/canopy/package.json`
      dependencies AND externalized in `packages/canopy/tsup.config.ts`); `pnpm install` run at
      the repo root.
- [ ] Recipe obeyed: cva size variants with full literal token classes, `cn()` merge (caller
      `className` wins), `React.forwardRef` with `React.ComponentRef`, native prop spread, and
      **no `dark:` on the common path**.
- [ ] Track uses `bg-muted`, indicator uses `bg-primary`, semantic tokens only, correct in light
      **and** dark.
- [ ] **Determinate**: a `value` (0-100) renders `role="progressbar"` with correct
      `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and fills the indicator
      proportionally.
- [ ] **Indeterminate**: omitting `value` renders an animated bar with no `aria-valuenow`, gated
      by `motion-reduce:animate-none`; any new keyframe lives in the Roots preset, not inline.
- [ ] Sizes `sm` and `md` render their respective track heights.
- [ ] `ref` forwards to the Root; native props spread.
- [ ] Storybook catalog entry with Playground, Values, Sizes, Indeterminate, and OnSurfaces
      stories in both themes; `pnpm storybook` build is green.
- [ ] Tests cover: renders `role="progressbar"`; determinate sets `aria-valuenow`/min/max;
      indeterminate omits `aria-valuenow`; both sizes render their track classes; `className`
      merge; `ref` forwarding. `pnpm test`, `pnpm lint`, and `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Progress; `overview/features.md` (new
      determinate-progress capability, distinct from Spinner 0017) and `overview/architecture.md`
      (new primitive `@radix-ui/react-progress` in the canopy dependency footprint) updated on
      completion.
