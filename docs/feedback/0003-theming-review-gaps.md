# 0003 — Theming review gaps (dark border, unguarded states, build safety)

Source: Spectra designer/engineer/architect/tester reviews on PR #5 (spec 0004). Severity:
**major** (×2) + minors.

## Symptom

1. **Dark border collision** (designer major). Dark `border` and `surface-raised` both map to
   `stone.800` → a **1.0:1 invisible hairline** on popovers/menus, and only 1.25:1 on cards.
   Borders disappear on raised surfaces in dark.
2. **Interaction-state AA unguarded** (architect major). The both-theme contrast guard covers
   base roles but omits the new `*-hover`/`*-active`/`disabled` tokens — exactly the surfaces
   0005's Button renders foreground on, in both themes. A bad hover step would ship green.
3. **Build append not idempotent / unsafe** (engineer + architect). `build.mjs` appends the
   `.dark` block to `tokens.css`; only safe because `pnpm clean` precedes it. A standalone/watch
   run double-appends, and a throw between append and `rmSync` leaves a stale sidecar + a
   half-themed file.
4. **Contrast story table is light-only** (designer minor). The Storybook Contrast panel
   hardcodes light ratios that don't flip with `.dark`, so it documents wrong numbers in dark.

## Root cause

Dark `border` was picked one step too dark (equal to `surface-raised`); contrast checks were
scoped to base text/role pairs, not the state tokens; the build composes by append rather than a
single pure write; the story table was authored as static strings.

## Fix

- Dark `border`→`stone.700`, `border-strong`→`stone.600` (restore a visible step on raised
  surfaces); re-verify the depth.
- Extend the contrast guard to assert AA for foreground-on-`hover`/`-active` (primary/secondary/
  danger/accent) in **both** themes. `disabled` is intentionally low-contrast (WCAG exempts
  disabled controls) and stays excluded — with a comment so it reads as deliberate.
- Rewrite `build.mjs` to compose `tokens.css` in **one write** (light + dark), idempotent, with
  `try/finally` cleanup; hard-error the dark format's non-reference branch instead of emitting a
  flat hex; drop the dead `outputReferences` on `darkConfig`.
- Make the Contrast story theme-aware (compute live per theme / split Light·Dark) so the doc
  can't drift.
- Generalize to a `themeConfig(name, glob)` factory so a future 3rd theme is an extension;
  assert dark `$value`s reference **primitive ramp** paths only; add the reverse coverage check
  and a "dark differs from light" assertion.

## Learning

Guard the **full token surface components will use** (interaction states, not just base roles),
and test **visual depth** (border-vs-surface separation), not only text legibility — a 1.0:1
border passes every text-contrast check. Composed build outputs should be **pure functions of
their inputs** (idempotent single write), never appends. And living-doc tables must be
**computed**, never hardcoded, or they drift from the tokens they describe. Rolled into
`overview/learnings.md`.
