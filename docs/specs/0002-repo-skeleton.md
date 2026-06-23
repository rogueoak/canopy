# 0002 — Repo Skeleton & Toolchain

## Problem

Canopy is the design system for the **rogueoak** org: a tree-themed, atomic design
system built on Radix + shadcn + Tailwind, shipped as consumable npm packages with a
Storybook showcase on GitHub Pages. Before we can tune colour, type, and spacing — the
foundation we must get right first — the repo needs its plumbing: a monorepo, a token
build pipeline, a component build, a Storybook shell, and CI to publish it.

This spec delivers **only the skeleton**. No real palette, type, spacing, or components —
those come in 0003 (Roots/Foundations), 0004 (theming) and later. The goal is an end-to-end
pipeline that proves every seam works with throwaway sample values.

Audience: the rogueoak maintainers (us) building the system, and future app teams who will
consume `@rogueoak/roots` and `@rogueoak/canopy`.

## Outcome

When done, from a clean clone:

- `pnpm install && pnpm build` builds both packages and the Storybook with no errors.
- `pnpm dev` (or `pnpm storybook`) serves Storybook locally showing a placeholder story.
- `pnpm test` runs a passing smoke test.
- A token JSON source compiles via Style Dictionary into CSS variables, a TS export, and a
  Tailwind v4 preset — demonstrated with one throwaway sample token.
- `@rogueoak/canopy` consumes a token from `@rogueoak/roots` and renders it in a Storybook
  placeholder component, proving the cross-package + token seam.
- A GitHub Actions workflow builds Storybook and deploys it to GitHub Pages on push to main.
- `pnpm changeset` is wired for versioned publishing (publish itself stays manual/off until
  we're ready).

## Scope

### In
- pnpm workspace monorepo + Turborepo task pipeline (cached `build`/`lint`/`test`).
- TypeScript (strict), shared tsconfig base.
- `packages/roots` — Style Dictionary pipeline (DTCG-format JSON source) generating
  CSS variables, a TS token export, and a Tailwind v4 preset/`@theme` CSS. Seeded with a
  single **sample** token (e.g. `color.sample`) — not the real palette.
- `packages/canopy` — component package shell. Tailwind v4 wired to the Roots preset.
  tsup build → ESM + `.d.ts`. Subpath export structure stubbed (`/seeds`, etc.). One
  placeholder component proving it consumes a Roots token.
- `apps/storybook` — Storybook 8 (Vite/React) rendering one Foundations placeholder + the
  placeholder component, with a light/dark toggle wired (themes empty for now).
- Linting/formatting: ESLint + Prettier.
- Testing: Vitest + Testing Library; one smoke test.
- Changesets configured for `@rogueoak/*` (npm org scope).
- GitHub Actions: build + test on PR; build & deploy Storybook to Pages on main.

### Out
- Real palette, typography, spacing, radii, elevation, motion → **0003**.
- Dark/light theming mechanism + dark variants → **0004**.
- Any real components (Seeds/Twigs/Branches) → later specs.
- A Swift/native token target → future (pipeline left extensible, not built).
- Actual npm publish to the registry → flipped on in a later spec.

## Approach

- **Monorepo:** pnpm workspaces + Turborepo. Layout: `packages/roots`, `packages/canopy`,
  `apps/storybook`. Org scope `@rogueoak`.
- **Tokens (Roots):** Style Dictionary is the source of truth. DTCG token JSON →
  generated outputs: (1) `dist/tokens.css` CSS custom properties, (2) `dist/tokens.ts`
  typed export, (3) a Tailwind v4 preset that maps tokens into the `@theme`. This is the
  seam that lets a Swift target be added later as just another Style Dictionary platform —
  we build only the web platforms now.
  - *Trade-off:* more upfront pipeline than hand-written CSS vars, accepted deliberately to
    future-proof for native (Swift) per the distribution decision.
- **Components (Canopy):** Tailwind v4 (CSS-first `@theme`) consuming the Roots preset.
  Built with shadcn/Radix primitives in later specs. Compiled with tsup to ESM + types.
  Consumed as a versioned npm library (not a shadcn copy-in registry).
- **Theming:** light/dark handled at the token layer (semantic tokens remap per theme);
  the toggle is wired in Storybook now (empty), populated in 0003–0004.
- **Showcase:** Storybook 8 + Vite, deployed to GitHub Pages via Actions. Storybook is
  also our visual workbench for tuning foundations in 0003.
- **Release:** Changesets for versioning; publish step present but disabled until ready.

### Key decisions (carry into architecture.md)
- Compiled npm library distribution (not shadcn registry copy-in).
- Style Dictionary token pipeline (future native target).
- Tailwind v4.
- Two packages: `@rogueoak/roots` + `@rogueoak/canopy`.
- Tree-themed atomic layers: Roots (tokens) → Seeds (atoms) → Twigs (molecules) →
  Branches (organisms) → Boughs (templates, later); Canopy = the whole system.

## Acceptance

- [ ] `pnpm install` succeeds on a clean clone.
- [ ] `pnpm build` builds roots (token outputs), canopy (ESM + d.ts), and Storybook.
- [ ] Style Dictionary generates `tokens.css`, `tokens.ts`, and a Tailwind v4 preset from
      the sample token source.
- [ ] `@rogueoak/canopy` placeholder component renders a value sourced from `@rogueoak/roots`.
- [ ] `pnpm storybook` serves a Foundations placeholder + the placeholder component with a
      light/dark toggle present.
- [ ] `pnpm test` runs and passes a smoke test.
- [ ] `pnpm lint` passes.
- [ ] `pnpm changeset` runs and is configured for `@rogueoak/*`.
- [ ] CI builds + tests on PR and deploys Storybook to GitHub Pages on main.
- [ ] README updated with the now-working dev setup (install/build/storybook) and the
      Storybook Pages link — keeping docs truthful to working software.
