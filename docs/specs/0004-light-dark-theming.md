# 0004 — Light & dark theming

## Problem

0003 delivered the light-theme foundation with a semantic layer deliberately structured for
theming (semantic tokens reference primitives; `tokens.css` owns the runtime vars; the Tailwind
`@theme inline` preset references them so a remap cascades to utilities). Now make canopy
**themeable**: add the **dark theme** (remap the semantic layer to dark values), wire **runtime
theme switching**, and add the **interaction-state tokens** (`hover`/`active`/`disabled`)
deferred from 0003 — defined with light *and* dark values together, ahead of components (0005).

Audience: us (so 0005 components are theme-agnostic) and rogueoak app teams (who flip a theme
with one class).

## Outcome

When done:

- A **`.dark` theme**: every semantic colour token remaps to a dark value. Because components
  consume semantic tokens (via utilities referencing runtime vars), toggling `.dark` on a root
  element re-themes the whole UI with **zero per-component code**.
- **Interaction-state tokens** (`hover`/`active`/`disabled`) for the interactive roles, with
  light and dark values.
- **Theme switching** is real: the Storybook toolbar toggle (stubbed empty in 0002) flips
  `.dark`; consumers get a documented one-line mechanism.
- **WCAG AA holds in both themes** — the computed contrast test runs over light *and* dark.
- The Storybook **Foundations** render correctly in dark, and a demo shows a UI re-theming live.

## Scope

### In
- **Dark semantic mapping** — a `.dark` block (in `tokens.css`) remapping all semantic colour
  tokens: surfaces (dark canvases), text (light-on-dark), lines, roles (`primary`/`secondary`/
  `accent`/`muted` tuned for dark legibility), and status + foregrounds. Primitives are
  unchanged (shared ramps) — only the semantic layer flips.
- **Interaction-state tokens** — `color-<role>-hover` / `-active` for `primary`/`secondary`/
  `accent`/`danger` (referencing adjacent ramp steps), plus a `disabled` convention
  (disabled surface + foreground, or a documented opacity token). Light + dark values.
- **Theme mechanism** — class-based `.dark` on a root (`<html>`/`<body>`/container). Tailwind v4
  dark variant wired (`@custom-variant dark (&:where(.dark, .dark *))`) for the rare explicit
  `dark:` need; the common path is semantic tokens auto-flipping. Document the consumer snippet
  (toggle class; optional `prefers-color-scheme` bootstrap).
- **Storybook** — make `withThemeByClassName` functional (light default, `.dark`); ensure all
  Foundations stories read correctly in both; add a "Theme" demo.
- **Tests** — extend the contrast guard to assert AA for **both** themes; guard that the dark
  block remaps the semantic set (no token left at its light value by omission).
- README/architecture: theming usage + the dark-remap model; tick `0004`.

### Out
- Real components → **0005**.
- Multi-brand theming, density/compact modes, high-contrast theme → later.
- Full OS auto-switching beyond a documented `prefers-color-scheme` snippet.

## Approach

- **Class-based semantic remap.** Keep the 0003 architecture: `tokens.css` is the single owner
  of runtime vars. Add a `.dark { … }` selector that overrides the **semantic** vars only.
  Utilities (`bg-primary`, `text-default`, …) reference those vars, so they re-resolve under
  `.dark` automatically. The Tailwind preset and TS export are unchanged.
- **Authoring dark values.** Author dark overrides as DTCG token data (e.g.
  `tokens/color/semantic.dark.json`, same paths, dark `$value` references like
  `{color.stone.900}`), and emit them via a custom Style-Dictionary format that writes
  `:root { …light… }` + `.dark { …dark… }` into `tokens.css`. Keep it reference-aware (dark
  values reference primitives, never flattened).
- **Dark value strategy (tuned visually in Storybook).** Surfaces invert (`bg`→`stone.950`,
  `surface`→`stone.900`, `surface-raised`→`stone.800`); text lightens (`text`→`stone.50`,
  `text-muted`→`stone.300`); borders→`stone.700`; `primary`→a lighter moss step for legibility
  on dark; status foregrounds flip. All AA-checked on dark surfaces.
- **Interaction states.** Model as semantic tokens (e.g. `color-primary-hover`→deeper/lighter
  ramp step per theme). `disabled` likely a shared convention (muted bg + `text-subtle`
  foreground, or a `--opacity-disabled` token) — settle the cleanest one in the build and
  document it.
- **Visual lock**, same as 0003: tune dark values in Storybook, then lock.

### Key decisions
- **Class-based `.dark`** (not media-query-only) so apps can offer a user toggle. A
  `prefers-color-scheme` bootstrap is documented but optional.
- Interaction states live here (with both themes) rather than in 0003 or scattered across
  components — one coherent definition before the first Button.
- **Brand-green refinement (developer-approved in `.preview/dark-showcase.html`).** The `moss`
  ramp is nudged slightly **greener (less yellow)** so the primary reads as green, not olive,
  and shares **one hue across both themes**. Anchors: `moss-400 ≈ #80A85C` (the dark primary),
  `moss-600 ≈ #4C6634` (the light primary). All 11 steps re-tuned coherently; AA re-verified.
  This refines the 0003 `moss` primitives — folded into this build (everything else in the
  palette is unchanged).
- **Approved dark mapping** (starting point, AA-tuned in Storybook): `bg`→stone-950,
  `surface`→~stone-900, `surface-raised`→~stone-800, `text`→stone-50, `text-muted`→stone-300,
  `text-subtle`→stone-400, `border`→stone-800, `border-strong`→stone-700, `primary`→the greener
  moss-400, `primary-foreground`→near-black, `secondary`→bark-400, `accent-strong`→amber-300,
  status on dark status-surfaces with light status-text.

## Acceptance

- [ ] `tokens.css` emits a `.dark` block remapping **all** semantic colour tokens; toggling
      `.dark` flips the entire UI (shown in Storybook).
- [ ] Interaction-state tokens (`hover`/`active`/`disabled`) exist for the interactive roles,
      with light and dark values.
- [ ] The Storybook theme toggle is functional; all Foundations render correctly in dark.
- [ ] The computed contrast test asserts **WCAG AA in both light and dark**; a test guards that
      no semantic token is left unmapped in dark.
- [ ] A demo shows a UI re-theming with only the `.dark` class — no per-component theme code.
- [ ] README theming section + consumer toggle snippet; `architecture.md` documents the model;
      `0004` ticked on the roadmap.
- [ ] Developer sign-off on the dark theme in Storybook (the visual lock).
