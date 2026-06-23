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
   `tailwind/preset-v4`) so utilities like `bg-sample` resolve. CSS-first Tailwind v4 means
   tokens live in CSS, not a JS config object.

The package `exports` map exposes `.` (typed TS), `./tokens.css`, and `./tailwind-preset.css`.
This pipeline is the seam that lets a **native (Swift) target** be added later as just
another Style Dictionary platform — no token rewrite. Only the web platforms are built now.

The skeleton seeds a throwaway primitive (`color.sample` → `#4a7c59`) plus a referencing
token (`color.sample-ref` → `{color.sample}`) that exercises the reference/theming seam end
to end; the real palette/type/spacing replace both in 0003.

### Token ownership & references (the theming seam)

There is **one owner of runtime CSS variables**: `tokens.css`. Its `css/variables` format runs
with `outputReferences: true`, so a token that references another emits a CSS reference —
`--color-sample-ref: var(--color-sample)` — rather than a flattened literal. A future `.dark`
block in `tokens.css` remaps the primitives, and every dependent var (and every Tailwind
utility) inherits the change.

The other two outputs **reference** those runtime vars instead of redeclaring values:

- The Tailwind preset uses **`@theme inline`**, mapping each token to `var(--<name>)`
  (`--color-sample: var(--color-sample)`). This generates utilities (`bg-sample`) that resolve
  to the runtime vars `tokens.css` owns — no value duplication, no competing `:root`, and dark
  remaps cascade straight through.
- The typed TS export is **reference-aware**: a referencing token emits `var(--<ref>)`
  (`tokens['color-sample-ref'] === 'var(--color-sample)'`) while a primitive keeps its literal
  (`tokens['color-sample'] === '#4a7c59'`). Implemented with `usesReferences` / `getReferences`
  from `style-dictionary/utils` (Style Dictionary 4 moved these off the `dictionary` object)
  over each token's `original.$value`.

A test (`packages/roots/tokens.test.ts`) reads the built `dist/` files and asserts the
reference survives in all three outputs, so the seam can't silently flatten again. Because it
reads `dist/`, the Turbo `test` task depends on `["^build", "build"]` (each package builds
before it is tested).

### Naming convention

The token key is the **flattened, kebab-cased Style Dictionary path** (`color.sample` →
`color-sample`), intentionally aligned with the CSS-var / Tailwind `--color-*` namespace so a
TS key, a CSS variable, and a utility all share one name. Spec **0003** formalizes the
primitive-vs-semantic naming.

### Known follow-up (deferred)

A workspace-wide **`typecheck` Turbo task** (`tsc --noEmit` per package) is not yet wired —
deferred from this remediation as engineer finding E4, to be picked up in a later spec.

## Component build (Canopy)

`@rogueoak/canopy` is a **compiled npm library** (not a shadcn copy-in registry). **tsup**
builds `src/index.ts` and `src/seeds/index.ts` to ESM + `.d.ts` with subpath exports (`.`
and `./seeds`); React/react-dom are peer deps. Components consume Roots tokens via the typed
`@rogueoak/roots` import (the placeholder `Sprout` reads `tokens['color-sample']`), proving
the cross-package + token seam. Vitest + Testing Library (jsdom) provides the smoke test.

## Showcase + theming (Storybook)

**Storybook 8** (`@storybook/react-vite`) with `@tailwindcss/vite`. A global CSS imports
Tailwind + `@rogueoak/roots/tokens.css` (the runtime `:root` vars) + the Tailwind
`@theme inline` preset — no hand-written `:root` token block. `@storybook/addon-themes`
`withThemeByClassName` wires a light/dark toolbar toggle (toggles `.dark`); the theme values
are intentionally empty until 0004. `storybook build` emits `storybook-static/`.

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
