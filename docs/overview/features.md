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
  `shadow.sm…xl` (soft, warm); `duration.micro/fast/base/slow/slower` +
  `ease.standard/emphasized/decelerate/spring/spring-strong`. The Roots preset also ships
  token-composed `animate-*` presets - `pop-in/out` (spring), `shake` (error states),
  `fade-in/out` - alongside the overlay/drawer/bottom-sheet motion (spec 0033).
- **Self-hosted fonts** - Figtree + Geist Mono via `@fontsource-variable/*`, imported in
  Storybook's global CSS. Roots ships only the family tokens; consumers install @fontsource.
- **Tailwind v4 utilities** - token names flatten onto `@theme` namespaces so utilities
  generate (`bg-*`, `text-lg`, `font-sans`, `rounded-md`, `shadow-md`); spacing utilities
  (`p-4` = 1rem) derive from a single `--spacing: 0.25rem` base.
- **Foundations stories** - Storybook `Foundations` section renders ramps + semantic swatches,
  the Figtree specimen + type scale + weights + leading, spacing, radii, elevation, motion, and
  a WCAG AA contrast table. The visual lock surface. **Motion** documents the durations and
  easings tables (literal values from `tokens`, with replayable bars and overshooting spring
  tracks) plus interactive pop / shake / fade preset players that run the real `animate-*`
  utilities and show each preset's token composition; `shake` is gated `motion-reduce:animate-none`.
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

## Seeds: Progress (0037)

The determinate progress-bar atom - a filled bar showing _how far along_ a bounded task is (an
upload, a checkout stepper, a storage meter), built on the 0005 recipe on **`@radix-ui/react-progress`**.
It is the **determinate sibling to Spinner** (0017): a spinner answers "is it busy?" with
`role="status"` and no value, whereas Progress answers "how much is done?" with `role="progressbar"`
carrying `aria-valuenow` / `aria-valuemin` / `aria-valuemax`.

- **Progress** (`@rogueoak/canopy/seeds`) - a `bg-muted`, `rounded-full` track whose `bg-primary`
  indicator fills proportionally. **Determinate:** pass a `value` (0-100) and Radix emits
  `role="progressbar"` with `aria-valuenow` / `aria-valuemin="0"` / `aria-valuemax="100"`; the
  indicator is translated by `translateX(-(100 - value)%)` (an inline per-instance style value, not a
  Tailwind class, so it is safe from the scanner) with a `transition-transform`. **Indeterminate:**
  omit `value` (pass `null` / `undefined`) and Radix drops `aria-valuenow`; the indicator pulses via
  `animate-pulse` gated with `motion-reduce:animate-none`, so reduced-motion users see a static bar. A
  cva `size` variant sets the track height (`sm` `h-1.5` / `md` (default) `h-2.5`).
  `forwardRef` to the Root + native prop spread + `cn()` merge (caller `className` wins). Semantic
  tokens only - both themes automatically. v1 fixes the 0-100 range; buffered/secondary progress, a
  circular ring, a labelled Twig, and an arbitrary `max` are additive follow-ups.

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

## Twigs: Breadcrumb (0029)

The trail-of-ancestors navigation molecule - a **stateless, presentational** compound (the second
structural Twig after Card) that shows where the current page sits in a hierarchy.

- **Breadcrumb** (`@rogueoak/canopy/twigs`) - `Breadcrumb` (root) + `BreadcrumbList` /
  `BreadcrumbItem` / `BreadcrumbLink` / `BreadcrumbPage` / `BreadcrumbSeparator` /
  `BreadcrumbEllipsis`. The root is a `<nav aria-label="breadcrumb">` (label overridable) wrapping
  an `<ol>` of `<li>` crumbs, so the sequence is conveyed and the landmark is discoverable.
  `BreadcrumbLink` is a muted ancestor link (`text-text-muted` → `hover:text-text`, shared focus
  ring) rendering `<a>` or, via **`asChild`** (Radix `Slot`), the consumer's router `<Link>` -
  router-agnostic, the `TopNavLink` pattern. `BreadcrumbPage` marks the current location with
  **`aria-current="page"`** and is non-interactive (`role="link"` + `aria-disabled`, un-muted
  `text-text`), presenting as a disabled link beside its siblings. `BreadcrumbSeparator` and
  `BreadcrumbEllipsis` are **decorative** (`role="presentation"` + `aria-hidden`) so a screen reader
  announces the crumbs with no separator noise; the separator's default chevron is a hand-rolled
  inline `currentColor` SVG (no icon dependency, the Dialog-close precedent) and is overridable via
  `children`. The `BreadcrumbEllipsis` is **meaningful, not decorative**: only its dots glyph is
  `aria-hidden`, while an `sr-only` "More" label stays in the accessibility tree so a mid-trail
  truncation (the consumer places it - Breadcrumb does not auto-collapse) is announced, not dropped. `forwardRef` + native prop spread + `cn()`
  merge on every part; **no new token, no new dependency, no `dark:`** - both themes automatically.

The **Twigs layer's first four molecules are live**.

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

## Branches: Combobox (0030)

A **filterable select** - the type-to-filter, multi-pick field that `Select` (single-choice,
non-filterable) deliberately isn't. A Branch, not a Seed: it owns interaction state
(open/search/selection), portals its list, and composes the `Badge` Seed for its chips (the tier
question that review corrected - see learnings).

- **Combobox** (`@rogueoak/canopy/branches`) - one stateful root with a **`multiple`** prop that
  discriminates the value shape (single `string` vs `string[]`) and the field rendering. Takes an
  `options` list (`{ label, value, disabled? }[]`), `value`/`onValueChange`, `defaultValue`
  (controlled or uncontrolled), `placeholder`/`searchPlaceholder`/`emptyMessage`, `disabled`, and
  `aria-invalid`. The public surface is intentionally small - the root + `ComboboxOption` + the
  prop-type unions; the internal parts are not exported.
- **Single-select** reads like Select (pick commits and closes) with a type-to-filter input at the
  top of the popover. **Multi-select** renders the picks as removable `Badge` chips in the field,
  keeps the popover open across picks, toggles an option off when re-picked, and drops the last
  chip on `Backspace` in the empty search input (each chip's remove control is a real labelled
  button, not a nested one). Client-side filtering over the provided options (async is a follow-up).
- Built on **`@radix-ui/react-popover`** (the portalled, collision-aware shell) + **`cmdk`** (the
  filterable listbox, keyboard nav, and no-results slot) on the Branch recipe - semantic tokens,
  `cn()`, full-literal classes, no `dark:` on the common path; the field mirrors `SelectTrigger`
  /`Input` token-for-token for parity. Roles come from cmdk (`combobox`/`listbox`/`option`), Radix
  manages `aria-expanded`, and the list carries `aria-multiselectable` in multiple mode. Stories:
  single, multi-with-badges, disabled + invalid (both modes), long list, and empty state.

## Branches: SubscribeForm (0035)

An email-capture Branch - a themed subscribe box - and the first **transport-agnostic by
injection** component: Canopy owns the UI/state/a11y, the consumer injects the network + analytics.
Consolidates two near-identical app copies (matthewmaynes + rogueoak) into one shipped component.

- **SubscribeForm** (`@rogueoak/canopy/branches`) - a `<section>` with a box heading (optional), an
  email `Input` (required) and an **optional Name** `Input` that stays collapsed until the email is
  focused then animates open (horizontal grow at `sm+`, vertical below, `motion-reduce`-safe, out of
  the tab order + a11y tree while collapsed; `alwaysShowName` starts it revealed). It owns a
  `Status` state machine (`idle | submitting | success | error`): on submit it collects
  `{ email, name, company }` (the last is the honeypot), calls `onSubscribe(values)`, and reflects
  the result - a resolve renders a success `Card` (a confirmation badge with an inline
  `currentColor` check SVG + a copy slot), a reject renders an inline `role="alert"` with the
  rejected error's `.message`. Composes the `Card` / `FormField` Twigs and `Button` / `Input` Seeds.
- **Injected transport + analytics.** `onSubscribe(values) => Promise<void>` (required) does the
  network I/O - Canopy has no `fetch`, no endpoint, no PostHog. An optional `onEvent(phase, props)`
  reports analytics phases (`submitted` before the call, then `succeeded` / `failed`), each with
  `{ source, has_name }` (PII-free - a boolean, never the name) and, on failure, a `reason` read
  from the rejected error's `.reason`. So a consumer keeps its own event names, gating, and the
  `http_4xx` / `network` fidelity it had when it owned the fetch, while Canopy stays coupling-free.
- **Copy as props.** `title` / `description` (heading), `successBadge` / `successMessage`,
  `submitLabel` / `submittingLabel` - all defaulted - let each app reproduce its exact wording. The
  inputs inherit the `Input` Seed's iOS anti-zoom `text-base md:text-sm` (16px mobile, feedback
  0017), so SubscribeForm adds no per-field font override. **Icon-free** (hand-rolled check
  SVG, no `@rogueoak/icons` dependency); semantic tokens only, both themes automatically. Stories:
  playground (resolving submit), always-show-name, no-heading, and an error state.

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

## Icons (0027)

A curated icon set ships as its own package, **`@rogueoak/icons`**.

- **Curated, semantic re-exports** - a set of ~60 icons re-exported from
  [`react-icons`](https://react-icons.github.io/react-icons/) under Canopy-semantic names
  (`Home`, `Search`, `Settings`, ..., plus documents/content (`File`, `FileText`, `Newspaper`,
  `Briefcase`, `Tag`), time/place (`Clock`, `MapPin`, `Globe`), and web/dev (`Code`, `Link`, `Rss`,
  `MessageSquare`)), so the `react-icons` family prefixes (`Lu*`/`Fa*`) never leak. Standard glyphs are **Lucide** (`react-icons/lu`); the seven social marks (`Github`,
  `Linkedin`, `X`, `Facebook`, `Instagram`, `Threads`, `Medium`) are **Font Awesome 6 brands** (`react-icons/fa6`),
  because Simple Icons no longer ships LinkedIn. The dismiss glyph is named `Close` so `X` is free
  for the X (Twitter) brand. The set is data-driven from `src/icons.ts`; `iconRegistry` / `iconNames`
  expose it as data, and an exported-names test guards that exports, registry, and catalog can't drift.
- **Tree-shakeable** - each icon is an individual named export; importing one never pulls the rest.
- **Size + a11y wrapper** - `Icon` renders a glyph at the default `1em` / `currentColor` and gives it
  the right semantics (decorative `aria-hidden` by default; a labelled `role="img"` when given a
  `title`, which react-icons does not do on its own). `IconProvider` sets size/color/className defaults
  for a subtree. Icons depend on **neither Roots nor Tailwind** - they colour via `currentColor`, so
  they theme through inherited text colour.
- **Storybook catalog** - an `Icons/Catalog` section renders every icon with its name (a live filter,
  social + standard groups) plus sizing and wrapper/a11y stories, driven by the same `iconRegistry`.
- **Published, lockstep** - `@rogueoak/icons` joins the tag-driven release (the `packages/*` glob picks
  it up automatically), so a release now publishes **three** packages at the tag version. Same
  developer-performed npm bootstrap as roots/canopy (manual first publish + trusted-publisher config).

## Brand theming API (0028)

A consumer-facing way to ship your OWN brand on top of Canopy - custom primitive ramps plus
Canopy's same semantic role names - re-theming every component in light AND dark, AA-verified,
**without forking `@rogueoak/roots`**. The seam `project.md` always promised ("future brands are a
token concern") is now a real, tested pipeline.

- **`buildBrand()`** (`@rogueoak/roots/brand`) + a **`roots-brand` CLI** (a package `bin`) - take a
  brand's DTCG token files (new ramps + light/dark semantic mappings using Canopy's role names) and
  emit a single `brand.css`: a `:root { }` block (brand primitives + light roles) and a `.dark { }`
  block (dark roles), all reference-aware. Imported after `tokens.css`, it overrides Canopy's roles
  by cascade - zero component changes, because components consume only semantic roles. A `scope`
  option emits `.<brand>` / `.<brand>.dark` to scope a brand to a subtree instead of the document.
- **Same guard, one definition** - the WCAG AA math + the canonical role-pair list are extracted to
  `packages/roots/contrast.mjs`; the core `tokens.test.ts` and the brand pipeline both import it.
  `buildBrand()` **fails the build** (throws) if any role/state pair breaks AA in either theme, or
  if a dark override is a flat hex instead of a primitive reference (the last reuses the core theme
  format's existing hard-error). A brand may map **any subset** of roles; each omitted role inherits
  Canopy's default by cascade, and its AA is checked as the EFFECTIVE pair (a brand override against
  the default it inherits), so a partial brand still can't ship an illegible combination (feedback
  0011). The role list + each role's default hex are read from Canopy's OWN shipped
  `dist/tokens.css`, so they never drift.
- **Reuses the core pipeline** - the light block uses the same `css/variables-with-roles` format and
  the dark block the same theme-overrides format Canopy's `.dark` uses (now generalized with a
  `selector` parameter; Canopy's own build is byte-for-byte unchanged). `style-dictionary` is an
  OPTIONAL peer dependency - needed only to run the brand pipeline, not for the token exports.
- **Example brand `sunset`** (`packages/roots/examples/sunset/`) - its own ramp names
  (`ember`/`orchid`/`blossom`/`dune` + status ramps), light + dark mappings, and a `brand.config.json`.
  Ships in the package `files` as a copyable starting point and the test fixture; a test builds it and
  asserts full role coverage + AA in both themes, plus that a broken brand fails and that a PARTIAL
  brand (roles omitted) builds and inherits Canopy's defaults.
- **Runtime path** documented too - an app can redefine `--color-*` in its own `:root`/`.dark` for
  quick cases that do not need the build-time guard.

## iOS / Swift token export + thoughtstream brand (0032)

A native SwiftUI app consumes Canopy tokens with no re-authoring - the Swift target the architecture
always anticipated ("just another Style Dictionary platform - no token rewrite").

- **`roots-swift` / `buildSwift()`** (`packages/roots/swift.mjs`, `@rogueoak/roots/swift`, bin
  `roots-swift`) generates one `Tokens.swift` for a brand from the SAME config `roots-brand` reads.
  It reuses the core transforms: two throwaway Style Dictionary instances resolve the brand's light
  and dark semantics to concrete hex (`outputReferences: false`), and one more resolves Canopy's own
  spacing / radius / type scale.
- **`Tokens.swift` shape** - three caseless enums (a Swift namespace that can't be instantiated):
  `CanopyColor` (every semantic role as a `Color(light:dark:)` that adapts to the color scheme via a
  generated dynamic-`UIColor` initializer), `CanopySpacing` / `CanopyRadius` (`CGFloat` points), and
  `CanopyFont` (type sizes as points + `Font` helpers, line-height multipliers). rem converts to
  points at 16pt/rem; a raw px pill (`radius.full`) is kept as-is. Spacing/radius/type come from
  Canopy core (shared across brands); only colours are brand-specific. Generated on demand (not part
  of the web `pnpm build`), landing at `dist/<brand>/Tokens.swift`.
- **thoughtstream brand (River Mist)** (`packages/roots/examples/thoughtstream/`) - the first REAL
  brand (vs the sunset demo): a calm slate-teal water palette (`slate` primary, `current` secondary,
  `tide` accent, `mist` neutral, plus cool-tuned status ramps), mapping every Canopy role in light +
  dark. Builds AA-clean through `buildBrand()` and feeds the Swift export. Tests assert the brand
  builds AA-clean and the emitter's structure (header, a role's light+dark hex, spacing/radius/font
  constants, valid Swift).

## 1.0.0 component build-out (0037-0069)

The build-out that closes the shadcn coverage gap and makes the component library
**feature-complete** for 1.0.0: **30 net-new components** across the three tiers (plus 3
API-preserving refactors, below), each on the established recipe - semantic tokens only, `cn()`,
full-literal classes, `forwardRef` + native spread, no `dark:` on the common path. Behavioural
cores come from Radix where it has a primitive, and from a small, sanctioned set of non-Radix
libraries where it does not (cmdk, vaul, embla, recharts, TanStack Table, react-day-picker,
input-otp). Where a component needed keyframed motion, the keyframes ship from the Roots preset
(the accordion and drawer motion joined the dialog/bottom-sheet keyframes there).

### Seeds added (0037-0039) - the layer now covers 18 atoms

- **Progress** (0037) - a determinate progress bar for bounded, measurable tasks, on
  `@radix-ui/react-progress` (the determinate sibling to Spinner).
- **Slider** (0038) - a single-value or range numeric input with full keyboard support, on
  `@radix-ui/react-slider`.
- **Toggle** (0039) - a two-state pressed button carrying `aria-pressed`, on
  `@radix-ui/react-toggle` (the single-toggle primitive ToggleGroup also builds on).

### Twigs added (0040-0049) - the layer now covers 14 molecules

- **Alert** (0040) - a static inline notice banner (info / success / warning / danger) with an
  optional icon slot.
- **Empty** (0041) - a zero-data placeholder block (media + title + description + actions).
- **Item** (0042) - a horizontal row layout: leading media, content, and a trailing actions cluster.
- **ButtonGroup** (0043) - a segmented cluster of joined Buttons sharing one seam.
- **InputGroup** (0044) - a text field with leading/trailing addons inside one bordered box.
- **InputOTP** (0045) - a segmented one-time-passcode field (paste support, auto-advance), on
  `input-otp`.
- **Collapsible** (0046) - a single expand/collapse disclosure (controlled/uncontrolled), on
  `@radix-ui/react-collapsible`.
- **Pagination** (0047) - a numbered page navigator with previous/next and ellipsis affordances.
- **FieldSet** (0048) - grouped form controls with fieldset/legend semantics and a disabled cascade.
- **ToggleGroup** (0049) - a segmented toggle bar (single or multiple select) with a roving
  tabindex, on `@radix-ui/react-toggle-group`.

### Branches added (0050-0069) - the layer now covers 26 organisms

- **ScrollArea** (0050) - a themed cross-browser scrollbar (thin track, rounded thumb), on
  `@radix-ui/react-scroll-area`.
- **Tabs** (0051) - a tab switcher with roving focus, arrow navigation, and an active underline, on
  `@radix-ui/react-tabs`.
- **Accordion** (0052) - a multi-section inline disclosure (single/multiple expansion), on
  `@radix-ui/react-accordion`; its expand/collapse motion joined the Roots preset keyframes.
- **AlertDialog** (0053) - a blocking confirmation modal for destructive actions (a danger Action
  button), on `@radix-ui/react-alert-dialog`.
- **DropdownMenu** (0054) - a button-triggered actions menu (roving focus, typeahead, submenus,
  checkbox/radio items), on `@radix-ui/react-dropdown-menu`.
- **ContextMenu** (0055) - a right-click menu anchored at the pointer, sharing DropdownMenu's item
  and submenu parts, on `@radix-ui/react-context-menu`.
- **Menubar** (0056) - a horizontal app menu bar (roving focus, hover-to-open siblings, submenus),
  on `@radix-ui/react-menubar`.
- **HoverCard** (0057) - a rich preview surface on hover/focus, non-modal with a grace area, on
  `@radix-ui/react-hover-card`.
- **Toast** (0058) - transient notifications with auto-dismiss, swipe-to-dismiss, and an imperative
  `useToast` hook, on `@radix-ui/react-toast`.
- **Table** (0059) - semantic table parts (thead/tbody/tr/th/td) styled with token borders and row
  hover.
- **Calendar** (0060) - a month grid with single/range/multiple selection, keyboard nav, and
  disabled dates, on `react-day-picker` + `date-fns`.
- **Carousel** (0061) - a horizontal or vertical item carousel (drag, snap, prev/next), on
  `embla-carousel-react`.
- **Chart** (0062) - a `recharts` wrapper with token-driven colour injection and a styled
  tooltip/legend.
- **Resizable** (0063) - draggable panel dividers with arrow-key resize and separator ARIA, on
  `react-resizable-panels`.
- **DataTable** (0064) - a headless `useDataTable` hook plus a styled grid that composes Table /
  Pagination / Empty, with sorting, row selection, and filters, on `@tanstack/react-table`.
- **DatePicker** (0065) - a popover-triggered date/range picker composing Calendar with a formatted
  trigger.
- **Command** (0066) - a filterable command palette on `cmdk`, composable inline or in a dialog.
- **Drawer** (0067) - a vaul-backed edge-anchored panel with drag-to-dismiss, on `vaul`; its slide
  motion joined the Roots preset keyframes.
- **Sheet** (0068) - a Radix Dialog-based edge panel with slide motion (no new dependency - additive
  to Dialog).
- **NavigationMenu** (0069) - a mega-menu with a dropdown per item, roving focus, and indicator
  tracking, on `@radix-ui/react-navigation-menu`.

### API-preserving refactors (0066 / 0067 / 0069)

Three earlier Branches were rebuilt onto the new shared primitives **without changing their public
surface**, so a consumer's imports and props are untouched:

- **Combobox now consumes Command** (0066) - its inline `cmdk` wrappers were replaced with the
  shared `Command` parts.
- **SideNav and ResponsiveDialog now consume Drawer** (0067) - SideNav's mobile rail and
  ResponsiveDialog's mobile sheet both delegate to the new `Drawer` (vaul) instead of hand-wiring
  the Radix dialog primitive.
- **TopNav now composes NavigationMenu** (0069) - the links area was updated to compose
  `NavigationMenu` where it adds value; the public `TopNav*` surface is unchanged.

These refactors are the reason the "test the outcome, not that existing tests still pass" learning
below matters: swapping the primitive under a preserved API can silently regress focus and motion
(see learnings).

## Not yet built

**Boughs** (page scaffolds and layout patterns) and an Xcode/Swift Package wrapper around the
generated `Tokens.swift`. The web component library itself is feature-complete as of 1.0.0.
