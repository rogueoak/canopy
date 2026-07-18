# 0062 - chart

## Problem

Canopy has surfaces that present data as text and lists - `Card` (0021), `Table`, `Badge`
(0008) - but nothing for **data visualization**. Any consumer who needs a bar, line, area, or
pie chart today reaches straight for `recharts` and then hand-wires colors: they hard-code hex
values into each `<Bar fill="#...">`, which means the chart ignores the token layer, does not
switch with light/dark, and drifts from the rest of the system's palette. shadcn/ui closes this
gap with its `chart` component - a thin, themeable wrapper over recharts that injects per-series
CSS variables and ships matching tooltip and legend content - but canopy has no equivalent, so
every dashboard re-solves theming and re-styles the recharts tooltip from scratch.

This is for any dashboard, analytics panel, or report surface: usage graphs, revenue trends,
status breakdowns. It belongs in canopy because chart theming is exactly the "solve the token
plumbing once" job the design system exists for - a `Card` full of charts should read as one
themed surface, not a token-styled frame around raw recharts primitives. Chart composes the
recharts primitives the same way `Combobox` (0030) composes cmdk: canopy owns the themed shell,
the caller composes the primitives inside.

## Outcome

- A new canopy component family, `Chart`, exported from `@rogueoak/canopy` (via the branches
  barrel), that wraps `recharts` with token-driven theming. Parts:
  - **`ChartContainer`** - the root. Takes a **`ChartConfig`** (a record mapping each series key
    to `{ label, color?, icon?, theme? }`) and renders a `recharts.ResponsiveContainer`. It
    injects the resolved colors as scoped CSS custom properties (`--color-<key>`) onto a wrapper
    element, so caller primitives reference `var(--color-<key>)` and stay theme-aware. Colors in
    the config are **semantic tokens** (e.g. a `--chart-1..--chart-5` token ramp), not raw hex.
  - **`ChartTooltip`** (a re-export/binding of recharts `Tooltip`) + **`ChartTooltipContent`** -
    a canopy-styled tooltip body (surface-raised card, border, shadow, token text) that reads
    labels and colors from `ChartConfig`.
  - **`ChartLegend`** (binding of recharts `Legend`) + **`ChartLegendContent`** - a canopy-styled
    legend row that reads labels/icons/colors from `ChartConfig`.
- **Caller composition**: the consumer places recharts primitives (`Bar`, `Line`, `Area`, `Pie`,
  axes, grid) as children of `ChartContainer`, wiring `fill`/`stroke` to `var(--color-<key>)`.
- **Theming**: styled with the 0005 recipe (semantic-token Tailwind utilities on the container,
  tooltip, and legend; `cn()` merge; `forwardRef` + native prop spread). The color ramp comes
  from the token layer, so charts switch light/dark with no `dark:` on the common path. Where a
  config entry needs distinct light/dark values, the `theme` field maps to token-backed values
  resolved at the token layer, not via `dark:` in component source.
- **A11y**: the container exposes an accessible figure region; recharts' own `role`/`aria`
  surface (accessibility layer enabled) is preserved and guarded by observable tests.
- **Storybook**: a catalog entry with bar, line, area, and pie stories, plus tooltip and legend
  stories, rendered in both themes from the toolbar (no per-story theme code).
- **Docs**: canopy `README.md` component list and the `overview/` living docs updated on
  completion.

## Scope

### In
- `packages/canopy/src/branches/Chart.tsx` (+ `packages/canopy/src/branches/Chart.test.tsx`) -
  the component family and its parts, exported from `packages/canopy/src/branches/index.ts`.
- The parts: `ChartContainer`, `ChartConfig` (type), `ChartTooltip`, `ChartTooltipContent`,
  `ChartLegend`, `ChartLegendContent`, and a `useChart()` context hook.
- Token-driven color injection: `ChartContainer` reads `ChartConfig` and emits scoped
  `--color-<key>` CSS variables from **semantic chart tokens** (a `--chart-1..--chart-5` ramp in
  the token layer / Roots preset); no raw hex or palette classes in component source.
- One new **runtime dependency** on `@rogueoak/canopy`: **`recharts`**. It is added to
  `packages/canopy/src/../package.json` (`packages/canopy/package.json`) `dependencies` **and**
  externalized in `packages/canopy/tsup.config.ts` `external: [...]` (matching the rule that
  every runtime dep is external), with `pnpm install` run at the repo root after.
- Storybook stories in `apps/storybook/src/Chart.stories.tsx` importing from
  `@rogueoak/canopy/branches`: Bar, Line, Area, Pie, WithTooltip, WithLegend - each shown in
  light and dark via the toolbar.
- Tests: `ChartContainer` renders its children and injects the expected `--color-<key>` CSS
  variables from a config; `ChartTooltipContent` renders the configured label/color for a
  payload; `ChartLegendContent` renders the configured labels/icons; `useChart` throws outside a
  container; `className` merge (caller wins); ref forwarding on the styled wrappers.
- canopy `README.md` component list, `overview/features.md` (new visualization capability), and
  `overview/architecture.md` (new `recharts` dependency in the canopy footprint) updated on
  completion.

### Out
- **Specific chart-type wrapper components** (a canopy `BarChart`/`LineChart` that hides
  recharts) - v1 stays a themeable *wrapper*; the caller composes recharts primitives directly,
  mirroring the shadcn model. Opinionated per-type wrappers are a clean follow-up.
- **A canopy-owned data/query layer, animations config, or interaction (brush/zoom/click-drill)
  callbacks** - deferred; recharts' own props cover these for v1.
- **Replacing `recharts` with a first-party rendering engine** - out of scope; recharts is the
  chosen primitive.
- **Changing unrelated components** - Chart is additive; `Card` (0021), `Tooltip`, and every
  other component are untouched.

## Approach

**Primitive stack: recharts + the canopy 0005 recipe.** recharts is the de-facto React charting
primitive and the one shadcn's `chart` builds on; canopy follows suit rather than owning a
renderer. `ChartContainer` wraps `recharts.ResponsiveContainer` and provides a React context
carrying the `ChartConfig`; `ChartTooltipContent` and `ChartLegendContent` read that context via
`useChart()`. recharts is added as a runtime **dependency** of `@rogueoak/canopy` and
**externalized in tsup** exactly like the Radix and cmdk deps (peers + deps are external, only
first-party source is bundled). **Flag for security/architecture review:** recharts is a larger
dependency (it pulls d3 sub-packages) than the existing Radix/cmdk deps - the
security/architecture personas should weigh the added surface and bundle footprint; it is
externalized so the consumer installs one copy in their graph.

**Token-driven color, no dark on the common path.** The `ChartConfig` maps each series key to a
`color` that resolves to a **semantic chart token** (`--chart-1..--chart-5`, added to the Roots
preset / token layer, defined light and dark there). `ChartContainer` sets scoped
`--color-<key>` CSS variables on its wrapper from the config; caller primitives read
`fill="var(--color-<key>)"` / `stroke="var(--color-<key>)"`. Because the ramp lives in the token
layer and portalled/inline recharts markup inherits `.dark` from `<html>`, charts theme
light/dark with **zero `dark:` in component source**. The optional `theme` field on a config
entry resolves to token-backed values at the token layer, not via `dark:` utilities.

**Part surface (mirrors shadcn's chart, canopy-styled).**
- `ChartContainer` - `forwardRef` div wrapper (full literal token classes: `text-text`,
  container sizing, aspect handling) around `ResponsiveContainer`, provides `ChartContext`.
- `ChartTooltip` / `ChartLegend` - direct bindings to recharts `Tooltip` / `Legend` so callers
  wire them like native recharts.
- `ChartTooltipContent` / `ChartLegendContent` - `forwardRef` canopy-styled bodies:
  surface-raised card (`bg-surface-raised border border-border shadow-md rounded-lg text-text`),
  token-styled label/value rows, per-series color swatch from `--color-<key>`.
- `useChart()` - context hook that throws a clear error if used outside `ChartContainer`.

**Styling & recipe.** FULL LITERAL token-utility strings on every styled wrapper (so Tailwind
v4's scanner emits each - never build class names dynamically), `cn()` merge with caller
`className` winning, `forwardRef` + native prop spread on the styled parts, semantic tokens only,
`React.ComponentRef` (not the deprecated `React.ElementRef`), and no `dark:` on the common path.

**Accessibility.** The container renders an accessible figure region; recharts' accessibility
layer is enabled so its generated chart markup carries role/aria/keyboard support. a11y promises
are guarded by **observable tests** (the accessible region is present, tooltip/legend content
renders the configured labels), not by asserting scaffolding, per the repo learning.

**Motion.** No custom keyframes; recharts' own animation is used and is disabled where
reduced-motion is requested (recharts `isAnimationActive` respected). No inline animation added
to component source.

## Acceptance

- [ ] `Chart` family (`ChartContainer`, `ChartTooltip`, `ChartTooltipContent`, `ChartLegend`,
      `ChartLegendContent`, `useChart`, `ChartConfig`) ships from `@rogueoak/canopy` (exported via
      `branches/index.ts`), built on `recharts`; no `dark:` on the common path.
- [ ] `recharts` is added to `packages/canopy/package.json` `dependencies` **and** externalized in
      `packages/canopy/tsup.config.ts` `external`; `pnpm install` run at the repo root; the build
      does not bundle recharts.
- [ ] `ChartContainer` accepts a `ChartConfig` and injects scoped `--color-<key>` CSS variables
      resolved from **semantic chart tokens** (`--chart-1..--chart-5` in the token layer); caller
      primitives reading `var(--color-<key>)` theme light/dark with no `dark:` in source.
- [ ] `ChartTooltipContent` renders the configured label and color swatch for a payload;
      `ChartLegendContent` renders the configured labels/icons; both read config via `useChart()`.
- [ ] `useChart()` throws a clear error when used outside `ChartContainer`.
- [ ] Recipe obeyed: full literal token-utility class strings, `cn()` merge (caller `className`
      wins), `forwardRef` + native prop spread on styled parts, `React.ComponentRef`, semantic
      tokens only.
- [ ] A11y: an accessible figure region is present and recharts' accessibility layer is enabled;
      guarded by observable tests (region present, tooltip/legend labels render).
- [ ] Storybook catalog entry with Bar, Line, Area, Pie, WithTooltip, and WithLegend stories,
      rendered light and dark from the toolbar (no per-story theme code); `pnpm storybook` build is
      green.
- [ ] Tests cover: container renders children and injects the expected CSS variables; tooltip
      content renders configured label/color; legend content renders configured labels; `useChart`
      throws outside a container; `className` merge (caller wins); ref forwarding. `pnpm test` /
      `pnpm lint` / `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes Chart; `overview/features.md` (new visualization
      capability) and `overview/architecture.md` (new `recharts` dependency in the canopy footprint)
      updated on completion.

## Review decisions

Two deliberate divergences from the sections above, accepted during the Spectra review of PR #81
and recorded here so they are explicit, time-boxed choices rather than incidental drift:

- **Series ramp aliases intent tokens (v1), dedicated `--chart-1..--chart-5` ramp is a follow-up.**
  The Outcome/Scope/Acceptance above call for a NEW `--chart-1..--chart-5` categorical token ramp in
  the Roots token layer. v1 instead aliases five existing semantic role tokens
  (`--color-primary/info/success/warning/danger`) directly in the component source: it ships the
  themeable wrapper without a cross-package Roots token change and still themes light/dark with no
  `dark:`. Accepted trade-off (Designer + Architect review): these are intent colors, so multi-series
  contrast and meaning-neutrality are weaker than a dedicated ramp would give. Follow-up: add a
  meaning-neutral `--chart-1..--chart-5` ramp to the Roots preset (light + dark) and repoint the
  component's `CHART_RAMP` at it. Callers needing distinguishable categorical hues today pass explicit
  per-series `color`/`theme`.
- **`recharts` pinned to `^2.15` (v2) for v1, v3 migration is a tracked follow-up.** recharts marks
  its 1.x/2.x branches EOL and recommends v3. v1 stays on `^2.15` to land the component against the
  stable, well-understood v2 API rather than couple the initial ship to a v3 API migration. Accepted
  as a time-boxed decision (Architect review); a v3 bump - evaluating its API deltas against this
  wrapper's `Tooltip`/`Legend`/`ResponsiveContainer` bindings - is a planned follow-up, not a v1
  blocker.
