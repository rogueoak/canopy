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

Four projects:

- **`packages/roots`** → `@rogueoak/roots` — design tokens.
- **`packages/canopy`** → `@rogueoak/canopy` — components.
- **`packages/icons`** → `@rogueoak/icons` — curated icon set (spec 0027).
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
   tokens live in CSS, not a JS config object. It **also ships the design system's overlay-motion**
   — `@keyframes` + a `@theme` block of `--animate-dialog-*` vars (composing the `--duration-*` /
   `--ease-*` motion tokens) that generate `animate-dialog-*` utilities — folded in from the
   hand-authored `preset-motion.css` partial by `build.mjs` (an idempotent single write, like the
   `tokens.css` fold). Keyframes / `@theme --animate-*` are theme declarations, not utilities, so
   `@source` could never emit them; shipping them from the preset every consumer imports is what
   makes a component's keyframed motion (first: Dialog) work out of the box. First consumed 0024.

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
or a half-themed file. By the same idempotent-single-write pattern, `build.mjs` also folds the
`preset-motion.css` partial (keyframes + the `--animate-dialog-*` theme vars) onto the freshly-built
`tailwind-preset.css`, so the overlay-motion ships with the preset every consumer imports. One file
owns `:root` (light) + `.dark` (dark); primitives live once (in
`:root`), `.dark` carries only the ~37 semantic overrides, all reference-aware
(`var(--color-stone-950)`, never a flat hex — the seam from feedback 0001). Consumers add
`@custom-variant dark (&:where(.dark, .dark *))` to their global CSS for the rare explicit
`dark:` utility; the common path needs none.

### Brand pipeline (spec 0028)

The same `:root` + `.dark` seam that themes Canopy also lets a CONSUMER ship their own brand without
forking roots. A brand is the two-tier model authored by the consumer: NEW primitive ramps (any
names) plus semantic roles that reference them using **Canopy's role names**. `buildBrand()`
(`packages/roots/brand.mjs`, exported at `@rogueoak/roots/brand`, with a `roots-brand` CLI in
`cli.mjs`) compiles those DTCG files into one `brand.css`:

- a **light pass** (brand primitives + light semantics) through the SAME `css/variables-with-roles`
  format with `outputReferences`, emitting a `:root { }` block - brand primitives as hex literals,
  light roles as `var(--<brand-primitive>)`;
- a **dark pass** (dark semantics only) through the SAME theme-overrides format Canopy's `.dark`
  uses, emitting a `.dark { }` block of `var(--<brand-primitive>)` overrides. To reuse that format,
  `themeConfig`/`registerThemeFormat` gained a `selector` (+ `include`/`buildPath`/`destination`)
  parameter; Canopy's own dark build passes none, so its output is unchanged.

`brand.css` is composed in one write (light block + dark block; sidecars removed in `finally`, the
same idempotent pattern as `build.mjs`). Imported after `tokens.css`, its `:root`/`.dark` win by
cascade and re-point every role, so every component and utility re-themes with zero component code.
A `scope` option emits `.<brand>` / `.<brand>.dark` instead of `:root` / `.dark`, scoping a brand to
a subtree.

The **WCAG AA guard is one definition, reused**: the relative-luminance math + the canonical
role-pair list (`AA_PAIRS`) live in `packages/roots/contrast.mjs`; `tokens.test.ts` imports them to
guard the core tokens, and `buildBrand()` runs `checkBrandCss()` over the generated `brand.css`.
`buildBrand()` validates the composed CSS BEFORE writing `brand.css` (a failed build leaves no
shippable file) and **throws** (fails the consumer's build) when any pair breaks AA in either theme,
when a dark override resolves EQUAL to its light value (a copy-paste guard mirroring the core,
allowlisting the one theme-invariant `accent-foreground`), or when a dark override is a flat hex
(the last via the reused format's existing hard-error). A brand may map **any subset** of the roles:
whatever it omits inherits Canopy's default by cascade (`tokens.css` is imported first). The AA guard
resolves an omitted role to that default and checks the **effective** pair - a brand override against
an inherited default - so a partial brand can't ship an illegible combination either (feedback 0011).
The **role list AND each role's resolved default hex are derived from Canopy's own shipped
`dist/tokens.css`** (`resolveCanopyDefaults()`), so neither can drift from what Canopy actually
ships. A consequence of the fallback: **adding a semantic role to Canopy is NO LONGER breaking for
the brand API** - an existing brand keeps building and the new role simply inherits its (already
AA-verified) Canopy default until the brand chooses to map it. Because a brand renames its ramps, its
status roles are plain leaves referencing those ramps - no `.DEFAULT` trick needed (that trick only
exists to dodge a role/ramp name collision).

`style-dictionary` is an OPTIONAL `peerDependency`: the token exports (`.`, `./tokens.css`,
`./tailwind-preset.css`) never touch it; only the build-time brand pipeline does, so a consumer pays
for it only if they use it. The pipeline source files (`brand.mjs`, `cli.mjs`, `contrast.mjs`,
`style-dictionary.config.mjs`) and the `examples/sunset/` brand ship in the package `files`. A quick
**runtime** path (an app redefining `--color-*` in its own `:root`/`.dark`) is documented for cases
that don't need the guard.

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
`./twigs` subpath, and the **Branches** layer (organisms) has opened with `Dialog` (spec 0024) on a
`./branches` subpath; see the Twigs and Branches composition recipes below.

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

### The Branches composition recipe (spec 0024)

The **Branches** layer (organisms) is the composition tier above Twigs, opened with **Dialog**
(0024). Where a Twig composes atoms presentationally, a **Branch additionally owns interaction state
and a portal**: it leans on Radix for the behavioural core (a state machine + focus management +
ARIA) and is otherwise composition + token styling. The same `cn()` / full-literal-class /
`forwardRef` / `React.ComponentRef` rules apply, with **no new token and no `dark:`** — a Branch is
themed by the layers it composes and the tokens already provisioned.

- **Subpath per layer.** Branches ship on a new **`./branches` subpath** (`@rogueoak/canopy/branches`),
  parallel to `./seeds` and `./twigs`: a tsup entry (`branches/index` → `dist/branches/index.js` +
  `.d.ts`) and a `./branches` `exports` map. The layer boundary is one-way — **branches import
  twigs and seeds, never the reverse**. **Class generation** via `@source '@rogueoak/canopy'` is
  unchanged (it already covers the new files) — but Dialog's keyframed **motion** can't come from
  `@source` (keyframes / `@theme --animate-*` are theme declarations, not scannable utilities), so it
  ships from the Roots **preset** the consumer already imports (see the preset/motion-fold above).
- **Stateful portalled compound (Dialog).** Built on **`@radix-ui/react-dialog`** (added to
  `dependencies` **and** tsup `external`, like every other Radix dep): Radix owns `open`/`onOpenChange`,
  the focus trap, return-focus, scroll lock, `Esc`-to-close, and the `role="dialog"` +
  `aria-labelledby`/`aria-describedby` wiring. `DialogContent` is portalled (`DialogPrimitive.Portal`)
  with the overlay as a sibling — the **third portalled surface** after Select and Tooltip, so
  it inherits the theme for free (`.dark` lives on `<html>`, the portal mounts under `<body>`). The
  overlay is **module-internal** (not exported): `DialogContent` owns the scrim, so a public
  standalone overlay would only invite a double-scrim.
- **No new token — reuse `color-overlay`.** The scrim uses the **pre-provisioned** `color-overlay`
  semantic token at reduced opacity (`bg-overlay/80`), authored back in 0004 "used at reduced opacity
  behind modals"; the content card reuses the raised-surface tokens (`surface-raised` + `border`,
  close-button hover on `muted-raised`) and the primitive `shadow-lg`. So the first Branch adds **no
  token** — "a Branch is themed by the layers it composes / the tokens already provisioned." A true
  elevation **shadow** token (feedback 0006) would be a Roots spec, not this one.
- **`aria-modal` added explicitly.** Radix advertises modality by `aria-hidden`-ing sibling content
  rather than emitting `aria-modal`, so `DialogContent` sets `aria-modal="true"` directly to match the
  ARIA APG modal-dialog pattern.
- **Motion ships from the Roots preset.** Enter/exit fade + zoom are gated with
  `motion-reduce:animate-none` and reference named `animate-dialog-*` utilities driven by Radix's
  `data-[state=open|closed]` hooks. Those keyframes + `--animate-dialog-*` theme vars **ship from
  `@rogueoak/roots/tailwind-preset.css`** (folded in from `preset-motion.css` by `build.mjs`,
  composing the `--duration-*` / `--ease-*` tokens), which every consumer already imports — so the
  motion works out of the box, not consumer-provided. It can't come from `@source`: keyframes / a
  `@theme --animate-*` declaration are theme declarations, not utilities the scanner can emit.
- **Hand-rolled stateful compound (TopNav, spec 0025).** TopNav is the first **non-portalled,
  stateful** Branch — the counterpoint to Dialog. It still _owns interaction state_ (what makes it a
  Branch), but **hand-rolls the disclosure** instead of pulling a Radix primitive: a small
  `TopNavContext` (`open` / `setOpen` / `close` / a `useId` `panelId` / the menu button's ref) plus a
  single `<header>`-scoped effect that, while open, listens for a document **`pointerdown` outside the
  header** (close) and **`Escape`** (close **and** return focus to the menu button — the same
  return-to-trigger idea as Dialog, without the portal/focus-trap weight). The menu button advertises
  the disclosure with **`aria-expanded` + `aria-controls`** pointing at the `TopNavLinks` `id`
  (`panelId`); `aria-current="page"` on an `active` link is set in lockstep with its styling (the
  attribute-driven pattern). It adds **no Radix disclosure dep, no new token** — only the Button Seed
  (the ☰ toggle) and Radix `Slot` (already a dep) for `asChild` on Brand/Link. The responsive collapse
  is pure CSS: `TopNavLinks` is ONE element styled as an inline `md:flex` row above the breakpoint and
  an `absolute` disclosure panel below it when `open`, with the `md:hidden` / `md:flex` literals
  written out in full so the Tailwind scanner emits them. So Branches now span both ends: **portalled
  + Radix-driven (Dialog)** and **in-flow + hand-rolled (TopNav)**, sharing the same recipe rules
  (`cn()`, full-literal classes, `forwardRef` + native spread, no `dark:`, no new token).

- **Responsive landmark organism (SideNav, 0026).** The side rail (spec 0026) shows the second
  Branches shape: a compound that owns a small `SideNavContext` (the desktop `collapsed` state, the
  mobile `open` state) and renders one of two wrappers picked by a **`useIsMobile()`** matchMedia
  hook (`(max-width: 767px)`, SSR-safe `false`). Choosing the wrapper in JS — rather than rendering
  both forms behind `md:` visibility utilities — means the single `<nav aria-label>` landmark
  renders **exactly once**, so there is never a duplicated navigation landmark or a doubled
  `aria-current`. The **mobile drawer reuses `@radix-ui/react-dialog` directly** — the Radix
  *primitive* (already a dep from Dialog 0024, already in tsup `external`), NOT canopy's centred
  `Dialog` component, whose centring / `max-w-lg` / baked close button would fight a side drawer.
  This is the spec's "reuse Dialog's pattern, don't re-invent modal mechanics": Radix supplies the
  focus trap, scroll lock, `Esc`/outside-click dismiss; we style its `Overlay` as the same
  `bg-overlay/80` scrim and its `Content` as a left-anchored full-height panel with an sr-only
  `DialogPrimitive.Title` (Radix requires a Title for the dialog's accessible name). Because the
  `SideNavTrigger` lives in the app bar (a **sibling** of SideNav, not a descendant), it can't share
  the context — so it is decoupled (consumer-wired: `onClick` to open, `aria-expanded`/`-controls`
  passed in), and **return-focus is handled by SideNav**, which captures the opener in the drawer's
  `onOpenAutoFocus` (still the active element at that point) and restores it in `onCloseAutoFocus`
  rather than relying on a Radix DialogTrigger that doesn't exist. Collapsed labels ride the
  **Tooltip Seed** (the rail wraps a `TooltipProvider` internally so it works with no consumer
  setup) and items keep their accessible name via an `sr-only` label — never an unlabelled
  icon-only link. **No new dependency, no new token, no `dark:`** — the rail/drawer/scrim style on
  existing semantic tokens and the portalled drawer themes correctly (`.dark` on `<html>`). The
  drawer is a genuine portalled raised surface, so it follows that pattern: it is **elevated**
  (`bg-surface-raised` + `shadow-lg` + `border-r`, vs the in-flow desktop `<aside>` on plain
  `bg-surface` with no shadow), it **slides** (`animate-drawer-in`/`-out`, a left-edge translate that
  ships from the Roots preset alongside the dialog keyframes — see the preset/motion fold above; the
  overlay reuses the dialog fade), and it carries a **visible `X` close button** (`DialogPrimitive.Close`,
  mirroring Dialog's close affordance) plus ≥44px (`min-h-11`) drawer touch targets. SideNav also
  exports a **`useSideNavCollapsed()`** hook (`{ collapsed, mobile }`) so an `asChild` item can adapt
  to the icon-rail, and a **`mobile?` prop** to override `useIsMobile()` for SSR/first-paint correctness.

- **TopNav vs SideNav — same recipe, different interaction class.** The two navigation Branches are
  deliberately the two ends of the disclosure spectrum. **TopNav is a non-modal, in-flow disclosure:**
  it hand-rolls its own open/close (a small context + an Esc/outside-click effect), takes **no Radix
  disclosure dependency**, and its panel is part of the document flow (an `absolute` panel below the
  bar) — dismissing it neither traps focus nor locks scroll. **SideNav's drawer is a modal, off-canvas
  surface:** it **reuses the `@radix-ui/react-dialog` primitive** for the focus trap, scroll lock, and
  `Esc`/outside-click dismiss that a modal owes its user, and is portalled + elevated + animated. So
  the adjacent paragraphs aren't contradictory: both are stateful, slot-based, single-`<nav>`-landmark
  Branches sharing the recipe rules (`cn()`, full-literal classes, `forwardRef` + native spread, no
  `dark:`, no new token) — they differ only in **interaction class** (non-modal in-flow vs modal
  off-canvas), and each picks the lightest mechanism that class warrants (hand-rolled vs Radix dialog).

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
- `release.yml` (push of a bare-SemVer tag): publishes every `packages/*` package to npm — see below.

**Releases are tag-driven and lockstep** (spec 0023). A **strict bare-SemVer git tag** (`X.Y.Z`,
no `v` prefix, no prerelease suffix, per trellis `rules/guidelines.md`) *is* the version:
`git tag 0.1.1 && git push origin 0.1.1`. Repo `package.json` versions stay at a `0.0.0`
placeholder, so the tag is the single source of truth — no version-bump PRs, no bot write
access, no changelogs. (Bootstrap: trusted publishing requires the package to pre-exist, so the
first version of each — `0.1.0` — was published manually before the publisher was configured;
the first CI tag is `0.1.1`. **`@rogueoak/icons` (0027) needs the same one-time bootstrap before
its first tag release** — a manual first publish + trusted-publisher config — since the release is
lockstep and would otherwise fail the OIDC publish for an unconfigured package.)
`release.yml` (trigger `on: push: tags: ['[0-9]*.[0-9]*.[0-9]*']`) checks out, sets up pnpm +
Node 24, `pnpm install --frozen-lockfile`, validates `$GITHUB_REF_NAME` is SemVer, then stamps
**every `packages/*` package** with `pnpm -r --filter './packages/*' exec npm version
"$GITHUB_REF_NAME" --no-git-tag-version --allow-same-version`, runs a clean `pnpm build` (tsup
`clean: true` rebuilds `canopy/dist`, including the `./twigs` subpath its `exports` references),
gates on `pnpm test` (a tag is immutable, so this is the last stop for a regression that still
compiles), and publishes with `pnpm -r --filter './packages/*' publish --no-git-checks --access
public`. pnpm rewrites canopy's `workspace:*` dep on `@rogueoak/roots` to the published version,
skips the private Storybook app, and publishes roots before canopy via the workspace dep graph
(`@rogueoak/icons` has no workspace deps, so it publishes independently). Every package carries
`publishConfig.access: public` and a `prepublishOnly: pnpm build` guard so a manual publish can't
ship stale `dist`.

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

## Icons package (`@rogueoak/icons`, 0027)

A standalone package — **not** a `@rogueoak/canopy` subpath — because its dependency footprint
(`react-icons`, no Roots/Tailwind) and its add-an-icon cadence differ from the components. It is
deliberately decoupled: `@rogueoak/canopy` does **not** depend on it, and icons colour via
`currentColor` (react-icons' default), so they need no token layer to theme — they inherit the
text colour wherever they render.

- **Distribution model: thin curated re-exports.** `src/icons.ts` is the single source of truth —
  one line per icon, `export { LuHouse as Home } from 'react-icons/lu'` — mapping `react-icons`
  glyphs to Canopy-semantic names. Lucide (`lu`) for standard glyphs, Font Awesome 6 brands (`fa6`)
  for the five social marks (Simple Icons dropped LinkedIn, so all five come from one family).
  `react-icons` is a runtime **dependency** (we own the version backing our names), externalized by
  tsup like every other dep; only first-party source is bundled.
- **Tree-shaking.** Individual named exports + `sideEffects: false` keep single-icon imports lean.
  `registry.ts` derives `iconRegistry` (name → component) and `iconNames` from `src/icons.ts` by a
  namespace spread — it references the whole set (for the catalog / dynamic use), so it is dropped by
  the consumer's bundler unless explicitly imported.
- **`Icon` / `IconProvider` (`src/Icon.tsx`).** react-icons does not hide a decorative icon or set
  `role="img"` for a titled one, so the `Icon` wrapper owns that: `aria-hidden` by default, a labelled
  `role="img"` when given a `title`, plus the default `1em` size and className merge. `IconProvider`
  is a thin alias of react-icons' `IconContext.Provider` for subtree defaults.
- **No-drift guard.** Because the catalog (Storybook `Icons/Catalog`), the registry, and the public
  exports all derive from `src/icons.ts`, a test asserts every registry name is a package export and
  renders an `<svg>` — the rendered docs cannot diverge from what consumers import.
