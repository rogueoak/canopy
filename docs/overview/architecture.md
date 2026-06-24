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

1. `tokens.css` — CSS custom properties: `:root { … }` (light: all primitives + light
   semantics) plus a `.dark { … }` block (dark: semantic overrides only) for runtime theming.
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
| `color/semantic.json` | light-theme roles that **reference** primitives (surfaces, text, lines, roles, interaction states, status) |
| `color/semantic.dark.json` | dark-theme overrides (same paths, dark `$value`s referencing primitives) — drives the `.dark` block (0004) |
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
reference — `--color-primary: var(--color-moss-600)` — rather than a flattened literal. A
**`.dark` block** in `tokens.css` (spec 0004) remaps the **semantic layer only** — the primitives
are shared, theme-agnostic ramps and stay fixed; `.dark` re-points each role (`--color-primary`,
`--color-bg`, …) at a different ramp step (e.g. `--color-primary: var(--color-moss-400)`). Because
semantics are references and the other two outputs reference the runtime vars, that single remap
cascades to every dependent var and every Tailwind utility — a UI re-themes by toggling one class
(`dark`) on a root element, with **zero per-component code**. The Tailwind preset and typed TS
export are **unchanged** by theming: they reference the runtime vars, which `.dark` overrides.

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

### The `:root` / `.dark` emission (spec 0004)

Style Dictionary 4 resolves `source`/`include` **per config instance**, not per platform, so
`tokens.css` is produced by **two SD passes**, orchestrated by `packages/roots/build.mjs`
(the package `build` script runs `node build.mjs && tsup`):

1. **Light** — the default config (exported from `style-dictionary.config.mjs`) builds all
   sources _except_ `*.dark.json` (`source: ['tokens/**/*.json', '!tokens/**/*.dark.json']`)
   into `:root` (`tokens.css`), the Tailwind preset, and the typed TS export — exactly as 0003.
2. **Dark** — a second config (`darkConfig`) sources only `color/semantic.dark.json`, with
   `color/primitive.json` as `include` so the dark references (`{color.moss.400}`) resolve. A
   custom `css/dark-overrides` format emits **only the dark semantic tokens** (`token.isSource`,
   so the `include`d primitives are filtered out) as `var(--primitive)` references wrapped in a
   `.dark { … }` selector, written to a sidecar `tokens.dark.css`.

`build.mjs` then **appends** the `.dark` sidecar to `tokens.css` and deletes it, so one file
owns `:root` (light) + `.dark` (dark). Primitives live once (in `:root`); `.dark` carries only
the ~37 semantic overrides, all reference-aware (`var(--color-stone-950)`, never a flat hex —
the seam from feedback 0001). Consumers add `@custom-variant dark (&:where(.dark, .dark *))` to
their global CSS for the rare explicit `dark:` utility; the common path needs none.

### Naming convention

The token key is the **flattened, kebab-cased Style Dictionary path** (`color.moss.600` →
`color-moss-600`, `color.primary` → `color-primary`), intentionally aligned with the CSS-var /
Tailwind namespace so a TS key, a CSS variable, and a utility all share one name. Primitives are
ramp paths (`color-moss-600`); semantics are role paths (`color-primary`) that reference them.
Components consume **only** semantic names.

### Interaction-state tokens (spec 0004)

`hover` / `active` / `disabled` state roles are defined in 0004 — before the first components
(0005), so states are ready before any Button, with **light and dark values defined together**
(no ad-hoc per-component values, no defining states twice).

- **Hover / active** — `color-<role>-<state>` (`color-primary-hover`, `color-primary-active`,
  same for `secondary`; `color-accent-hover`, `color-danger-hover`) point at an **adjacent ramp
  step**. In light, hover/active go _deeper_ (e.g. `primary-hover` → `moss-700`, `primary-active`
  → `moss-800`); in dark, where the base role is a _lighter_ step (`primary` → `moss-400`), they
  go _lighter still_ (`primary-hover` → `moss-300`, `primary-active` → `moss-500`) so the change
  stays perceptible against the dark base.
- **Disabled** — a surface + foreground convention: `color-disabled` (a muted fill) +
  `color-disabled-foreground` (its text). Components may _also_ use opacity where a control just
  dims uniformly; the token pair is for when a distinct disabled fill reads better. Light uses
  `stone-100` / `stone-400`; dark uses `stone-800` / `stone-600`.

Because these are ordinary semantic tokens, they flow through the same `:root` / `.dark` seam and
every output (utilities `bg-primary-hover`, the typed export, the dark remap) for free.

### Moss-green refinement (spec 0004)

The `moss` brand ramp was re-tuned **greener (less yellow)** in 0004 so the primary reads as
green, not olive, and so the **light and dark primaries share one hue** (~90°). The ramp is
anchored at `moss-600 #4c6634` (the light `color-primary`) and `moss-400 #80a85c` (the dark
`color-primary`), with all eleven `50…950` steps re-derived coherently — luminance is monotonic
and smooth, and every AA pair re-verified. This is the **only** palette change in 0004; every
other ramp is unchanged. The dark theme deliberately re-points `color-primary` at the _lighter_
`moss-400` (not the darker `moss-600`) for legibility on dark surfaces, while keeping the hue.

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
living spec (ramps, semantic swatches incl. interaction states, type specimen, scale, spacing,
radii, elevation, motion, contrast table, and a **Theme** demo). `@storybook/addon-themes`
`withThemeByClassName` wires a **functional** light/dark toolbar toggle that toggles `.dark` on
the preview `<html>` (light default); because `.dark` overrides the semantic runtime vars, every
story re-themes automatically (the semantic swatches even read their hex live, so the printed
value flips with the theme). The global CSS adds `@custom-variant dark` for explicit `dark:`
utilities. `storybook build` emits `storybook-static/`.

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
