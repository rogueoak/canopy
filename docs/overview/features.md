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

## Roots foundations (0003)

The real two-tier design-token foundation — what every Canopy component styles against. Light
theme only; the dark remap + runtime switching are 0004.

- **Primitive ramps** (`color/primitive.json`) — eight `50…950` ramps: `moss` (brand),
  `bark`, `stone` (warm neutrals), `amber` (accent), and desaturated functional ramps
  `success` / `warning` / `danger` / `info`, plus `base.white`. Muted & natural, moss/olive
  brand. Never consumed directly by components.
- **Semantic tokens** (`color/semantic.json`) — light-theme roles that **reference** primitives
  (e.g. `color-primary` → `var(--color-moss-600)`): surfaces, text, lines, roles + foregrounds,
  and status + foregrounds. Components consume only these; the reference seam means 0004 remaps
  this layer alone. Functional roles use the `.DEFAULT` convention so `--color-success`
  (→ `bg-success`) coexists with the `--color-success-600` ramp step. `accent` is a **fill-only**
  role (amber.500, below AA on `bg`); **`accent-strong`** (amber.700, ~6.15:1) is the AA-passing
  accent for text/icon/border. A `ring-offset` role provides the focus-ring gap colour on
  coloured surfaces.
- **Typography primitives** (`typography.json`) — `font.sans` (Figtree) + `font.mono` (Geist Mono)
  family names; type scale `text-xs…6xl` (12→60px); weights, leading, tracking
  (`tighter`/`tight`/`normal`/`wide`).
- **Composite text roles** (`typography-roles.json`) — semantic roles `display`, `h1…h4`, `body`,
  `body-sm`, `label`, `caption`, `code` (mono), each composing **references** to the type
  primitives and emitted as Tailwind v4 `text-<role>` utilities with companion vars, so
  `text-h2` applies font-size + line-height + font-weight + letter-spacing in one class.
  Components style against these, not raw scale + weight + leading.
- **Spacing / radii / elevation / motion** — `space.0…32` (4px base); `radius.none…full`;
  `shadow.sm…xl` (soft, warm); `duration.fast/base/slow` + `ease.standard/emphasized/decelerate`.
- **Self-hosted fonts** — Figtree + Geist Mono via `@fontsource-variable/*`, imported in
  Storybook's global CSS. Roots ships only the family tokens; consumers install @fontsource.
- **Tailwind v4 utilities** — token names flatten onto `@theme` namespaces so utilities
  generate (`bg-*`, `text-lg`, `font-sans`, `rounded-md`, `shadow-md`); spacing utilities
  (`p-4` = 1rem) derive from a single `--spacing: 0.25rem` base.
- **Foundations stories** — Storybook `Foundations` section renders ramps + semantic swatches,
  the Figtree specimen + type scale + weights + leading, spacing, radii, elevation, motion, and
  a WCAG AA contrast table. The visual lock surface.
- **Contrast** — all primary text roles meet WCAG AA (≥ 4.5:1) on their intended surfaces;
  `text-subtle` (tertiary) meets AA-large (≥ 3:1), documented as for large/non-essential text.
  Guarded by an **executable contrast test** (`tokens.test.ts`) that resolves each role to its
  real primitive hex and computes the WCAG ratio, so a future ramp/remap can't silently break AA.

## Light & dark theming (0004)

Theming as a property of the **token layer** — toggle one class, the whole UI re-themes, no
per-component code.

- **Dark theme** (`color/semantic.dark.json`) — a dark remap of **every** semantic colour role
  (surfaces invert to `stone-950/900/800`, text lightens to `stone-50/300/400`, borders to
  `stone-700/600` — kept a step above `surface-raised` so they stay visible, `primary` → the
  lighter `moss-400`, secondary/accent/status retuned), authored as DTCG tokens that
  **reference** primitives (never flattened). Emitted as a `.dark { … }` block in `tokens.css`
  that overrides only the semantic runtime vars; primitives (shared ramps) are not repeated.
- **Theme factory** — non-default themes are produced by a `themeConfig(name, glob)` factory and
  a small `themes` data list, with an idempotent single-write build. Adding a future theme is one
  list entry + one `semantic.<name>.json` file — no new hand-written config, format, or build line.
- **Runtime switching** — class-based `.dark` on a root element. Because utilities and the typed
  export reference the runtime vars, toggling `.dark` re-resolves `bg-primary`, `text-default`, …
  automatically. The Tailwind preset and TS export are unchanged. A `@custom-variant dark` is
  added in consumer CSS for the rare explicit `dark:` utility; a documented one-line toggle (+ an
  optional `prefers-color-scheme` bootstrap) ships in the README.
- **Interaction-state tokens** — `color-<role>-hover`/`-active` for `primary`/`secondary` (+
  `accent-hover`, `danger-hover`) pointing at adjacent ramp steps, and a `color-disabled` surface
  + `color-disabled-foreground` convention. **Light and dark values defined together.**
- **Moss-green refinement** — the brand `moss` ramp re-tuned greener (less yellow); light primary
  `moss-600 #4c6634` and dark primary `moss-400 #80a85c` share one hue. Only `moss` changed.
- **AA in both themes** — the executable contrast test resolves role pairs for **light _and_
  dark** (reading the `.dark` block, chasing references to primitive hexes) and asserts AA in each,
  including the **interaction-state** surfaces (foreground on `*-hover`/`*-active` for
  primary/secondary/danger/accent); `disabled` is deliberately excluded (WCAG exempts disabled
  controls). Coverage guards assert every themed var has a `.dark` override that **differs** from
  light (no copy-paste, no silent fallthrough, no dark-only orphan), references a **primitive ramp**
  path, and that exactly one `.dark` block exists. Status fills `danger`/`info` use `.300` in dark,
  and `accent-hover` (light) / `secondary-active` (dark) were nudged so their near-black foreground
  reaches AA.
- **Storybook** — a **functional** Light/Dark toolbar toggle (flips `.dark` on `<html>`); all
  Foundations stories read correctly in both themes (semantic swatches read their hex live; the
  **Contrast** table computes ratios live per theme), plus a **Theme** demo card built only from
  semantic utilities that re-themes with the toggle.

## Seeds: Button + the component recipe (0005)

The first real **Seed** — and the shared **component recipe** every later atom follows. The
throwaway `Sprout` placeholder is removed.

- **Button** (`@rogueoak/canopy/seeds`) — variants `primary` (default) / `secondary` /
  `outline` / `ghost` / `destructive`; sizes `sm` / `md` (default) / `lg` / `icon`; hover +
  active via the 0004 interaction tokens; a `disabled` state using the `bg-disabled` /
  `text-disabled-foreground` token pair (not opacity); a focus-visible ring on the `ring` /
  `ring-offset` tokens; and `asChild` (Radix `Slot`) for polymorphism (e.g. a link styled as a
  button). `forwardRef` + full native `<button>` prop spread. Styled **only** with semantic-token
  utilities — no palette, no per-component theme code, no `dark:` on the common path — so it
  works in light **and** dark via the token layer (0004).
- **The recipe (shared infra, lives here):** a `cn()` util (`clsx` + `tailwind-merge`, so a
  caller `className` always wins over defaults); `class-variance-authority` (cva) mapping
  `variant` × `size` to **full literal** token-utility strings (Tailwind v4's scanner needs
  literals); Radix primitives where behaviour/a11y warrant (`@radix-ui/react-slot` for `asChild`).
  Deps added to canopy: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`,
  `tailwind-merge` (React stays a peer). Input / Label / Badge (0006–0008) reuse this recipe.
- **Tailwind-source consumer seam (Decision A)** — canopy ships `className` strings, not a
  prebuilt stylesheet. The consumer runs Tailwind v4 + the roots preset and adds
  `@source '…/@rogueoak/canopy'` so the component utilities generate (and tree-shake) in their
  own build, and their `.dark` flips canopy too. Storybook is the **first consumer**: its global
  CSS adds `@source '../../../packages/canopy/src'` — without it Button renders unstyled. Documented
  in the README quick start.
- **Stories** — a `Seeds/Button` section: a controls Playground plus Variants, Sizes, States
  (default · hover · disabled), `asChild` (a styled `<a>`), and With-icon stories; every story
  reads correctly in both themes via the toolbar toggle (no per-story theme code).
- **Tests** — Vitest + Testing Library + `user-event`: renders children; default and chosen
  variant/size map to the expected token classes; the focus-ring + disabled token classes are
  present; `cn` merges a caller `className` over defaults; pointer click fires `onClick`; disabled
  blocks it; keyboard focus + Enter/Space activate; `asChild` renders the child element (anchor)
  carrying the button classes; ref forwards to the underlying button.

## Seeds: Input (0006)

The text-field **Seed** — the field primitive every form control and Twig (FormField,
SearchBar) builds on. Reuses the 0005 recipe verbatim; no new infra or deps.

- **Input** (`@rogueoak/canopy/seeds`) — a native `<input>` with sizes `sm` / `md` (default) /
  `lg` by height (`h-8` / `h-10` / `h-12`, `px-3`); the `border-border` / `bg-surface` / `text-text`
  token set with a `placeholder:text-text-muted` placeholder (AA-normal; `text-subtle` is AA-Large-only);
  the same focus-visible ring as Button; a `disabled` state on the `bg-disabled` / `text-disabled-foreground`
  pair (plus `cursor-not-allowed`).
  The **invalid** state is the native `aria-invalid` attribute, styled via Tailwind's `aria-invalid:`
  variant (`aria-invalid:border-danger aria-invalid:ring-danger`) — the accessible attribute and the
  danger styling stay in lockstep with no extra prop. `forwardRef<HTMLInputElement>` + full native
  `<input>` prop spread (`type` defaults to `'text'`). Semantic tokens only — light **and** dark via 0004.
- **API note** — `InputProps` omits the native numeric `size` attribute so the cva `size` variant owns
  the name (`Omit<React.InputHTMLAttributes, 'size'>`). Exports `Input`, `inputVariants`, `InputProps`.
- **Stories** — a `Seeds/Input` section: a controls Playground plus Default, WithPlaceholder, Focused
  (interactive), Invalid (`aria-invalid`), Disabled, and Sizes; both themes via the toolbar toggle.
- **Tests** — Vitest + Testing Library + `user-event`: renders a native input (`type` defaults to text);
  `user.type` updates the value; `onChange` fires per keystroke; `disabled` blocks input; `aria-invalid`
  applies the danger classes; each size maps to its height; `cn` merges a caller `className`; native props
  (`type` / `placeholder` / `name`) spread; ref forwards to the underlying input.

## Seeds: Label (0007)

The form-field label atom — the foundation of accessible forms, built on the 0005 recipe.

- **Label** (`@rogueoak/canopy/seeds`) — built on `@radix-ui/react-label`, so an `htmlFor`
  pointing at a control's `id` both associates the two for assistive tech and focuses that
  control on click. Styled with the semantic typography `label` role (`text-label font-medium
  text-text`) — no per-component theme code; light **and** dark via the token layer. `forwardRef`
  + full native `<label>` prop spread + `cn()` merge. Optional `required` prop renders a trailing
  danger-coloured `*` as `aria-hidden`, so the visual asterisk never pollutes the accessible name
  (signal the requirement via the field's own `required` / `aria-required`).
- **Recipe extension (shared infra):** `cn()`'s `tailwind-merge` is now extended to register the
  Roots typography roles (`text-display` / `h1…h4` / `body` / `body-sm` / `label` / `caption` /
  `code`) in the `font-size` group. Without this, tailwind-merge misclassifies a role like
  `text-label` as a colour and silently drops it when combined with a real colour (`text-text`).
  Label is the first Seed to pair a typography role with a colour. Dep added to canopy:
  `@radix-ui/react-label` (also added to tsup's `external`).
- **Stories** — a `Seeds/Label` section: standalone, required, and paired with a native `<input>`
  via `htmlFor` (canopy Input ships separately in 0006); both themes via the toolbar toggle.
- **Tests** — render, `htmlFor` association + click-to-focus, the `required` indicator keeps the
  control's accessible name clean, caller `className` override, ref forwarding.

## Seeds: Badge (0008)

The status/metadata label atom — the first component to exercise the semantic status roles
end-to-end, built on the 0005 recipe (no new deps; reuses Radix `Slot` for `asChild`).

- **Badge** (`@rogueoak/canopy/seeds`) — a presentational `<span>` pill (`rounded-full px-2.5
  py-0.5 text-xs font-medium`). Variants `neutral` (default) / `primary` / `success` / `warning` /
  `danger` / `info` map to the role fills + `-foreground` pairs; `neutral` carries a hairline
  `border border-border` so its subtle fill stays delineated on muted/hover surfaces. `asChild`
  (Radix `Slot`), `forwardRef<HTMLSpanElement>`, native span prop spread, `cn()` merge. Meaning
  comes from the text (colour alone is never the only signal). Semantic tokens only — both themes.
- **Stories** — a `Seeds/Badge` section: every variant plus an `asChild` link; both themes.
- **Tests** — default + each variant (`it.each`), the neutral-drop negative assertion, `asChild`
  renders the child with no wrapper span, ref forwarding.

Not yet built (later specs): the rest of the atom catalogue (0009+ — Checkbox, Switch, Textarea,
Select, Tooltip, Avatar, Separator, Spinner, Skeleton, Kbd), Twigs / Branches / Boughs, the native
Swift token target, and npm publish.
