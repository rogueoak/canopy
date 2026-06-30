# 0027 - icons package (@rogueoak/icons)

## Problem

Canopy has no icon offering. The README's Canopy model already names **Icon** as a Seeds-tier
atom, but no icon ships today: every story that needs a glyph hand-rolls an inline `<svg>` (see
`Button.stories.tsx`'s `LeafIcon`, and the inline SVGs inside SearchBar / Select). Consumers of
`@rogueoak/canopy` get components but no icons to put in them, and there is no consistent,
curated, themeable icon set that matches the design system.

We want a **curated icon set** drawn from [`react-icons`](https://react-icons.github.io/react-icons/),
shipped as its own versioned npm package under the `@rogueoak` scope, documented in the
Storybook showcase. v1 covers a set of standard UI glyphs plus the popular social/brand marks
(GitHub, LinkedIn, X, Facebook, Instagram).

This is the icon tier of the system. It is a **separate package** (not a `@rogueoak/canopy`
subpath) because it has a distinct dependency footprint (`react-icons`, not Radix/tokens), is
usable on its own without the canopy styling layer, and grows on its own cadence as icons are
added - keeping it out of the components package keeps both small.

## Outcome

- A new package `@rogueoak/icons` (`packages/icons/`) exports a **curated** set of React icon
  components under **design-system-semantic names** (`Home`, `Search`, `Settings`, `Github`,
  `Linkedin`, ...), each a thin re-export of a `react-icons` glyph - **not** the raw
  `react-icons` prefixed names (`LuHome`, `SiGithub`).
- Standard glyphs come from **Lucide** (`react-icons/lu`); brand/social marks come from the
  family that actually carries them (**Simple Icons**, `react-icons/si`), so the set can draw
  from more than one family while presenting one flat, consistent public surface.
- Each icon is an **individual, tree-shakeable named export** (`import { Home } from
  '@rogueoak/icons'`) - importing one icon never pulls the rest into the consumer's bundle.
- A small **size wrapper** gives the set consistent defaults: an `Icon` wrapper and/or an
  `IconProvider` that set a default size / stroke / `currentColor` for a subtree, while any icon
  still accepts a per-instance `size`, `className`, `title`, and the usual SVG props. Icons
  inherit colour from `currentColor` and scale with font-size by default, so they theme through
  whatever text colour they sit in - no token wiring required.
- The full curated set is rendered in **Storybook** as a browsable catalog (a grid of every
  icon with its export name), so the icon list is living documentation.
- `@rogueoak/icons` builds to ESM + types with tsup, has its own npm `README.md`, and is
  picked up by the existing tag-driven release (`packages/*` lockstep) once bootstrapped on npm.

## Scope

**In**
- `packages/icons/` → `@rogueoak/icons`: `package.json` (exports `.`, `react-icons` as a runtime
  dependency, `react` peer), `tsconfig.json`, `tsup.config.ts` (ESM + `dts`, externalizing
  `react`/`react-dom`/`react-icons`), `vitest` setup, and an npm `README.md`.
- A **curated registry**: semantic-named re-exports of a first set of standard Lucide glyphs
  plus the five social marks (Github, Linkedin, X, Facebook, Instagram) from Simple Icons. The
  exact first list is enumerated in Approach; the bar is "a useful standard set," not exhaustive.
- The **size wrapper**: an `Icon` component (default size, `currentColor`, merges `className`)
  and/or an `IconProvider` (subtree defaults via react-icons' `IconContext`), plus the shared
  `IconType`/props type re-exported for consumers typing an icon prop.
- A **Storybook catalog** under a new top-level section (e.g. `Icons/Catalog`) rendering every
  curated icon with its name, plus a usage story showing the size wrapper and `className` sizing.
- Tests: the package exports the icons it claims (the catalog and the exports can't silently
  drift), an icon renders an `<svg>`, the size wrapper applies its default and a `className`
  override wins, and an icon given a `title` is accessible (and aria-hidden when decorative).
- Wiring the new package into the workspace: `pnpm-workspace.yaml` already globs `packages/*`
  (turbo + the release workflow pick it up automatically); add it to the storybook app's deps,
  and update the README packages table + the Canopy model note so Icon is shown as its own
  package, not implied to live inside `@rogueoak/canopy`.
- Documenting the **developer-performed npm bootstrap** for the new package (mirrors 0023):
  manual first publish + trusted-publisher config, required before the first tag release that
  includes icons.

**Out**
- An exhaustive icon set - v1 is a curated starter list; adding icons later is a trivial
  follow-up (one line per icon), not a new spec.
- Splitting the export into subpaths (`./social`, etc.) - single `.` entry for v1; one flat
  surface, tree-shaking handles unused icons. Subpaths are a future option if the set grows.
- Refactoring existing canopy components/stories to consume `@rogueoak/icons` (Button's inline
  `LeafIcon`, SearchBar/Select inline SVGs) - a clean follow-up once the package exists; this
  spec ships the package, not the migration.
- Making `@rogueoak/canopy` depend on `@rogueoak/icons` - the two stay independent in v1.
- Any roots/token or Tailwind dependency in the icons package - icons are styling-agnostic
  (they colour via `currentColor`); `className`/`size-*` sizing is the documented canopy path
  but not a hard dependency.
- Custom/vendored SVGs or a build-time SVG-to-component pipeline - we re-export `react-icons`
  (the decision recorded for this spec); no own icon assets.
- Changing the lockstep release model (independent per-package versions stay out, per 0023).

## Approach

**Distribution: thin curated re-exports.** Each icon is a re-export of a `react-icons` glyph
under a semantic name, e.g. `export { LuHome as Home, LuSearch as Search } from 'react-icons/lu'`
and `export { SiGithub as Github, SiLinkedin as Linkedin, SiX as X, SiFacebook as Facebook,
SiInstagram as Instagram } from 'react-icons/si'`. The public surface is the design system's
own vocabulary; the `react-icons` family prefixes never leak. `react-icons` glyphs are already a
uniform `IconType` (accept `size`, `color`, `title`, `className`, spread SVG props; render an
`<svg>` with `fill`/`stroke: currentColor` at a default `1em`), so re-exporting keeps a
consistent API for free. Pin `react-icons` `^5` (5.7.0 verified to ship the `lu` and `si`
subsets) as a real **dependency** (not a peer): the curated names are our contract, so we own
the version that backs them.

**Size wrapper.** Two complementary pieces, both thin:
- `IconProvider` - a re-export/alias of `react-icons`' `IconContext.Provider`, so an app can set
  defaults (`size`, `className`, `color`) for a whole subtree; every re-exported icon already
  reads this context.
- `Icon` - a small wrapper component that applies the system default size and `currentColor` and
  merges an incoming `className` (last-wins), for one-off use without a provider. It takes an
  `icon`/`as` prop or wraps `children`, whichever reads cleaner at build time.
Document the canopy-idiomatic sizing path (`className="size-4 text-muted-foreground"`, scaling
with `text-*`) alongside the `size` numeric prop, so consumers in and out of Tailwind both work.

**Accessibility.** Icons are decorative by default - render `aria-hidden` unless a `title` is
provided, in which case `react-icons` emits a `<title>` and the icon becomes a labelled
`img`-role graphic. The catalog and tests assert both modes (decorative hidden, titled labelled),
following the learning that a11y promises are guarded by observable outcomes, not scaffolding.

**Curated first set (Lucide unless noted).** Standard: `Home, Search, Settings, User, Menu, X
(close), Check, ChevronDown, ChevronRight, ChevronLeft, ChevronUp, ArrowRight, ArrowLeft, Plus,
Minus, Trash, Edit (pencil), Copy, Download, Upload, ExternalLink, Info, AlertTriangle, AlertCircle,
CheckCircle, Bell, Calendar, Mail, Eye, EyeOff, Sun, Moon, Loader (spinner), MoreHorizontal,
MoreVertical, Filter, Star, Heart, Lock, Unlock, LogOut`. Social (Simple Icons): `Github,
Linkedin, X (as the brand `XBrand`/`Twitter` to avoid colliding with the `X`/close glyph -
resolved at implementation), Facebook, Instagram`. Note the **name collision**: Lucide's close
"X" and the X (Twitter) brand both want `X`; the build resolves this (e.g. close = `Close`,
brand = `X`), and the resolution is documented in the README so it's not surprising.

**Build & workspace.** `tsup` ESM + `dts`, single `index.ts` entry, `clean: true`,
externalizing `react`, `react-dom`, and `react-icons` (per the canopy externalization rule:
peers + deps are external, only first-party source is bundled). `pnpm-workspace.yaml`'s
`packages/*` glob already includes the package, so turbo's `^build` graph and the release
workflow's `--filter './packages/*'` cover it with no workflow edit. Add `@rogueoak/icons`
(`workspace:*`) to the storybook app so the catalog can import from it.

**Release / npm bootstrap (developer-performed, documented - mirrors 0023).** The tag-driven
workflow publishes **all** `packages/*` lockstep via OIDC trusted publishing. npm trusted
publishing can only be configured on a package that already exists, so **before the first tag
release that includes icons**, the developer must: (1) ensure the `@rogueoak` org membership,
(2) manually publish the first `@rogueoak/icons` version - stamping the **current trio version**
into the manifest first so the package lands aligned with roots/canopy (e.g. `npm version 0.2.0
--no-git-tag-version` then `pnpm --filter @rogueoak/icons publish --access public`), **not** the
`0.0.0` repo placeholder, (3) configure the trusted publisher (this repo, workflow `release.yml`)
on the package. **Ordering risk to call out:** because publish is lockstep, if a tag is pushed before
icons is bootstrapped, icons' OIDC publish fails and leaves a partial release (roots/canopy may
already be live at that tag) - so the bootstrap must land before the next tag. `publishConfig`,
`repository`/`homepage`/`bugs`, and a `prepublishOnly` clean-build guard go on the package's
manifest like the other two.

**Trade-offs.**
- *Re-export vs vendored SVGs*: re-exporting takes a `react-icons` runtime dependency and
  inherits its markup/API, but is near-zero-maintenance and trivially extensible (one line per
  icon). Vendoring would give full markup control and drop the dep, at the cost of a build
  pipeline and a manual add step - rejected for v1 (recorded decision).
- *Lockstep versioning*: icons gets a version bump on every release even when only it changed (and
  vice-versa), consistent with the roots/canopy lockstep model - accepted, keeps tag-as-version
  trivial.
- *Single `.` export*: simpler surface, full tree-shaking preserved; subpaths deferred until the
  set is large enough to warrant grouping.

## Acceptance

- [ ] `packages/icons/` exists as `@rogueoak/icons`: builds to ESM + types via tsup, exports `.`,
      lists `react-icons` (`^5`) as a dependency and `react` (`^19`) as a peer, and has no
      dependency on `@rogueoak/roots` or Tailwind.
- [ ] `import { Home, Github } from '@rogueoak/icons'` works; every public name is a
      **semantic** name (no `Lu*`/`Si*` prefix leaks), and importing one icon does not bundle the
      others (tree-shakeable individual exports).
- [ ] The five social marks - `Github`, `Linkedin`, `X` (brand), `Facebook`, `Instagram` - and a
      useful standard set (the Approach list, or a documented subset) are all exported; the
      Lucide-close vs X-brand name collision is resolved and documented.
- [ ] A size wrapper ships: `IconProvider` sets subtree defaults and/or `Icon` applies a default
      size + `currentColor`; an incoming `className` overrides the default (last-wins), and the
      shared icon props/`IconType` is re-exported for consumers.
- [ ] Icons are decorative (`aria-hidden`) by default and become accessibly labelled when given a
      `title`; both are covered by tests.
- [ ] A Storybook catalog renders **every** curated icon with its export name (living list), plus
      a usage story for the size wrapper and `className` sizing; `pnpm storybook` build is green.
- [ ] Tests prove the claimed icons are exported (catalog/exports can't silently drift), an icon
      renders an `<svg>`, and the wrapper default + override behave; `pnpm test`/`lint`/`build`
      pass from the root (new package included in turbo).
- [ ] `@rogueoak/icons` has its own npm `README.md` (install, the curated list / how to find
      names, the size wrapper, sizing + a11y notes), included in the packed tarball
      (`pnpm --filter @rogueoak/icons pack --dry-run`).
- [ ] Root `README.md` updated: `@rogueoak/icons` added to the packages table, and the Canopy
      model note reconciled so Icon is shown as its own package (the README never outruns reality).
- [ ] The spec documents the developer-performed npm bootstrap (org membership, manual first
      publish, trusted-publisher config) and the lockstep ordering risk (bootstrap must precede
      the first tag release including icons).
- [ ] `overview/features.md` (new icons capability) and `overview/architecture.md` (third
      published package; icons tier, dependency footprint, lockstep inclusion) updated on completion.
