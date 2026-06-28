# Plan 0002 - Repo Skeleton & Toolchain

Implements `docs/specs/0002-repo-skeleton.md`. Goal: an end-to-end pipeline proving every
seam (monorepo → tokens → components → Storybook → CI) works, using **throwaway sample
tokens** only. No real palette/type/spacing (0003), no theming mechanism (0004), no real
components (0005+).

## Toolchain notes (environment)
- Node 25 present; `pnpm`/`corepack` are **not** on PATH. Bootstrap with
  `npm install -g pnpm@latest` before any pnpm command.
- Use current stable majors: **pnpm 9+**, **Turborepo 2+**, **TypeScript 5+**,
  **Tailwind v4**, **Style Dictionary 4+** (DTCG `$value`/`$type`), **Storybook 8+**,
  **tsup**, **Vitest 2+**, **Changesets**. Let the resolver pick exact patch versions;
  record any deviation from this plan in the PR description.

## Target layout
```
canopy/
  pnpm-workspace.yaml
  package.json            # private root: scripts delegate to turbo
  turbo.json
  tsconfig.base.json
  eslint.config.mjs
  .prettierrc / .prettierignore
  vitest.workspace.ts
  .changeset/config.json
  .github/workflows/ci.yml
  .github/workflows/pages.yml
  packages/
    roots/                # @rogueoak/roots - tokens
    canopy/               # @rogueoak/canopy - components
  apps/
    storybook/            # private showcase
```

## Steps (ordered)

### 1. Workspace root
- `pnpm-workspace.yaml`: `packages: ['packages/*', 'apps/*']`.
- Root `package.json` (`private: true`, `packageManager: pnpm@…`): scripts `build`, `test`,
  `lint`, `dev`, `storybook`, `changeset` delegating to `turbo run …`. Root devDeps: turbo,
  typescript, prettier, eslint (+ config deps), vitest, @changesets/cli.
- `turbo.json`: tasks `build` (`dependsOn: ['^build']`, outputs `dist/**`, storybook static),
  `test`, `lint`, `dev` (cache off, persistent).
- `tsconfig.base.json`: strict, `moduleResolution: bundler`, `target` modern, JSX react-jsx.
- ESLint flat config + Prettier. `.gitignore` already ignores `.worktrees/`; **add**
  `node_modules/`, `dist/`, `storybook-static/`, `.turbo/`, `*.tsbuildinfo`.

### 2. `packages/roots` - Style Dictionary token pipeline
- `tokens/` DTCG source with ONE clearly-labelled sample, e.g.
  `tokens/sample.json`: `{ "color": { "sample": { "$value": "#4a7c59", "$type": "color" } } }`
  (earthy green placeholder - **not** the real palette; 0003 replaces this).
- `style-dictionary.config.mjs` building to `dist/`:
  1. **CSS variables** → `dist/tokens.css`: `:root { --color-sample: #4a7c59; }`
  2. **Typed TS export** → `dist/tokens.ts` (or `.js` + `.d.ts`) exporting token values.
  3. **Tailwind v4 preset** → `dist/tailwind-preset.css` exposing tokens to Tailwind's
     `@theme` (e.g. `@theme { --color-sample: #4a7c59; }`) so utilities like `bg-sample`
     resolve. Use a small custom SD format if no built-in fits.
- `package.json` `@rogueoak/roots` v0.0.0: `build: style-dictionary build`, `exports` map for
  `./tokens.css`, `.` (TS export), `./tailwind-preset.css`. Ship `dist/`.

### 3. `packages/canopy` - component package shell
- Tailwind v4 wired (via `@tailwindcss/vite` for Storybook; package CSS imports
  `@rogueoak/roots/tailwind-preset.css`).
- One **placeholder component** under `src/seeds/` (e.g. `Sprout`) that **consumes a Roots
  token** - import the sample value from `@rogueoak/roots` and render a labelled swatch.
  This proves the cross-package + token seam (spec acceptance).
- `src/index.ts` + `src/seeds/index.ts`. Build with **tsup** → ESM + `.d.ts`, multiple
  entries; `exports` map exposes `.` and `./seeds`. React/react-dom as peerDeps.
- Vitest + Testing Library smoke test: render `Sprout`, assert it mounts and shows the token.

### 4. `apps/storybook` - showcase shell
- Storybook 8+ (`@storybook/react-vite`) with `@tailwindcss/vite`; global CSS imports
  Tailwind + `@rogueoak/roots/tokens.css` + preset.
- `@storybook/addon-themes` `withThemeByClassName` toggling `.dark` (light default; themes
  **empty** now - populated 0004). Toggle must be present in the toolbar.
- Stories: `Foundations/Sample` rendering the sample-token swatch, and a story for the
  `Sprout` placeholder component. `storybook build` → `storybook-static/`.

### 5. Quality + release wiring
- Vitest workspace runs canopy tests; `pnpm test` green.
- `pnpm lint` green across workspace.
- Changesets: `.changeset/config.json` (`access: public`, `baseBranch: main`) for
  `@rogueoak/*`. Publish stays manual/off (no publish in CI).

### 6. CI
- `.github/workflows/ci.yml` (PRs + main): setup node + pnpm, `pnpm install`,
  `pnpm build`, `pnpm test`, `pnpm lint`.
- `.github/workflows/pages.yml` (push main): build Storybook, `actions/upload-pages-artifact`
  + `actions/deploy-pages` (permissions `pages: write`, `id-token: write`).

### 7. README (living docs)
- Replace the _(planned)_ labels in **Development** with the now-working commands
  (`pnpm install/build/storybook/test`), and note the Storybook Pages URL
  (`https://rogueoak.github.io/canopy/`). Keep package rows as _(planned)_ until publish.
- Tick `0002` on the README roadmap.

## Verification (must pass before commit)
From a clean state in the worktree:
- [ ] `pnpm install` succeeds.
- [ ] `pnpm build` builds roots (tokens.css, TS, preset), canopy (ESM + d.ts), Storybook.
- [ ] Style Dictionary emits all three outputs from the sample token.
- [ ] `Sprout` renders a value sourced from `@rogueoak/roots` (asserted in its test).
- [ ] `pnpm storybook` serves Foundations/Sample + Sprout with a light/dark toggle present.
- [ ] `pnpm test` passes; `pnpm lint` passes.
- [ ] `pnpm changeset --help` runs (config valid).

## Out of scope (do not build)
Real palette/type/spacing (0003), theming mechanism + dark values (0004), real components
(0005+), Swift token target, actual `npm publish`.

## Reflect (after build)
Update `overview/architecture.md` (monorepo + token pipeline + build/CI structure) and
`overview/features.md` (the working skeleton). Add a learning only if real friction occurred.
