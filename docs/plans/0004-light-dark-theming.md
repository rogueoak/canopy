# Plan 0004 - Light & dark theming

Implements `docs/specs/0004-light-dark-theming.md`. Adds the dark theme (a `.dark` semantic
remap), interaction-state tokens (light + dark), a functional Storybook theme toggle, a
contrast guard across **both** themes, and the developer-approved **moss-green refinement**.
Reuses the 0003 pipeline; primitives stay the single shared ramp set (only `moss` is re-tuned).

## 1. Moss-green refinement (primitive)
Replace the `moss` ramp in `packages/roots/tokens/color/primitive.json` with the greener
(less-yellow) ramp below - one hue (~90°) across all steps, anchored at the approved
`moss-400`/`moss-600`. Verify perceptual smoothness; adjust a step only if the contrast test
or an even-step check fails.

```
50 #F1F5E8 · 100 #E2EACB · 200 #C7D6A0 · 300 #A6C077 · 400 #80A85C · 500 #688E45 ·
600 #4C6634 · 700 #3C5329 · 800 #2F4121 · 900 #25331C · 950 #131B0D
```
`color-primary` (light = moss-600 `#4C6634`) and the dark primary (moss-400 `#80A85C`) now
share the hue. No other ramp changes.

## 2. Dark semantic mapping
Author `packages/roots/tokens/color/semantic.dark.json` - the **same token paths** as
`semantic.json`, with dark `$value`s that **reference primitives** (keep it reference-aware):

- surfaces: `bg`→`{color.stone.950}`, `surface`→`{color.stone.900}`,
  `surface-raised`→`{color.stone.800}`, `overlay`→`{color.stone.950}`
- text: `text`→`{color.stone.50}`, `text-muted`→`{color.stone.300}`,
  `text-subtle`→`{color.stone.400}`, `text-inverted`→`{color.stone.900}`
- lines: `border`→`{color.stone.800}`, `border-strong`→`{color.stone.700}`,
  `ring`→`{color.moss.400}`, `ring-offset`→`{color.stone.950}`
- roles: `primary`→`{color.moss.400}`, `primary-foreground`→`{color.moss.950}`,
  `secondary`→`{color.bark.400}`, `secondary-foreground`→`{color.bark.950}`,
  `accent`→`{color.amber.400}`, `accent-strong`→`{color.amber.300}`,
  `accent-foreground`→`{color.amber.950}`, `muted`→`{color.stone.900}`,
  `muted-foreground`→`{color.stone.300}`
- status: `success/warning/danger/info` → their `.400` (DEFAULT role), `*-foreground` → their
  `.950`/`.50` as contrast dictates (tune for AA on dark surfaces). Status *surface* usage in
  components will pair a dark status bg (`.900`) with light status text (`.300`) - expose what's
  needed.

## 3. Interaction-state tokens (light + dark)
Add to `semantic.json` (light) and `semantic.dark.json` (dark), referencing ramp steps:

| token | light | dark |
|---|---|---|
| `color-primary-hover` | `{color.moss.700}` | `{color.moss.300}` |
| `color-primary-active` | `{color.moss.800}` | `{color.moss.500}` |
| `color-secondary-hover` | `{color.bark.700}` | `{color.bark.300}` |
| `color-secondary-active` | `{color.bark.800}` | `{color.bark.500}` |
| `color-accent-hover` | `{color.amber.600}` | `{color.amber.300}` |
| `color-danger-hover` | `{color.danger.700}` | `{color.danger.400}` |
| `color-disabled` (surface) | `{color.stone.100}` | `{color.stone.800}` |
| `color-disabled-foreground` | `{color.stone.400}` | `{color.stone.600}` |

(Disabled is a surface+foreground convention; components also use `opacity` where a control
just dims. Document the convention.)

## 4. Pipeline - emit `:root` (light) + `.dark` (dark) into tokens.css
The CSS output must become:
```css
:root { /* all light tokens (primitives + light semantics) */ }
.dark { /* dark semantic overrides only, as var(--primitive) references */ }
```
Implementation (pick the cleanest): build the existing light platform → `:root` as today, then a
second pass over `semantic.dark.json` (resolved against the same primitives, reference-aware)
emitting a `.dark { … }` block appended to `dist/tokens.css`. Primitives are NOT repeated in
`.dark` (shared). The **Tailwind preset and typed TS export are unchanged** - they reference the
runtime vars, which `.dark` overrides; utilities (`bg-primary`, …) re-resolve under `.dark`
automatically. Add `@custom-variant dark (&:where(.dark, .dark *))` to the Storybook/consumer CSS
so explicit `dark:` utilities also work (rarely needed).

## 5. Storybook - functional toggle
Wire `@storybook/addon-themes` `withThemeByClassName` to toggle the `.dark` class on the
preview `<html>` (light default). Ensure the global CSS imports give `:root` + `.dark`. Every
Foundations story must read correctly in both themes; add a **Theme** demo (a small UI that
re-themes live) and ensure the Colours story shows the dark semantic values when toggled.

## 6. Contrast - guard BOTH themes
Extend `packages/roots/tokens.test.ts`: the contrast guard must resolve role pairs for **light
and dark** and assert AA in each. Resolve dark values by reading the `.dark` block from the
built `tokens.css` (or the dark token source) and chasing `var(--primitive)` to the primitive
hexes (primitives are literals in `:root`). Also assert: every semantic token present in
`:root` that should theme has a `.dark` override (no token silently left at its light value).

## 7. Docs
- README: a **Theming** section - the `.dark` class mechanism, the consumer toggle snippet, and
  an optional `prefers-color-scheme` bootstrap; tick `0004` on the roadmap.
- `architecture.md`: the `:root`/`.dark` emission model + interaction-state convention (replace
  the deferred note) + the moss-green refinement rationale.
- `features.md`: dark theme + interaction states + theme switching.
- Learning only if real friction.
- Add `.preview/` is already gitignored; no artifact changes needed.

## Verify (run; capture proof per item)
1. `pnpm build` green (tokens.css now has `:root` + `.dark`; canopy; Storybook static).
2. `pnpm test` green incl. the both-theme contrast guard + the dark-coverage guard.
3. `pnpm lint` + `pnpm format:check` green.
4. Grep `dist/tokens.css`: show `:root` contains `--color-primary: var(--color-moss-600)` and
   `.dark` contains `--color-primary: var(--color-moss-400)` (and `moss-600` resolves to
   `#4c6634`, `moss-400` to `#80a85c`).
5. Grep built Storybook CSS: `bg-primary` resolves to `var(--color-primary)` (theme-agnostic);
   confirm `.dark` block present so toggling re-themes.
6. Confirm the Storybook theme toggle exists and flips `.dark` (story renders in both).

Iterate until all pass - the `.dark` emission is the tricky bit; verify against the built CSS.

## Out of scope
Real components (0005), multi-brand/density/high-contrast themes, OS auto-switching beyond a
documented snippet.
