# Features

What the product does, feature by feature.

## Repo skeleton (0002)

The working end-to-end skeleton — every seam proven with throwaway sample values, no real
design tokens or components yet.

- **Monorepo & tasks** — pnpm workspace + Turborepo. `pnpm install`, `pnpm build`,
  `pnpm test`, `pnpm lint`, `pnpm storybook`, `pnpm changeset` all work from the root.
- **Token pipeline** — `@rogueoak/roots` compiles a DTCG token source via Style Dictionary
  into CSS variables (`tokens.css`), a typed TS export (`tokens.ts` → `tokens.js`/`.d.ts`),
  and a Tailwind v4 `@theme` preset (`tailwind-preset.css`). Seeded with one placeholder
  token, `color-sample` (`#4a7c59`).
- **Component package** — `@rogueoak/canopy` builds to ESM + types with tsup, exposing `.`
  and `./seeds`. A placeholder `Sprout` component imports `color-sample` from
  `@rogueoak/roots` and renders it, proving the cross-package + token seam. A Vitest smoke
  test asserts it mounts and shows the Roots-sourced value.
- **Storybook showcase** — Storybook 8 (React + Vite + Tailwind v4) with a
  `Foundations/Sample` swatch (token shown three ways: `bg-sample` utility,
  `var(--color-sample)`, typed export) and a `Seeds/Sprout` story. A light/dark toolbar
  toggle is wired (theme values empty until 0004). Builds to static for Pages.
- **CI & release** — GitHub Actions build/test/lint on PRs + main, and deploy Storybook to
  GitHub Pages on main. Changesets configured for `@rogueoak/*` (publish off for now).

## Roots foundations (0003)

The real two-tier design-token foundation — what every Canopy component styles against. Light
theme only; the dark remap + runtime switching are 0004.

- **Primitive ramps** (`color/primitive.json`) — eight `50…950` ramps: `moss` (brand),
  `bark`, `stone` (warm neutrals), `amber` (accent), and desaturated functional ramps
  `success` / `warning` / `danger` / `info`, plus `base.white`. Muted & natural, moss/olive
  brand. Never consumed directly by components.
- **Semantic tokens** (`color/semantic.json`) — light-theme roles that **reference** primitives
  (e.g. `color-primary` → `var(--color-moss-600)`): surfaces, text, lines, roles + foregrounds,
  and status + foregrounds. Components consume only these; the reference seam means 0004 remaps
  this layer alone. Functional roles use the `.DEFAULT` convention so `--color-success`
  (→ `bg-success`) coexists with the `--color-success-600` ramp step. `accent` is a **fill-only**
  role (amber.500, below AA on `bg`); **`accent-strong`** (amber.700, ~6.15:1) is the AA-passing
  accent for text/icon/border. A `ring-offset` role provides the focus-ring gap colour on
  coloured surfaces.
- **Typography primitives** (`typography.json`) — `font.sans` (Figtree) + `font.mono` (Geist Mono)
  family names; type scale `text-xs…6xl` (12→60px); weights, leading, tracking
  (`tighter`/`tight`/`normal`/`wide`).
- **Composite text roles** (`typography-roles.json`) — semantic roles `display`, `h1…h4`, `body`,
  `body-sm`, `label`, `caption`, `code` (mono), each composing **references** to the type
  primitives and emitted as Tailwind v4 `text-<role>` utilities with companion vars, so
  `text-h2` applies font-size + line-height + font-weight + letter-spacing in one class.
  Components style against these, not raw scale + weight + leading.
- **Spacing / radii / elevation / motion** — `space.0…32` (4px base); `radius.none…full`;
  `shadow.sm…xl` (soft, warm); `duration.fast/base/slow` + `ease.standard/emphasized/decelerate`.
- **Self-hosted fonts** — Figtree + Geist Mono via `@fontsource-variable/*`, imported in
  Storybook's global CSS. Roots ships only the family tokens; consumers install @fontsource.
- **Tailwind v4 utilities** — token names flatten onto `@theme` namespaces so utilities
  generate (`bg-*`, `text-lg`, `font-sans`, `rounded-md`, `shadow-md`); spacing utilities
  (`p-4` = 1rem) derive from a single `--spacing: 0.25rem` base.
- **Foundations stories** — Storybook `Foundations` section renders ramps + semantic swatches,
  the Figtree specimen + type scale + weights + leading, spacing, radii, elevation, motion, and
  a WCAG AA contrast table. The visual lock surface.
- **Contrast** — all primary text roles meet WCAG AA (≥ 4.5:1) on their intended surfaces;
  `text-subtle` (tertiary) meets AA-large (≥ 3:1), documented as for large/non-essential text.
  Guarded by an **executable contrast test** (`tokens.test.ts`) that resolves each role to its
  real primitive hex and computes the WCAG ratio, so a future ramp/remap can't silently break AA.

Not yet built (later specs): light/dark theming mechanism (0004), real components (0005+),
native Swift token target, npm publish.
