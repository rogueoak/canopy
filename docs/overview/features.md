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

Not yet built (later specs): real palette/type/spacing (0003), light/dark theming mechanism
(0004), real components (0005+), native Swift token target, npm publish.
