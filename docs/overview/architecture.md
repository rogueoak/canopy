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

### The `:root` / `.dark` emission — `themeConfig` factory (spec 0004; generalized 0003-fix)

Style Dictionary 4 resolves `source`/`include` **per config instance**, not per platform, so
`tokens.css` is produced by **one light pass + one pass per theme**, orchestrated by
`packages/roots/build.mjs` (the package `build` script runs `node build.mjs && tsup`):

1. **Light** — the default config (exported from `style-dictionary.config.mjs`) builds all
   sources _except_ the per-theme `*.<theme>.json` files
   (`source: ['tokens/**/*.json', '!tokens/**/*.*.json']`) into `:root` (`tokens.css`), the
   Tailwind preset, and the typed TS export — exactly as 0003.
2. **Each theme** — produced by a `themeConfig(name, glob)` **factory** (not a hand-written
   config). The factory sources only that theme's semantic file (e.g.
   `color/semantic.dark.json`) with `color/primitive.json` as `include` so dark references
   (`{color.moss.400}`) resolve, and registers a per-theme `css/theme-overrides-<name>` format
   that emits **only the theme's semantic tokens** (`token.isSource`, so the `include`d
   primitives are filtered out) as `var(--primitive)` references wrapped in a `.<name> { … }`
   selector, written to a sidecar `tokens.<name>.css`. The format **hard-errors** if a theme
   token is a non-reference (a flat hex would silently fork the primitive layer); `darkConfig`'s
   old dead `outputReferences` option is gone (the custom format does its own ref replacement).

The themes are a small data list — `export const themes = [{ name: 'dark', glob: '…' }]`.
**Adding a future theme is one entry + one `semantic.<name>.json` file** — no new hand-written
config, format, or build line. `build.mjs` iterates `themes`, building each sidecar.

`build.mjs` then composes `tokens.css` in a **single write**: it reads the freshly-built light
`tokens.css` and concatenates each theme sidecar onto it via `writeFileSync` (replacing the old
append-in-place). This makes the fold a **pure function of the build's outputs — idempotent**: a
re-run (or watch run) can't double-append a second `.dark` block. The theme passes + fold run in
a `try/finally` that removes every sidecar even on error, so a throw never leaves a stale sidecar
or a half-themed file. One file owns `:root` (light) + `.dark` (dark); primitives live once (in
`:root`), `.dark` carries only the ~37 semantic overrides, all reference-aware
(`var(--color-stone-950)`, never a flat hex — the seam from feedback 0001). Consumers add
`@custom-variant dark (&:where(.dark, .dark *))` to their global CSS for the rare explicit
`dark:` utility; the common path needs none.

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

A later **raised-surface** highlight token, `color-muted-raised` (feedback 0006, added with the
first portalled Seed), follows the same seam: it is the hover/focus fill for items on a
`surface-raised` popover, stepping *toward* the foreground in both themes (light `stone-100`, dark
`stone-700` — lighter than `surface-raised` `stone-800`) where base `muted` would recede in dark.
Guarded by a `text` × `muted-raised` AA pair in `tokens.test.ts`.

The contrast guard (`tokens.test.ts`) asserts AA for the foreground each state shows on its
**hover/active** fill, in **both** themes — a bad state step fails the build. `disabled` is
deliberately excluded (WCAG 2.1 §1.4.3 exempts disabled controls). Two state steps were nudged
in the 0003 fix so the near-black `.950` foreground keeps AA: light `accent-hover` lightens
(`amber-500` → `amber-400`, since accent's foreground is near-black) and dark `secondary-active`
lifts toward light (`bark-200`) rather than darkening.

### Dark border step (spec 0004; corrected 0003-fix)

Dark `border` → `stone-700` and `border-strong` → `stone-600` (not `stone-800`/`stone-700`). A
`stone-800` border equals `surface-raised` (also `stone-800`) — a ~1.0:1 invisible hairline on
popovers/menus — so the step was lifted one rung. Visual depth (border-vs-surface separation) is
not caught by any text-contrast check, so it is verified by eye in the Theme/Colours stories;
text-AA passing a 1.0:1 border was the gap feedback 0003 closed.

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
and `./seeds`); React/react-dom are peer deps, and the Radix runtime deps
(`@radix-ui/react-slot`) plus `@rogueoak/roots` are `external` (resolved at the consumer's
install, never bundled). Vitest + Testing Library + `user-event` (jsdom) drive the component tests.
The Seeds layer is now **complete at 15 atoms** — Batch 1 (specs 0005–0013: Button, Input, Label,
Badge, Checkbox, Switch, Radio Group, Textarea, Select) plus Batch 2 (0014–0019: Tooltip, Avatar,
Separator, Spinner, Skeleton, Keyboard). Every atom follows the same **cva + `cn()` + Radix** recipe
below; two of them are **portalled** on `surface-raised` (Select, then Tooltip), establishing the
raised-surface pattern that introduced the `muted-raised` token above. All refs type with
`React.ComponentRef` (not the deprecated `React.ElementRef`). The **Twigs** layer (molecules)
is now live too — `FormField`, `SearchBar`, `Card` (specs 0020-0022) — shipped on a new
`./twigs` subpath; see the Twigs composition recipe below.

### The component recipe (spec 0005)

Established with Button and followed by every later atom. The rule is **semantic-token utilities
only** — no palette values, no inline hex, no `dark:` on the common path — so light/dark is a
property of the token layer (0004), not the component.

- **`cn()`** (`src/lib/cn.ts`) — `twMerge(clsx(inputs))`. `clsx` resolves conditional/array/object
  class inputs; `tailwind-merge` de-dupes conflicting Tailwind utilities so a caller's `className`
  always overrides a component's defaults (e.g. caller `px-10` drops the recipe's `px-4`). `twMerge`
  is extended (`extendTailwindMerge`) to register the Roots typography roles (`text-display` /
  `h1…h4` / `body` / `body-sm` / `label` / `caption` / `code`) in the `font-size` group — otherwise
  it treats a composite role like `text-label` as a colour and drops it when combined with a real
  colour (`text-text`); the extension keeps the role and colour axes orthogonal (spec 0007).
- **cva variants** — `class-variance-authority` maps `variant` × `size` onto token-utility
  strings, with `defaultVariants`. Crucially every class string is a **full literal** — Tailwind
  v4's scanner only emits utilities it finds as literal strings in source, so a dynamically built
  `bg-${role}` would never generate (the same constraint the Foundations data arrays already obey).
- **Radix where behaviour/a11y warrant** — `@radix-ui/react-slot` powers `asChild`: when set, the
  component renders `Slot` (merging its classes/props onto the single child element) instead of the
  native tag, so a `<a>` can be styled as a Button without nesting an anchor in a button.
- **`forwardRef` + native prop spread** — components forward a ref to the underlying element and
  spread the rest of the native props, so they are drop-in for the host element.

### Tailwind-source distribution (Decision A — spec 0005)

Canopy ships **`className` strings, not CSS**. The consumer's own Tailwind v4 build generates (and
tree-shakes) the component utilities by scanning canopy's source, and the consumer's `.dark` flips
canopy along with the rest of their UI. Wiring is one global-CSS block: `@import 'tailwindcss'`,
`@import '@rogueoak/roots/tailwind-preset.css'`, and **`@source` pointing at `@rogueoak/canopy`**
(real apps: `'../node_modules/@rogueoak/canopy'`). Without the `@source`, components render
unstyled because the utilities are never emitted. **Storybook is the first consumer** and wires
this exact seam — `apps/storybook/.storybook/tailwind.css` adds
`@source '../../../packages/canopy/src'` (the path to canopy's component source from that file),
so a built Storybook contains Button's utilities (`bg-primary`, `hover:bg-primary-hover`,
`disabled:bg-disabled`, the focus ring, …), all resolving to the runtime token vars. A
prebuilt-CSS bundle for non-Tailwind consumers is deferred. Documented in the README quick start.

### The Twigs composition recipe (spec 0020)

The **Twigs** layer (molecules) is the first composition tier, established with **FormField**
(0020) and followed by **SearchBar** (0021) and **Card** (0022). Where a Seed is a single atom,
a Twig **composes Seeds** — and the recipe is a **compound component** (a root plus named parts)
that, where the parts need to share wiring, do so through a small React **context**. The same
token / `cn()` / full-literal-class / `forwardRef` rules as the Seeds recipe apply, with **no new
token and no `dark:`** — a Twig is themed by the Seeds it composes.

- **Subpath per layer.** Twigs ship on a new **`./twigs` subpath** (`@rogueoak/canopy/twigs`),
  parallel to `./seeds`: a tsup entry (`twigs/index` → `dist/twigs/index.js` + `.d.ts`) and a
  `./twigs` `exports` map. Imports stay self-documenting (`from '@rogueoak/canopy/twigs'`) and
  tree-shake per layer; the consumer's existing `@source '@rogueoak/canopy'` already covers the
  new files, so the styling seam is unchanged. The layer boundary is one-way — **twigs import
  seeds, never the reverse**.
- **Compound + context (FormField).** The canonical molecule: `FormField` generates a `useId`
  base, derives `${id}-description` / `${id}-message`, and provides them plus `invalid` /
  `disabled` via a `FormFieldContext`; the parts (`FormFieldLabel`, `FormFieldControl`,
  `FormFieldDescription`, `FormFieldMessage`) consume it. `FormFieldControl` is a Radix **`Slot`**
  that injects `id` / `aria-describedby` / `aria-invalid` / `disabled` onto **any** control Seed
  (Input, Textarea, Select trigger, Checkbox) without that Seed depending on the Twig.
  Description / Message **register their presence** (a mount/unmount effect) so the control's
  `aria-describedby` lists only the parts actually rendered — render-driven wiring, not prop
  archaeology. FormField also collects the **disabled-label affordance** the Label Seed (0007)
  deliberately deferred to "a FormField Twig."
- **Composition over new surface (SearchBar).** `SearchBar` composes Input + Button + Keyboard
  into one `<form role="search">` control (leading magnifier, a clear Button that appears with a
  value and refocuses the input, an optional display-only shortcut hint), mirroring the native
  controlled/uncontrolled contract and forwarding `ref` to the inner `<input>`. It adds nothing
  to the token layer — every part is an existing Seed.
- **Structural compound (Card).** `Card` + `CardHeader` / `CardTitle` / `CardDescription` /
  `CardContent` / `CardFooter` is a presentational surface compound on `surface-raised` + `border`
  + primitive `shadow-sm` (the raised-surface pattern from the portalled Seeds), with `CardTitle`
  using `Slot` (`asChild`) so the visual `text-h3` role rides onto a caller-chosen heading element
  and the document outline stays the caller's to control.

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
- `release.yml` (push of a bare-SemVer tag): publishes both packages to npm — see below.

**Releases are tag-driven and lockstep** (spec 0023). A **strict bare-SemVer git tag** (`X.Y.Z`,
no `v` prefix, no prerelease suffix, per trellis `rules/guidelines.md`) *is* the version:
`git tag 0.1.1 && git push origin 0.1.1`. Repo `package.json` versions stay at a `0.0.0`
placeholder, so the tag is the single source of truth — no version-bump PRs, no bot write
access, no changelogs. (Bootstrap: trusted publishing requires the package to pre-exist, so the
first version of each — `0.1.0` — was published manually before the publisher was configured;
the first CI tag is `0.1.1`.)
`release.yml` (trigger `on: push: tags: ['[0-9]*.[0-9]*.[0-9]*']`) checks out, sets up pnpm +
Node 24, `pnpm install --frozen-lockfile`, validates `$GITHUB_REF_NAME` is SemVer, then stamps
**both** packages with `pnpm -r --filter './packages/*' exec npm version "$GITHUB_REF_NAME"
--no-git-tag-version --allow-same-version`, runs a clean `pnpm build` (tsup `clean: true`
rebuilds `canopy/dist`, including the `./twigs` subpath its `exports` references), gates on
`pnpm test` (a tag is immutable, so this is the last stop for a regression that still compiles),
and publishes with `pnpm -r --filter './packages/*' publish --no-git-checks --access public`.
pnpm rewrites canopy's `workspace:*` dep on `@rogueoak/roots` to the published version, skips
the private Storybook app, and publishes roots before canopy via the workspace dep graph.
Both packages carry `publishConfig.access: public` and a `prepublishOnly: pnpm build` guard so
a manual publish can't ship stale `dist`.

Auth is **npm trusted publishing (OIDC)** — no `NPM_TOKEN` secret. The job grants
`id-token: write`; npm verifies the run against each package's trusted-publisher config
(repo + workflow filename `release.yml`), and pnpm exchanges the OIDC token for a short-lived
publish credential. This needs pnpm ≥ the OIDC fix (pnpm/pnpm#11526; the pinned `pnpm@11.8.0`
includes it) on Node 24, and `setup-node` deliberately omits `registry-url` (its `.npmrc` auth
stub would block the OIDC exchange). The developer-performed prerequisites — not automated —
are `@rogueoak` npm org membership and configuring the trusted publisher on each package at
`npmjs.com/package/<pkg>/access`.

### Toolchain note

pnpm 11 gates package build scripts; the workspace approves esbuild, style-dictionary, and
`@bundled-es-modules/glob` via `allowBuilds` in `pnpm-workspace.yaml`. A `.npmrc`
`public-hoist-pattern` for `*storybook*` is required so Storybook's preset loader resolves
`@storybook/react-vite/preset` under pnpm's isolated node_modules layout.
