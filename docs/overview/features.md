# Features

What the product does, feature by feature.

## Repo skeleton (0002)

The working end-to-end skeleton - every seam proven with throwaway sample values, no real
design tokens or components yet.

- **Monorepo & tasks** - pnpm workspace + Turborepo. `pnpm install`, `pnpm build`,
  `pnpm test`, `pnpm lint`, `pnpm storybook`, `pnpm changeset` all work from the root.
- **Token pipeline** - `@rogueoak/roots` compiles a DTCG token source via Style Dictionary
  into CSS variables (`tokens.css`), a typed TS export (`tokens.ts` → `tokens.js`/`.d.ts`),
  and a Tailwind v4 `@theme` preset (`tailwind-preset.css`). Seeded with one placeholder
  token, `color-sample` (`#4a7c59`).
- **Component package** - `@rogueoak/canopy` builds to ESM + types with tsup, exposing `.`
  and `./seeds`. A placeholder `Sprout` component imports `color-sample` from
  `@rogueoak/roots` and renders it, proving the cross-package + token seam. A Vitest smoke
  test asserts it mounts and shows the Roots-sourced value.
- **Storybook showcase** - Storybook 8 (React + Vite + Tailwind v4) with a
  `Foundations/Sample` swatch (token shown three ways: `bg-sample` utility,
  `var(--color-sample)`, typed export) and a `Seeds/Sprout` story. A light/dark toolbar
  toggle is wired (theme values empty until 0004). Builds to static for Pages.
- **CI & release** - GitHub Actions build/test/lint on PRs + main, and deploy Storybook to
  GitHub Pages on main. Changesets configured for `@rogueoak/*` (publish off for now).

## Roots foundations (0003)

The real two-tier design-token foundation - what every Canopy component styles against. Light
theme only; the dark remap + runtime switching are 0004.

- **Primitive ramps** (`color/primitive.json`) - eight `50…950` ramps: `moss` (brand),
  `bark`, `stone` (warm neutrals), `amber` (accent), and desaturated functional ramps
  `success` / `warning` / `danger` / `info`, plus `base.white`. Muted & natural, moss/olive
  brand. Never consumed directly by components.
- **Semantic tokens** (`color/semantic.json`) - light-theme roles that **reference** primitives
  (e.g. `color-primary` → `var(--color-moss-600)`): surfaces, text, lines, roles + foregrounds,
  and status + foregrounds. Components consume only these; the reference seam means 0004 remaps
  this layer alone. Functional roles use the `.DEFAULT` convention so `--color-success`
  (→ `bg-success`) coexists with the `--color-success-600` ramp step. `accent` is a **fill-only**
  role (amber.500, below AA on `bg`); **`accent-strong`** (amber.700, ~6.15:1) is the AA-passing
  accent for text/icon/border. A `ring-offset` role provides the focus-ring gap colour on
  coloured surfaces.
- **Typography primitives** (`typography.json`) - `font.sans` (Figtree) + `font.mono` (Geist Mono)
  family names; type scale `text-xs…6xl` (12→60px); weights, leading, tracking
  (`tighter`/`tight`/`normal`/`wide`).
- **Composite text roles** (`typography-roles.json`) - semantic roles `display`, `h1…h4`, `body`,
  `body-sm`, `label`, `caption`, `code` (mono), each composing **references** to the type
  primitives and emitted as Tailwind v4 `text-<role>` utilities with companion vars, so
  `text-h2` applies font-size + line-height + font-weight + letter-spacing in one class.
  Components style against these, not raw scale + weight + leading.
- **Spacing / radii / elevation / motion** - `space.0…32` (4px base); `radius.none…full`;
  `shadow.sm…xl` (soft, warm); `duration.fast/base/slow` + `ease.standard/emphasized/decelerate`.
- **Self-hosted fonts** - Figtree + Geist Mono via `@fontsource-variable/*`, imported in
  Storybook's global CSS. Roots ships only the family tokens; consumers install @fontsource.
- **Tailwind v4 utilities** - token names flatten onto `@theme` namespaces so utilities
  generate (`bg-*`, `text-lg`, `font-sans`, `rounded-md`, `shadow-md`); spacing utilities
  (`p-4` = 1rem) derive from a single `--spacing: 0.25rem` base.
- **Foundations stories** - Storybook `Foundations` section renders ramps + semantic swatches,
  the Figtree specimen + type scale + weights + leading, spacing, radii, elevation, motion, and
  a WCAG AA contrast table. The visual lock surface.
- **Contrast** - all primary text roles meet WCAG AA (≥ 4.5:1) on their intended surfaces;
  `text-subtle` (tertiary) meets AA-large (≥ 3:1), documented as for large/non-essential text.
  Guarded by an **executable contrast test** (`tokens.test.ts`) that resolves each role to its
  real primitive hex and computes the WCAG ratio, so a future ramp/remap can't silently break AA.

## Light & dark theming (0004)

Theming as a property of the **token layer** - toggle one class, the whole UI re-themes, no
per-component code.

- **Dark theme** (`color/semantic.dark.json`) - a dark remap of **every** semantic colour role
  (surfaces invert to `stone-950/900/800`, text lightens to `stone-50/300/400`, borders to
  `stone-700/600` - kept a step above `surface-raised` so they stay visible, `primary` → the
  lighter `moss-400`, secondary/accent/status retuned), authored as DTCG tokens that
  **reference** primitives (never flattened). Emitted as a `.dark { … }` block in `tokens.css`
  that overrides only the semantic runtime vars; primitives (shared ramps) are not repeated.
- **Theme factory** - non-default themes are produced by a `themeConfig(name, glob)` factory and
  a small `themes` data list, with an idempotent single-write build. Adding a future theme is one
  list entry + one `semantic.<name>.json` file - no new hand-written config, format, or build line.
- **Runtime switching** - class-based `.dark` on a root element. Because utilities and the typed
  export reference the runtime vars, toggling `.dark` re-resolves `bg-primary`, `text-default`, …
  automatically. The Tailwind preset and TS export are unchanged. A `@custom-variant dark` is
  added in consumer CSS for the rare explicit `dark:` utility; a documented one-line toggle (+ an
  optional `prefers-color-scheme` bootstrap) ships in the README.
- **Interaction-state tokens** - `color-<role>-hover`/`-active` for `primary`/`secondary` (+
  `accent-hover`, `danger-hover`) pointing at adjacent ramp steps, and a `color-disabled` surface
  + `color-disabled-foreground` convention. **Light and dark values defined together.**
- **Moss-green refinement** - the brand `moss` ramp re-tuned greener (less yellow); light primary
  `moss-600 #4c6634` and dark primary `moss-400 #80a85c` share one hue. Only `moss` changed.
- **AA in both themes** - the executable contrast test resolves role pairs for **light _and_
  dark** (reading the `.dark` block, chasing references to primitive hexes) and asserts AA in each,
  including the **interaction-state** surfaces (foreground on `*-hover`/`*-active` for
  primary/secondary/danger/accent); `disabled` is deliberately excluded (WCAG exempts disabled
  controls). Coverage guards assert every themed var has a `.dark` override that **differs** from
  light (no copy-paste, no silent fallthrough, no dark-only orphan), references a **primitive ramp**
  path, and that exactly one `.dark` block exists. Status fills `danger`/`info` use `.300` in dark,
  and `accent-hover` (light) / `secondary-active` (dark) were nudged so their near-black foreground
  reaches AA.
- **Storybook** - a **functional** Light/Dark toolbar toggle (flips `.dark` on `<html>`); all
  Foundations stories read correctly in both themes (semantic swatches read their hex live; the
  **Contrast** table computes ratios live per theme), plus a **Theme** demo card built only from
  semantic utilities that re-themes with the toggle.

## Seeds: Button + the component recipe (0005)

The first real **Seed** - and the shared **component recipe** every later atom follows. The
throwaway `Sprout` placeholder is removed.

- **Button** (`@rogueoak/canopy/seeds`) - variants `primary` (default) / `secondary` /
  `outline` / `ghost` / `destructive`; sizes `sm` / `md` (default) / `lg` / `icon`; hover +
  active via the 0004 interaction tokens; a `disabled` state using the `bg-disabled` /
  `text-disabled-foreground` token pair (not opacity); a focus-visible ring on the `ring` /
  `ring-offset` tokens; and `asChild` (Radix `Slot`) for polymorphism (e.g. a link styled as a
  button). `forwardRef` + full native `<button>` prop spread. Styled **only** with semantic-token
  utilities - no palette, no per-component theme code, no `dark:` on the common path - so it
  works in light **and** dark via the token layer (0004).
- **The recipe (shared infra, lives here):** a `cn()` util (`clsx` + `tailwind-merge`, so a
  caller `className` always wins over defaults); `class-variance-authority` (cva) mapping
  `variant` × `size` to **full literal** token-utility strings (Tailwind v4's scanner needs
  literals); Radix primitives where behaviour/a11y warrant (`@radix-ui/react-slot` for `asChild`).
  Deps added to canopy: `@radix-ui/react-slot`, `class-variance-authority`, `clsx`,
  `tailwind-merge` (React stays a peer). Input / Label / Badge (0006-0008) reuse this recipe.
- **Tailwind-source consumer seam (Decision A)** - canopy ships `className` strings, not a
  prebuilt stylesheet. The consumer runs Tailwind v4 + the roots preset and adds
  `@source '…/@rogueoak/canopy'` so the component utilities generate (and tree-shake) in their
  own build, and their `.dark` flips canopy too. Storybook is the **first consumer**: its global
  CSS adds `@source '../../../packages/canopy/src'` - without it Button renders unstyled. Documented
  in the README quick start.
- **Stories** - a `Seeds/Button` section: a controls Playground plus Variants, Sizes, States
  (default · hover · disabled), `asChild` (a styled `<a>`), and With-icon stories; every story
  reads correctly in both themes via the toolbar toggle (no per-story theme code).
- **Tests** - Vitest + Testing Library + `user-event`: renders children; default and chosen
  variant/size map to the expected token classes; the focus-ring + disabled token classes are
  present; `cn` merges a caller `className` over defaults; pointer click fires `onClick`; disabled
  blocks it; keyboard focus + Enter/Space activate; `asChild` renders the child element (anchor)
  carrying the button classes; ref forwards to the underlying button.

## Seeds: Input (0006)

The text-field **Seed** - the field primitive every form control and Twig (FormField,
SearchBar) builds on. Reuses the 0005 recipe verbatim; no new infra or deps.

- **Input** (`@rogueoak/canopy/seeds`) - a native `<input>` with sizes `sm` / `md` (default) /
  `lg` by height (`h-8` / `h-10` / `h-12`, `px-3`); the `border-border` / `bg-surface` / `text-text`
  token set with a `placeholder:text-text-muted` placeholder (AA-normal; `text-subtle` is AA-Large-only);
  the same focus-visible ring as Button; a `disabled` state on the `bg-disabled` / `text-disabled-foreground`
  pair (plus `cursor-not-allowed`).
  The **invalid** state is the native `aria-invalid` attribute, styled via Tailwind's `aria-invalid:`
  variant (`aria-invalid:border-danger aria-invalid:ring-danger`) - the accessible attribute and the
  danger styling stay in lockstep with no extra prop. `forwardRef<HTMLInputElement>` + full native
  `<input>` prop spread (`type` defaults to `'text'`). Semantic tokens only - light **and** dark via 0004.
- **API note** - `InputProps` omits the native numeric `size` attribute so the cva `size` variant owns
  the name (`Omit<React.InputHTMLAttributes, 'size'>`). Exports `Input`, `inputVariants`, `InputProps`.
- **Stories** - a `Seeds/Input` section: a controls Playground plus Default, WithPlaceholder, Focused
  (interactive), Invalid (`aria-invalid`), Disabled, and Sizes; both themes via the toolbar toggle.
- **Tests** - Vitest + Testing Library + `user-event`: renders a native input (`type` defaults to text);
  `user.type` updates the value; `onChange` fires per keystroke; `disabled` blocks input; `aria-invalid`
  applies the danger classes; each size maps to its height; `cn` merges a caller `className`; native props
  (`type` / `placeholder` / `name`) spread; ref forwards to the underlying input.

## Seeds: Label (0007)

The form-field label atom - the foundation of accessible forms, built on the 0005 recipe.

- **Label** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-label`, so an `htmlFor`
  pointing at a control's `id` both associates the two for assistive tech and focuses that
  control on click. Styled with the semantic typography `label` role (`text-label`, which carries
  its own medium weight) plus `text-text` - no per-component theme code; light **and** dark via the
  token layer. `forwardRef`
  + full native `<label>` prop spread + `cn()` merge. Optional `required` prop renders a trailing
  danger-coloured `*` as `aria-hidden`, so the visual asterisk never pollutes the accessible name
  (signal the requirement via the field's own `required` / `aria-required`).
- **Recipe extension (shared infra):** `cn()`'s `tailwind-merge` is now extended to register the
  Roots typography roles (`text-display` / `h1…h4` / `body` / `body-sm` / `label` / `caption` /
  `code`) in the `font-size` group. Without this, tailwind-merge misclassifies a role like
  `text-label` as a colour and silently drops it when combined with a real colour (`text-text`).
  Label is the first Seed to pair a typography role with a colour. Dep added to canopy:
  `@radix-ui/react-label` (also added to tsup's `external`).
- **Stories** - a `Seeds/Label` section: standalone, required, and paired with a native `<input>`
  via `htmlFor` (canopy Input ships separately in 0006); both themes via the toolbar toggle.
- **Tests** - render, `htmlFor` association + click-to-focus, the `required` indicator keeps the
  control's accessible name clean, caller `className` override, ref forwarding.

## Seeds: Badge (0008)

The status/metadata label atom - the first component to exercise the semantic status roles
end-to-end, built on the 0005 recipe (no new deps; reuses Radix `Slot` for `asChild`).

- **Badge** (`@rogueoak/canopy/seeds`) - a presentational `<span>` pill (`rounded-full px-2.5
  py-0.5 text-xs font-medium`). Variants `neutral` (default) / `primary` / `success` / `warning` /
  `danger` / `info` map to the role fills + `-foreground` pairs; `neutral` carries a hairline
  `border border-border` so its subtle fill stays delineated on muted/hover surfaces. `asChild`
  (Radix `Slot`), `forwardRef<HTMLSpanElement>`, native span prop spread, `cn()` merge. Meaning
  comes from the text (colour alone is never the only signal). Semantic tokens only - both themes.
- **Stories** - a `Seeds/Badge` section: every variant plus an `asChild` link; both themes.
- **Tests** - default + each variant (`it.each`), the neutral-drop negative assertion, `asChild`
  renders the child with no wrapper span, ref forwarding.

## Seeds: Checkbox (0009)

The boolean-field atom - the first toggle control, built on the 0005 recipe.

- **Checkbox** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-checkbox`, so it reports
  the correct `role="checkbox"` / `aria-checked` and supports `checked` / `unchecked` /
  `indeterminate` (pass `checked="indeterminate"`, controlled or via `defaultChecked`). An `h-5 w-5`
  rounded square with a `border-border-strong` outline over `bg-surface`; the `data-[state=checked]`
  **and** `data-[state=indeterminate]` variants swap to the `primary` / `primary-foreground` fill.
  Hand-rolled inline check + minus SVGs (no icon library) inherit `currentColor`, picked from the
  live `data-state` via `group-data-[state=…]`. Shared focus-visible ring on the `ring` /
  `ring-offset` pair. **Disabled dims with `disabled:opacity-50` + `cursor-not-allowed`** (not the
  `bg-disabled` pair) so the checked `primary` fill stays visible-but-muted. `forwardRef` + native
  prop spread + `cn()` merge; pairs with `Label` via `id` / `htmlFor`. Semantic tokens only - both
  themes automatically.

## Seeds: Switch (0010)

The on/off toggle atom - for instant settings (notifications, feature flags) where a checkbox's
"submit later" semantics don't fit. Built on the 0005 recipe.

- **Switch** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-switch`, so it ships
  `role="switch"` / `aria-checked` and the full controlled (`checked` + `onCheckedChange`) and
  uncontrolled (`defaultChecked`) APIs. A `h-6 w-11` pill track is `bg-border` when off and
  `data-[state=checked]:bg-primary` when on; the `bg-surface` thumb slides via a `transform`
  transition (`data-[state=checked]:translate-x-5`). The focus-visible ring lives on the Root so
  keyboard focus is always visible. **Disabled uses `disabled:opacity-50` + `cursor-not-allowed`**
  (the filled "on" track stays visible-but-muted). `forwardRef`, native prop spread, `cn()` merge;
  pairs with `Label`. Semantic tokens only - both themes automatically.

## Seeds: Radio Group (0011)

The single-choice selection atom - a group of mutually-exclusive options, built on the 0005 recipe.

- **RadioGroup / RadioGroupItem** (`@rogueoak/canopy/seeds`) - built on
  `@radix-ui/react-radio-group`. The root is a thin `grid gap-2` wrapper; Radix owns the selection
  state and the **roving keyboard model** (arrow keys move focus _and_ selection, Tab enters/leaves
  the group). Each item is a `h-5 w-5` circle with an idle `border-border-strong` ring over
  `bg-surface`; when selected the ring becomes `data-[state=checked]:border-primary` and the centred
  `Indicator` reveals a `bg-primary` dot. Shared focus-visible ring. **Disabled uses
  `disabled:opacity-50` + `cursor-not-allowed`** (per-item or inherited from a fully-disabled group),
  keeping the selected fill visible-but-muted. `forwardRef`, native prop spread, `cn()` merge.
  Semantic tokens only - both themes automatically.

## Seeds: Textarea (0012)

The multi-line text-field atom - the field primitive for longer free-text input, mirroring Input
(0006) for visual parity. Reuses the 0005 recipe; no new deps and **no Radix** (a native element).

- **Textarea** (`@rogueoak/canopy/seeds`) - a native `<textarea>` with Input's exact token base for
  the shared axes: `border-border` / `bg-surface` / `text-text`, a `placeholder:text-text-muted`
  placeholder (AA-normal; `text-subtle` is AA-Large-only), the shared focus-visible ring, the
  `disabled:bg-disabled` / `disabled:text-disabled-foreground` **token pair** (a field, so not
  opacity) + `cursor-not-allowed`, and the native `aria-invalid` styled via `aria-invalid:` danger
  overrides. Textarea-specific: vertical `py-2` (no fixed height), a `min-h-20` floor so an empty
  field reads as multi-line, and `resize-y` so a reader can drag it taller; otherwise height follows
  the native `rows` prop. Auto-grow is out of scope. `forwardRef<HTMLTextAreaElement>` + full native
  prop spread. Semantic tokens only - both themes automatically.
- **API note** - adds no bespoke props, so `TextareaProps` is an empty `interface … extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> {}` - an `interface` (not a `type` alias) because
  `react/prop-types` only resolves the spread members through `extends`; the resulting "empty
  interface" is intentional, with a line-scoped `eslint-disable` documenting why.

## Seeds: Select (0013)

The single-choice dropdown atom - and the **first portalled Seed** (a popover on a raised surface),
built on the 0005 recipe.

- **Select** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-select`, exposing the shadcn
  surface area: `Select` (stateful root, owns `value` / `onValueChange`), `SelectGroup` /
  `SelectLabel`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectSeparator`,
  and `SelectScrollUp`/`DownButton`. The **trigger** mirrors the Input field (`border-border` /
  `bg-surface` / `text-text`, the shared focus-visible ring, the `disabled:*` token pair, and
  `aria-invalid:` danger overrides) plus a chevron and a muted placeholder via
  `data-[placeholder]:text-text-muted`. The **content** is portalled through
  `SelectPrimitive.Portal` onto a `bg-surface-raised` card (`border` + the primitive `shadow-md`);
  because `.dark` lives on `<html>`, the portalled popover (mounted under `<body>`) still themes
  correctly. Each **item** carries a leading check `ItemIndicator`, and its keyboard/hover highlight
  uses the **`muted-raised`** raised-surface fill (feedback 0006) so it lifts in both themes rather
  than receding on the raised surface in dark. Single-select only (multi-select / combobox / async
  search are out of scope). `forwardRef` on every styled wrapper + native prop spread + `cn()` merge.
  Semantic tokens only - both themes automatically.

## Seeds: Tooltip (0014)

The hover/focus hint atom - and the **second portalled Seed** (after Select), a small text card on a
raised surface. Built on the 0005 recipe.

- **Tooltip** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-tooltip`, exposing
  `TooltipProvider` (shared `delayDuration` / `skipDelayDuration` config - wrap once high in the
  tree), `Tooltip` (the stateful root; **opens on hover _and_ keyboard focus**, closes on blur /
  escape), `TooltipTrigger` (use `asChild` to wrap a Button etc.), and `TooltipContent`. The
  **content** is portalled through `TooltipPrimitive.Portal` onto a `bg-surface-raised` card
  (`border` + the primitive `shadow-md`) with terse `text-xs`, capped at `max-w-xs` so a long hint
  wraps; `sideOffset` defaults to `4`. A matching `TooltipPrimitive.Arrow` (filled `fill-surface-raised`
  so it matches the card face in both themes) renders by default - pass `arrow={false}` to omit it.
  Because `.dark` lives on `<html>`, the portalled card (mounted under `<body>`) themes correctly.
  Short, non-interactive text only (Popover / HoverCard / rich content are later specs). `forwardRef`
  on the styled content + native prop spread + `cn()` merge. Semantic tokens only - both themes
  automatically.

## Seeds: Avatar (0015)

The identity atom - a user photo with a graceful initials fallback, built on the 0005 recipe.

- **Avatar** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-avatar`, composing `Avatar`
  (root), `AvatarImage`, and `AvatarFallback`. The root is **always a circle** (`rounded-full`;
  square / rounded shapes are out of scope) over a `bg-muted` surface that shows through while the
  image loads or if it is absent. A cva `size` variant (`sm` `h-8 w-8` / `md` (default) `h-10 w-10` /
  `lg` `h-12 w-12`) sizes the box **and** sets the font-size, so the fallback's **initials scale with
  the circle** (they inherit it: `text-xs` / `text-sm` / `text-base`). `AvatarImage` is revealed by
  Radix only once the image has actually loaded (`aspect-square object-cover` to fill the circle
  without distortion; always pass a meaningful `alt`), so the fallback shows through until then and
  stays if the image is missing or errors. `AvatarFallback` centres the initials on `bg-muted` with
  `text-muted-foreground`, and accepts `delayMs` to avoid a fallback flash when the image resolves
  quickly. `forwardRef` on each part + native prop spread + `cn()` merge. Semantic tokens only - both
  themes automatically.

## Seeds: Separator (0016)

The hairline-divider atom - a thin rule between content groups (menu sections, toolbar clusters),
built on the 0005 recipe.

- **Separator** (`@rogueoak/canopy/seeds`) - built on `@radix-ui/react-separator`, which handles the
  **decorative-vs-semantic ARIA distinction**: `decorative` (the default) renders no role, while
  `decorative={false}` exposes `role="separator"` with `aria-orientation` reflecting the
  `orientation` (`horizontal` default / `vertical`). The rule paints with the `border` token
  (`bg-border`); `data-[orientation=…]` utilities size it as a 1px-tall full-width line when
  horizontal and a 1px-wide full-height line when vertical. `forwardRef`, native prop spread, `cn()`
  merge. Semantic tokens only - both themes automatically.

## Seeds: Spinner (0017)

The busy-indicator atom - a spinning loader, built on the 0005 recipe; **no Radix** (pure CSS/SVG,
no dependency).

- **Spinner** (`@rogueoak/canopy/seeds`) - renders a `<span role="status">` whose accessible name
  comes from a **single source**: a visually-hidden (`sr-only`) text node holding the label (default
  `"Loading"`, overridable via the native `aria-label` prop) - _not_ also duplicated as an
  `aria-label` attribute, which would make some readers announce it twice. Inside sits an inline SVG
  (a faint circle track + a brighter arc) drawn with `currentColor`, so it **inherits the caller's
  text colour** (`<Spinner className="text-primary" />`); the SVG is `aria-hidden` so the status is
  announced once. A cva `size` variant (`sm` `h-4 w-4` / `md` (default) `h-5 w-5` / `lg` `h-6 w-6`).
  **Reduced motion:** the rotation is `animate-spin` gated with `motion-reduce:animate-none`, so users
  who prefer reduced motion see a static indicator. `forwardRef<HTMLSpanElement>` + native prop spread
  + `cn()` merge. Semantic tokens only - both themes automatically.

## Seeds: Skeleton (0018)

The loading-placeholder atom - a pulsing block that holds layout while content fetches, built on the
0005 recipe; **no Radix** (a native `<div>`).

- **Skeleton** (`@rogueoak/canopy/seeds`) - a `rounded-md` block that pulses while content loads.
  Fill is **`bg-muted-raised`, NOT `bg-muted`** (feedback 0006): in dark, base `muted` collapses to
  the same `stone.900` as `surface`, so a skeleton on a card/panel would be invisible; `muted-raised`
  steps off both the page canvas **and** a raised surface in either theme, so the placeholder is
  always visible. **Reduced motion:** `animate-pulse` is gated with `motion-reduce:animate-none`,
  leaving a static block. Decorative by default - `aria-hidden="true"` so assistive tech skips the
  placeholder (the surrounding loading _region_ announces busy-ness via `aria-busy`); because the
  spread follows the default, a caller can override it (`aria-hidden={false}`). Shape and size are not
  baked in - the caller drives them through `className` (`h-4 w-32` for a text line, `h-10 w-10
  rounded-full` for an avatar), which `cn()` merges over the base. `forwardRef<HTMLDivElement>` +
  native prop spread. Semantic tokens only - both themes automatically.

## Seeds: Keyboard (0019)

The keyboard-key atom - a small key-cap for help text, command menus, and tooltips, built on the
0005 recipe; **no Radix** (renders a semantic `<kbd>`).

- **Keyboard** (`@rogueoak/canopy/seeds`) - renders the semantic **`<kbd>`** element with a subtle
  key-cap look: a hairline `border` outline around a `bg-muted` fill with `text-muted-foreground`
  text in a `font-mono` face and a small radius; `align-middle` keeps the cap vertically centred
  against surrounding copy when used inline. A cva `size` variant (`sm` for dense help text / `md`
  (default) for inline hints and command menus) scales the cap box. **Display-only** - it carries no
  key-binding logic (capturing or registering presses is out of scope); for a combo, compose multiple
  `Keyboard` with a separator, e.g. `<Keyboard>⌘</Keyboard> + <Keyboard>K</Keyboard>`.
  `forwardRef<HTMLElement>` + native prop spread + `cn()` merge. Semantic tokens only - both themes
  automatically.

The **Seeds layer is COMPLETE (15 atoms)** - Batch 1 (0005-0013: Button, Input, Label, Badge,
Checkbox, Switch, Radio Group, Textarea, Select) plus Batch 2 (0014-0019: Tooltip, Avatar, Separator,
Spinner, Skeleton, Keyboard). Two of them are **portalled** on `surface-raised` (Select + Tooltip),
the pattern that drove the `muted-raised` raised-surface token.

## Twigs (molecules)

The first **composition** layer - Twigs compose Seeds into small patterns, shipped on a new
`@rogueoak/canopy/twigs` subpath. They add **no new token** (a Twig is themed by the Seeds it
composes) and follow the compound-component + context recipe established by FormField.

## Twigs: FormField (0020)

The canonical form molecule - and the **Twigs recipe reference** (compound component + React context
+ Radix `Slot`).

- **FormField** (`@rogueoak/canopy/twigs`) - a form-library-agnostic compound: `FormField` (root) +
  `FormFieldLabel` / `FormFieldControl` / `FormFieldDescription` / `FormFieldMessage`. The root
  generates a `useId` base, derives `${id}-description` / `${id}-message`, and shares them plus
  `invalid` / `disabled` through a `FormFieldContext`. `FormFieldControl` is a Radix `Slot` that wires
  `id` / `aria-describedby` / `aria-invalid` / `disabled` onto **any** control Seed (Input, Textarea,
  Select trigger, Checkbox) without that Seed knowing about FormField. `aria-describedby` lists only
  the parts actually rendered - Description / Message register their presence via a mount/unmount
  effect, so an absent part contributes no id and an empty `FormFieldMessage` renders nothing; a
  non-empty message (role `alert`) also makes the control invalid. It owns the **disabled-label
  affordance** the Label Seed (0007) explicitly deferred to "a FormField Twig" (the label dims with
  its field). Semantic tokens only - both themes automatically.

## Twigs: SearchBar (0021)

The search-input molecule - composes **Input + Button + Keyboard** into one accessible control.

- **SearchBar** (`@rogueoak/canopy/twigs`) - an Input inside a `<form role="search">` with a leading
  magnifier, a ghost icon **clear** Button that appears only with a value (clears it, fires
  `onValueChange('')`, and refocuses the input) and hides when empty / disabled, an `onSearch` fired
  on Enter / submit, and an optional **display-only** `shortcutHint` rendered as a `Keyboard` (hidden
  while there is a value - it binds no key). Mirrors the native controlled / uncontrolled contract
  (`value` + `onValueChange`, or `defaultValue`); `ref` forwards to the inner `<input>` via
  `useImperativeHandle` so the clear handler focuses the caller's node. The browser's native
  `type="search"` clear is suppressed (`[&::-webkit-search-cancel-button]:appearance-none`) so it does
  not double the custom one. Composition only - no new token. Semantic tokens only - both themes
  automatically.

## Twigs: Card (0022)

The surface container molecule - a presentational compound on the raised-surface pattern.

- **Card** (`@rogueoak/canopy/twigs`) - `Card` + `CardHeader` / `CardTitle` / `CardDescription` /
  `CardContent` / `CardFooter`. A bordered, rounded, `shadow-sm` raised surface (`bg-surface-raised`
  + `border-border`, the lift pattern from the portalled Seeds - no semantic elevation token yet) with
  a consistent `p-6` inset (content / footer drop their top padding to sit flush under the region
  above). `CardTitle` renders a real `<h3>` by default carrying the `text-h3` role, and takes
  `asChild` (Radix `Slot`) so that visual role rides onto a caller-chosen heading element and the
  document outline stays the caller's to control. `CardDescription` is muted `text-body-sm`; the slots
  compose arbitrary children including other Twigs (a Card framing a FormField + Button). `forwardRef`
  + native prop spread + `cn()` merge on every part. Semantic tokens only - both themes automatically.

The **Twigs layer's first three molecules are live**.

## Branches (organisms)

The **composition** layer above Twigs - Branches assemble **Seeds _and_ Twigs** into self-contained
pieces of UI that own interaction state and (often) a portal. They ship on a new
`@rogueoak/canopy/branches` subpath, parallel to `./seeds` and `./twigs`, and import the lower
layers one-way (branches import twigs/seeds, never the reverse).

## Branches: Dialog (0024)

The first Branch - and the **Branches recipe reference**: a stateful, portalled compound built on
Radix that composes lower layers and adds no new token.

- **Dialog** (`@rogueoak/canopy/branches`) - `Dialog` (root) + `DialogTrigger` / `DialogClose`
  (re-exported primitives) + `DialogContent` / `DialogHeader` / `DialogFooter` /
  `DialogTitle` / `DialogDescription`. (The overlay is **module-internal** - `DialogContent` owns the
  scrim, so a public standalone overlay isn't exported.) Built on **`@radix-ui/react-dialog`**, so Radix owns the
  open/close state machine, the focus trap, return-focus, scroll lock, and `Esc`-to-close. A
  centred modal: the scrim is the **pre-provisioned** `color-overlay` token at reduced opacity
  (`bg-overlay/80`, authored in 0004 "used at reduced opacity behind modals" - so the first Branch
  adds **no new token**); the portalled content card reuses the raised-surface pattern
  (`bg-surface-raised` + `border border-border` + `rounded-lg` + the primitive `shadow-lg`, `p-6`),
  the third portalled surface after Select (0013) and Tooltip (0014). It ships a built-in `X` close
  affordance (inline `currentColor` SVG, `aria-label="Close"`, `muted-raised` hover, the shared
  focus-visible ring). `DialogTitle` is the `text-h3` `aria-labelledby`; `DialogDescription` is
  muted `text-body-sm` `aria-describedby`; `role="dialog"` + an explicit `aria-modal="true"` (Radix
  marks modality by `aria-hidden`-ing siblings, so we add the APG attribute directly). Enter/exit
  fade + zoom is gated with `motion-reduce:animate-none`; the `animate-dialog-*` keyframes + utilities
  **ship from the Roots preset** (`tailwind-preset.css`, composing the `--duration-*`/`--ease-*`
  tokens) every consumer already imports, so the motion works out of the box. `forwardRef` + native prop spread + `cn()`
  merge on every styled part; semantic tokens only, both themes automatically; NO `dark:` on the
  common path. Stories prove composition: a FormField Twig in the body, Button Seeds for
  trigger/footer, a destructive confirmation, and a controlled example.

## Branches: TopNav (0025)

The second Branch - and the first **non-portalled, stateful** Branch: a responsive top navigation
bar whose disclosure is **hand-rolled** (no Radix primitive, no new dependency, no new token).

- **TopNav** (`@rogueoak/canopy/branches`) - a slot-based compound: `TopNav` (root) + `TopNavBrand`
  / `TopNavLinks` / `TopNavLink` / `TopNavActions` / `TopNavMenuButton`. Rendered as a `<header>`
  wrapping a `<nav aria-label>` (default `"Main"`, overridable) landmark; the bar is `h-14`,
  `border-b border-border`, `bg-surface`, a horizontal flex layout (brand · links · actions). The
  root owns the responsive open/close state in a small `TopNavContext` (`open` / `setOpen` /
  `close` / a `useId` `panelId` / the menu button's ref) and the dismissal effect.
- **Responsive collapse** - `TopNavLinks` is ONE element that is an inline row on `md+` and a mobile
  disclosure panel anchored below the bar (`absolute … top-14`) when `open`; it carries
  `id={panelId}`. `TopNavMenuButton` is the ☰ toggle, **only visible below the breakpoint**
  (`md:hidden`), composing the Button Seed (`variant="ghost" size="icon"`) with
  `aria-expanded={open}` + `aria-controls={panelId}` and a hamburger / X SVG that swaps with state.
  The responsive `md:hidden` / `md:flex` classes are full literals so Tailwind's scanner emits them.
- **Dismissal + focus** - while open, a document `pointerdown` outside the header closes the panel,
  and `Escape` closes it **and returns focus to the menu button** (mirroring Dialog's
  return-to-trigger, without the modal weight); clicking a `TopNavLink` also closes it, so a mobile
  tap navigates and dismisses.
- **Active state** - `TopNavLink active` sets `aria-current="page"` AND the active styling
  (`font-medium text-text`) in lockstep, while an idle link stays muted (`text-text-muted
  hover:text-text`); the consumer drives `active` from their router so Canopy stays router-agnostic.
  `TopNavBrand` and `TopNavLink` support `asChild` (Radix `Slot`) to wrap the consumer's `<a>` /
  router `<Link>`. `TopNavActions` is the `ml-auto` right cluster for Buttons / Avatar / SearchBar.
  `forwardRef` + native prop spread + `cn()` merge on every styled part; semantic tokens only, both
  themes automatically; NO `dark:`. Stories prove composition: brand + links + an actions cluster
  (a Button and an Avatar), an active link, and the responsive collapse in a constrained container.

## Branches: SideNav (0026)

The vertical side-navigation Branch - a collapsible, responsive app-shell rail, companion to TopNav.

- **SideNav** (`@rogueoak/canopy/branches`) - a slot-based compound: `SideNav` (root) +
  `SideNavHeader` / `SideNavFooter` (optional slots) + `SideNavSection` (a `role="group"` with an
  optional `label` heading that hides when collapsed) + `SideNavItem` (a nav link) +
  `SideNavTrigger` (the mobile menu button) + `SideNavCollapseToggle` (flips collapse). Rendered as
  an `<aside>`/`<nav aria-label>` landmark; the root owns the `collapsed` + mobile-`open` state in a
  `SideNavContext` and wraps a `TooltipProvider` so collapsed-item tooltips work with no consumer
  setup. **Responsive in two axes:** a controlled/uncontrolled `collapsed` (`defaultCollapsed` +
  `onCollapsedChange`) shrinks the desktop rail from `w-60` to a `w-16` icon column - section + item
  labels become `sr-only` (the link keeps its accessible name) and each item surfaces its label via
  a **Tooltip** Seed on hover/focus; below `768px` (a `useIsMobile()` matchMedia hook) the rail
  becomes an **off-canvas drawer** built directly on the **`@radix-ui/react-dialog` primitive** (the
  spec's "reuse Dialog's pattern, don't re-invent modal mechanics" - the Radix primitive, NOT
  canopy's centred Dialog component): a `bg-overlay/80` scrim (fading with the shared dialog overlay
  motion) + a left-anchored full-height panel with an sr-only `Title`, with Radix owning the focus
  trap, scroll lock, `Esc`/outside-click dismiss; SideNav captures the opener on `onOpenAutoFocus`
  and returns focus to it on close. The drawer is a true **raised, animated surface**: it is elevated
  (`bg-surface-raised` + `shadow-lg` + `border-r`, vs the in-flow desktop rail on plain `bg-surface`),
  it **slides in/out** (`animate-drawer-in`/`-out`, shipped from the Roots preset, gated with
  `motion-reduce:animate-none`), and it carries a **visible `X` close button** (`DialogPrimitive.Close`,
  `aria-label="Close navigation"`) mirroring Dialog's close affordance; drawer items are ≥44px
  (`min-h-11`) touch targets. `SideNavItem active` sets both `aria-current="page"` and the active fill
  (`bg-muted text-text`; a **collapsed** active item brand-colours its icon `text-primary` so an
  icon-only active item is distinct from a hovered idle one), driven by the consumer's router;
  `asChild` styles a router `<Link>`; an item click closes the drawer (a no-op on desktop, and skipped
  when the caller `preventDefault()`s). `useIsMobile` renders the nav content **once** (single
  landmark, no duplicated `aria-current`); a **`mobile?` prop** overrides the detection for SSR/
  first-paint correctness (avoids the desktop-rail flash). The `ref`/`className`/native props always
  land on the **rail panel** (the `<aside>` on desktop, the drawer `div` on mobile), and an exported
  **`useSideNavCollapsed()`** hook (`{ collapsed, mobile }`) lets an `asChild` item adapt to the
  collapsed icon-rail. The `SideNavTrigger` is intentionally **decoupled** (it lives in the app bar, a
  sibling of SideNav, so it can't share context): the consumer wires its `onClick` to open and
  passes `aria-expanded`/`aria-controls`. Composition only - **no new token, no `dark:`** (semantic
  tokens flip via the layer; the portalled drawer themes correctly because `.dark` lives on
  `<html>`). Stories: expanded grouped rail with an active item, the collapsed icon-rail (Tooltip
  labels), and the mobile drawer (defaults to a mobile viewport).

## npm publishing (0023)

Releases now **publish to npm**, driven by git tags - a tag _is_ the release.

- **Tag-driven, lockstep** - pushing a **bare-SemVer tag** (`X.Y.Z`, no `v` prefix) publishes
  **both** `@rogueoak/roots` and `@rogueoak/canopy` to the public registry at that version, in
  dependency order (roots before canopy). The tag is the single source of truth; repo versions
  stay at a `0.0.0` placeholder, so there are no version-bump PRs and no changesets (the
  Changesets tooling - `.changeset/`, the `@changesets/cli` devDep, the root `changeset` script
 - is removed). To cut a release: `git tag 0.1.0 && git push origin 0.1.0`.
- **Release workflow** (`.github/workflows/release.yml`) - triggers on the tag push, sets up
  pnpm + Node 24, validates the tag is SemVer, stamps both packages from the tag, runs a clean
  `pnpm build`, and `pnpm -r publish`es via **npm trusted publishing (OIDC)** - no `NPM_TOKEN`
  secret; the job grants `id-token: write` and npm verifies the run against each package's
  trusted-publisher config. pnpm rewrites canopy's `workspace:*` dep on roots to the real
  version and skips the private Storybook app.
- **Publishable packages** - both packages carry `publishConfig.access: public`, `repository`
  (+`directory`), `homepage`, `bugs`, a `prepublishOnly: pnpm build` clean-build guard (so a
  stale `dist` can never ship), and a focused `README.md` rendered on their npm page.
- **Developer-performed prerequisites** (not automated) - ensuring the `@rogueoak` npm org
  exists with the publishing identity as a member, and configuring the trusted publisher
  (repo + `release.yml`) on each package at `npmjs.com/package/<pkg>/access`.

Not yet built: more **Branches** (the layer is open - Dialog · TopNav · SideNav are live; DataTable
to come) and more Twigs as needed, then **Boughs** (templates), and the native Swift token target.
