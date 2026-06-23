<div align="center">

# 🌳 Canopy

**The design system for [rogueoak](https://github.com/rogueoak).**

Earthy, tree-themed, and built on Radix · shadcn · Tailwind v4 · TypeScript.

</div>

---

> [!NOTE]
> **🚧 Status: early development.** Canopy is being built in the open, foundation-first.
> Nothing is published to npm yet, and the APIs below marked _(planned)_ don't exist
> yet — they describe where we're headed. Follow the [roadmap](#roadmap) for what's live.

## What is Canopy?

Canopy is the design system that defines the look, feel, and building blocks of **rogueoak**
— its products and its website. It ships as consumable **npm packages** so any rogueoak app
can build interfaces from the same earthy, considered foundation.

The whole system is organised like a tree, foundation → composite, and every layer is named
for a part of one. **rogueoak** is the forest, **canopy** is the system, and the layers
below grow from shared roots.

## The Canopy model

Atomic design, renamed by tree anatomy:

| Atomic layer        | Canopy name  | What lives here                                                                                                        |
| ------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Design tokens       | **Roots** 🌱 | primitive + semantic tokens — colour, type, spacing, radii, elevation, motion. Everything draws nourishment from here. |
| Atoms               | **Seeds**    | the smallest components — Button, Input, Label, Icon, Badge                                                            |
| Molecules           | **Twigs**    | small compositions — FormField, SearchBar, Card                                                                        |
| Organisms           | **Branches** | larger assemblies — NavBar, DataTable, Dialog                                                                          |
| Templates _(later)_ | **Boughs**   | page scaffolds and layout patterns                                                                                     |
| The whole system    | **Canopy**   | the published library + the Storybook showcase                                                                         |

**Components only ever consume Roots semantic tokens** (`color-surface`, `text-primary`,
`radius-control`) — never raw palette values. Light and dark are a property of the token
layer: semantic tokens remap per theme, so a component is themed without knowing it.

## Tokens & theming

Roots is a **token source of truth**, not hand-written CSS. Tokens are authored once as
[DTCG](https://design-tokens.github.io/community-group/format/) JSON and compiled — via
[Style Dictionary](https://styledictionary.com) — into the outputs each consumer needs:

- **CSS custom properties** (`tokens.css`) for runtime theming
- **A typed TypeScript export** (`tokens`) for programmatic access
- **A Tailwind v4 `@theme` preset** (`tailwind-preset.css`) so utilities map straight onto tokens

The system is **two-tier**, so theming is a remap of one layer and never touches components:

- **Primitive ramps** — the raw palette, `50…950`: `moss` (brand), `bark`, `stone` (neutrals),
  `amber` (accent), and desaturated functional ramps `success` / `warning` / `danger` / `info`.
  Muted & natural; moss/olive brand. Primitives are **never used by components directly**.
- **Semantic tokens** — light-theme roles that **reference** primitives: surfaces
  (`color-bg`, `color-surface`, `color-muted`), text (`color-text`, `color-text-muted`,
  `color-text-subtle`), lines (`color-border`, `color-ring`), roles (`color-primary` +
  `-foreground`, `secondary`, `accent`) and status (`success`/`warning`/`danger`/`info`).
  Components consume **only** these. _(Dark theme + runtime switching land in 0004.)_

Alongside colour: **typography** (Figtree sans + Geist Mono, type scale `text-xs…6xl`, weights,
leading, tracking), **spacing** (4px base), **radii**, **elevation** (`shadow-*`), and **motion**
(durations + easings). Token names flatten onto Tailwind v4 `@theme` namespaces so utilities
generate directly: `color-*`→`bg-*`/`text-*`, `radius-md`→`rounded-md`, `text-lg`→`text-lg`,
`font-sans`→`font-sans`, `shadow-md`→`shadow-md`, and spacing utilities (`p-4`, `gap-2`) derive
from a single `--spacing` base.

**Fonts are self-hosted** (no CDN). Roots ships the family _names_; consumers install the
open-licensed [`@fontsource`](https://fontsource.org) packages and import them once:

```bash
pnpm add @fontsource-variable/figtree @fontsource-variable/geist-mono
```

```css
/* in your global stylesheet, alongside the Roots imports */
@import '@fontsource-variable/figtree';
@import '@fontsource-variable/geist-mono';
@import '@rogueoak/roots/tokens.css';
@import '@rogueoak/roots/tailwind-preset.css';
```

This pipeline is deliberately built to grow: a **native (Swift) target** can be added later
as just another output platform, without rewriting a single token. _(native target: planned)_

## Distribution

Canopy publishes under the **`@rogueoak`** npm scope as a small set of versioned packages:

| Package            | Holds                                        | Status      |
| ------------------ | -------------------------------------------- | ----------- |
| `@rogueoak/roots`  | design tokens + Tailwind preset              | _(planned)_ |
| `@rogueoak/canopy` | components (`/seeds`, `/twigs`, `/branches`) | _(planned)_ |

## Quick start

> _(planned — available once the first packages publish)_

```bash
pnpm add @rogueoak/canopy @rogueoak/roots
```

```tsx
import { Button } from '@rogueoak/canopy/seeds';

export function Example() {
  return <Button>Plant a seed</Button>;
}
```

## Storybook

The component showcase — swatches, type specimens, and every component in light and dark —
lives on **GitHub Pages**, built from Storybook and deployed by CI on every push to `main`:
**https://rogueoak.github.io/canopy/**. The **Foundations** section is the living spec —
colour ramps + semantic swatches, the Figtree type specimen and scale, spacing, radii,
elevation, motion, and a WCAG AA contrast table. _(Light theme only; dark lands in 0004.)_

## Development

Canopy is a **pnpm + Turborepo** monorepo. Requires Node 20+ and pnpm 11+
(`npm install -g pnpm`). The workflow:

```bash
pnpm install      # install the workspace
pnpm build        # build tokens (Style Dictionary), components (tsup), and Storybook
pnpm storybook    # run the showcase locally at http://localhost:6006
pnpm test         # run the test suite (Vitest)
pnpm lint         # lint the workspace (ESLint + Prettier)
pnpm changeset    # record a version bump for release
```

Layout:

| Path              | Package            | What it is                                                                       |
| ----------------- | ------------------ | -------------------------------------------------------------------------------- |
| `packages/roots`  | `@rogueoak/roots`  | design tokens → CSS vars, typed TS export, Tailwind v4 preset (Style Dictionary) |
| `packages/canopy` | `@rogueoak/canopy` | components, built to ESM + types (tsup)                                          |
| `apps/storybook`  | _private_          | the Storybook showcase, deployed to GitHub Pages                                 |

> Roots now ships the **real foundation** (0003): primitive ramps + semantic tokens, type,
> spacing, radii, elevation, and motion. The placeholder `Sprout` component remains as the
> token → component → Storybook seam proof; real components arrive in 0005.

## Roadmap

Built foundation-first, so there's **always working software and working docs** at each step:

- [x] **0001 — README & living docs** — this page; kept truthful as the system grows
- [x] **0002 — Repo skeleton** — monorepo, token pipeline, Storybook, CI to GitHub Pages
- [x] **0003 — Roots** — the real palette, typography, and spacing (the foundation we lock)
- [ ] **0004 — Light & dark theming** — semantic theme remap + runtime switching
- [ ] **0005 — Seeds** — the first components
- [ ] **Twigs · Branches · Boughs** — composition layers, in turn

Development follows the [Spectra protocol](docs/spectra/protocol.md): every change is specced
in [`docs/specs/`](docs/specs), built and tested before merge, and **this README is updated
with each build** so the docs never outrun the software.

## License

[MIT](LICENSE) © rogueoak
