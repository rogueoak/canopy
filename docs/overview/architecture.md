# Architecture

How the system is built and why.

## Monorepo

Canopy is a **pnpm workspace + Turborepo** monorepo (`pnpm-workspace.yaml` globs
`packages/*` and `apps/*`). The root `package.json` is private; its scripts
(`build`/`test`/`lint`/`dev`) delegate to `turbo run …`, which caches per-package task
output and respects the `^build` dependency graph (a package builds only after its
workspace dependencies do). A shared `tsconfig.base.json` (strict, `moduleResolution:
bundler`, `jsx: react-jsx`) is extended by each package. ESLint (flat config) + Prettier
and Vitest are configured once at the root.

Three projects:

- **`packages/roots`** → `@rogueoak/roots` — design tokens.
- **`packages/canopy`** → `@rogueoak/canopy` — components.
- **`apps/storybook`** → private showcase, deployed to GitHub Pages.

The tree-themed atomic layers (Roots → Seeds → Twigs → Branches → Boughs) are documented in
the README; Canopy is the whole system.

## Token pipeline (Roots)

**Style Dictionary 4** is the source of truth. Tokens are authored once in DTCG JSON
(`$value`/`$type`) under `packages/roots/tokens/`, then compiled by
`style-dictionary.config.mjs` into three web outputs in `dist/`:

1. `tokens.css` — CSS custom properties (`:root { --color-sample: … }`) for runtime theming.
2. `tokens.ts` — a typed `const` export (`tokens['color-sample']`) for programmatic,
   type-safe access. tsup then compiles it in place to `tokens.js` + `tokens.d.ts`.
3. `tailwind-preset.css` — a Tailwind v4 `@theme inline { … }` block (custom SD format
   `tailwind/preset-v4`) so utilities like `bg-primary` resolve. CSS-first Tailwind v4 means
   tokens live in CSS, not a JS config object.

The package `exports` map exposes `.` (typed TS), `./tokens.css`, and `./tailwind-preset.css`.
This pipeline is the seam that lets a **native (Swift) target** be added later as just
another Style Dictionary platform — no token rewrite. Only the web platforms are built now.

### Token sources & categories (0003)

DTCG sources under `packages/roots/tokens/`, split by concern:

| File | Holds |
| --- | --- |
| `color/primitive.json` | the eight `50…950` ramps (`moss`/`bark`/`stone`/`amber` + functional) + `base.white` |
| `color/semantic.json` | light-theme roles that **reference** primitives (surfaces, text, lines, roles, status) |
| `typography.json` | `font.sans`/`font.mono` family names, `text.*` scale, `font-weight.*`, `leading.*`, `tracking.*` (incl. `tighter`) |
| `typography-roles.json` | composite semantic text roles (`text-role.display`/`h1…h4`/`body`/`body-sm`/`label`/`caption`/`code`) that **reference** the type primitives |
| `space.json` | `space.0…32` (4px base) |
| `radius.json` | `radius.none…full` |
| `shadow.json` | `shadow.sm…xl` |
| `motion.json` | `duration.fast/base/slow`, `ease.standard/emphasized/decelerate` |

### Tailwind v4 namespace mapping

Token paths flatten onto the exact `@theme` variable namespaces Tailwind v4 reads, so the
`tailwind/preset-v4` format's `--<name>: var(--<name>)` lines generate working utilities:

| Token path | Flattened var | Utility |
| --- | --- | --- |
| `color.*` | `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*` |
| `font.sans/mono` | `--font-sans/-mono` | `font-sans`, `font-mono` |
| `text.lg` | `--text-lg` | `text-lg` (font-size) |
| `font-weight.medium` | `--font-weight-medium` | `font-medium` |
| `leading.snug` / `tracking.tight` | `--leading-snug` / `--tracking-tight` | `leading-snug` / `tracking-tight` |
| `radius.md` | `--radius-md` | `rounded-md` |
| `shadow.md` | `--shadow-md` | `shadow-md` |
| `ease.standard` | `--ease-standard` | `ease-standard` |

Two special cases handled in `style-dictionary.config.mjs`:

- **Spacing** — Tailwind v4 derives every `p-*`/`m-*`/`gap-*` utility from a single `--spacing`
  base (`calc(base * n)`), not per-step vars. The preset emits a literal `--spacing: 0.25rem`
  (the 4px base) so `p-4` = 1rem; the `--space-*` vars still ship in `tokens.css` for direct
  `var()` use. Because `--spacing: 0.25rem` makes Tailwind generate **every integer step**
  (`p-1`, `p-7`, `p-13`, …), `space.json` is **curated documentation** of the intended scale,
  not an enforced allow-list — nothing stops `p-13`.
- **Functional `.DEFAULT`** — `success`/`warning`/`danger`/`info` are each both a primitive ramp
  (`color.success.50…950`) and a single semantic role. A `$value` can't sit on the
  `color.success` group node (it has children), so the semantic role lives at
  `color.success.DEFAULT`, and a custom `name/kebab-no-default` transform strips the suffix →
  `--color-success` (→ `bg-success`) coexists with the `--color-success-600` ramp step. The
  transform matches on the **token path tail** (last segment === `DEFAULT`), not a string suffix
  on the rendered name, so an unrelated future `*-default` token can't be renamed by accident.

### Composite text roles (typography tier)

Components style against semantic **text roles** (`text-display`, `text-h1…h4`, `text-body`,
`text-body-sm`, `text-label`, `text-caption`, `text-code`), not raw scale + weight + leading —
the same two-tier boundary colour uses. They are authored in `typography-roles.json` as DTCG
`typography` **composites** whose sub-values *reference* the type primitives
(`fontSize: {text.3xl}`, `lineHeight: {leading.tight}`, …; `code` also `fontFamily: {font.mono}`).

Each role is emitted as a Tailwind v4 **`--text-<role>` font-size utility with companion vars** —
`--text-<role>--line-height` / `--font-weight` / `--letter-spacing` — so a single `text-h2`
utility expands to `.text-h2 { font-size; line-height; font-weight; letter-spacing }`. The
companion uses a **double-dash** (`--text-h2--line-height`) that our single-dash kebab pipeline
never produces, so `style-dictionary.config.mjs` expands composites itself (`expandTypographyRole`)
across all three outputs, staying **reference-aware**: each companion is `var(--<primitive>)`,
never a flattened literal (the seam hardened in feedback 0001). The authoring path `text-role.*`
is renamed to `text-*` on emit so the var/utility is `text-h2`, not `text-text-role-h2`. (Tailwind
v4's `text-*` utility does not expand a font-family companion, so the `code` role pairs
`text-code font-mono`; the `--text-code--font-family` var still ships for native consumers.)

### Token ownership & references (the theming seam)

There is **one owner of runtime CSS variables**: `tokens.css`. Its `css/variables` format runs
with `outputReferences: true`, so a semantic token that references a primitive emits a CSS
reference — `--color-primary: var(--color-moss-600)` — rather than a flattened literal. A future
`.dark` block in `tokens.css` (spec 0004) remaps the **semantic layer only** — the primitives
are shared, theme-agnostic ramps and stay fixed; 0004 re-points each role (`--color-primary`,
`--color-bg`, …) at a different ramp step. Because semantics are references and the other two
outputs reference the runtime vars, that single remap cascades to every dependent var and every
Tailwind utility.

The other two outputs **reference** those runtime vars instead of redeclaring values:

- The Tailwind preset uses **`@theme inline`**, mapping each token to `var(--<name>)`
  (`--color-primary: var(--color-primary)`). This generates utilities (`bg-primary`) that
  resolve to the runtime vars `tokens.css` owns — no value duplication, no competing `:root`,
  and dark remaps cascade straight through.
- The typed TS export is **reference-aware**: a referencing token emits `var(--<ref>)`
  (`tokens['color-primary'] === 'var(--color-moss-600)'`) while a primitive keeps its literal
  (`tokens['color-moss-600'] === '#5a6638'`). Implemented with `usesReferences` / `getReferences`
  from `style-dictionary/utils` (Style Dictionary 4 moved these off the `dictionary` object)
  over each token's `original.$value`. Values are emitted via `JSON.stringify` so a family name
  that itself contains quotes (the `'Geist Mono'` produced by the `fontFamily/css` transform)
  can't break the generated string.

A test (`packages/roots/tokens.test.ts`) reads the built `dist/` files and asserts the
reference survives in all three outputs, so the seam can't silently flatten again. Because it
reads `dist/`, the Turbo `test` task depends on `["^build", "build"]` (each package builds
before it is tested).

### Naming convention

The token key is the **flattened, kebab-cased Style Dictionary path** (`color.moss.600` →
`color-moss-600`, `color.primary` → `color-primary`), intentionally aligned with the CSS-var /
Tailwind namespace so a TS key, a CSS variable, and a utility all share one name. Primitives are
ramp paths (`color-moss-600`); semantics are role paths (`color-primary`) that reference them.
Components consume **only** semantic names.

### Interaction-state tokens (decision — deferred to 0004)

`hover` / `active` / `disabled` state roles are **intentionally deferred to spec 0004**
(theming), not added here. 0004 lands before the first components (0005), so states are ready
before any Button. The convention recorded for 0004: a state role is named
`color-<role>-<state>` (e.g. `color-primary-hover`, `color-primary-active`) and points at a
**deeper ramp step**, with its **light and dark values defined together** in the same pass
(following the existing semantic reference pattern) — no ad-hoc per-component values. This avoids
defining states twice (once light here, once dark in 0004).

### Known follow-up (deferred)

A workspace-wide **`typecheck` Turbo task** (`tsc --noEmit` per package) is not yet wired —
deferred from this remediation as engineer finding E4, to be picked up in a later spec.

## Component build (Canopy)

`@rogueoak/canopy` is a **compiled npm library** (not a shadcn copy-in registry). **tsup**
builds `src/index.ts` and `src/seeds/index.ts` to ESM + `.d.ts` with subpath exports (`.`
and `./seeds`); React/react-dom are peer deps. Components consume Roots tokens via the typed
`@rogueoak/roots` import (the placeholder `Sprout` reads `tokens['color-primary']`, a
`var(--color-primary)` reference), proving the cross-package + token seam. Vitest + Testing
Library (jsdom) provides the smoke test.

## Showcase + theming (Storybook)

**Storybook 8** (`@storybook/react-vite`) with `@tailwindcss/vite`. A global CSS imports
Tailwind + the self-hosted fonts (`@fontsource-variable/figtree` + `.../geist-mono`) +
`@rogueoak/roots/tokens.css` (the runtime `:root` vars) + the Tailwind `@theme inline` preset
— no hand-written `:root` token block. The **Foundations** stories render the system as a
living spec (ramps, semantic swatches, type specimen, scale, spacing, radii, elevation, motion,
contrast table). `@storybook/addon-themes` `withThemeByClassName` wires a light/dark toolbar
toggle (toggles `.dark`); the theme values are intentionally empty until 0004. `storybook build`
emits `storybook-static/`.

Tailwind v4 generates utilities by **scanning source for literal class strings**, so the
Foundations stories that iterate (radii, shadows, leading) carry full literal class names
(`rounded-md`, `shadow-md`) in their data arrays rather than building them with template
literals — otherwise the utility wouldn't be emitted.

## CI / release

Two GitHub Actions workflows:

- `ci.yml` (PRs + main): pnpm install → `pnpm build` → `pnpm test` → `pnpm lint` →
  `pnpm format:check`.
- `pages.yml` (push main): builds Storybook and deploys `apps/storybook/storybook-static`
  to GitHub Pages (`upload-pages-artifact` + `deploy-pages`, `pages: write` /
  `id-token: write`). **Requires Pages enabled** in repo settings (Source: GitHub Actions).

**Changesets** handles versioning (`access: public`, `baseBranch: main`, the private
Storybook app ignored). Actual `npm publish` stays off until a later spec.

### Toolchain note

pnpm 11 gates package build scripts; the workspace approves esbuild, style-dictionary, and
`@bundled-es-modules/glob` via `allowBuilds` in `pnpm-workspace.yaml`. A `.npmrc`
`public-hoist-pattern` for `*storybook*` is required so Storybook's preset loader resolves
`@storybook/react-vite/preset` under pnpm's isolated node_modules layout.
