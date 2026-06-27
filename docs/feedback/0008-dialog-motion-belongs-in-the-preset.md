# 0008 — Dialog motion belongs in the preset, not Storybook's CSS

## Symptom

Dialog (Branches, spec 0024) references named `animate-dialog-*` utilities for its enter/exit fade +
zoom, but the keyframes and the `@theme --animate-*` vars that define them were placed **only** in
Storybook's `apps/storybook/.storybook/tailwind.css`. Storybook looked correct, so the PR shipped
green — but a real consumer of `@rogueoak/canopy/branches` (who imports the Roots preset, not
Storybook's CSS) gets **dead `animate-dialog-*` classes and no motion**. Nothing errors: an undefined
`animate-*` utility is simply not emitted, so the dialog silently snaps open/closed with no animation.

## Root cause

`@keyframes` and a `@theme { --animate-*: … }` block are **theme declarations, not utilities**.
Tailwind v4's `@source` is a *utility scanner* — it emits a class only where it sees that class used
as a literal string in scanned source. It can **never** synthesize `@keyframes` or a `--animate-*`
theme var. So keyframed component motion can't ride the `@source '@rogueoak/canopy'` seam the way the
component's other utilities (`bg-surface-raised`, the focus ring, …) do — it must be delivered by CSS
that **every consumer already imports**. Stranding it in Storybook's CSS meant only Storybook had it.

## Fix

Ship the motion from the Roots **`tailwind-preset.css`** — the file every consumer imports alongside
`tokens.css`:

- A hand-authored `packages/roots/preset-motion.css` partial holds the four `@keyframes`
  (`dialog-overlay-in/out`, `dialog-content-in/out`) and a `@theme` block of `--animate-dialog-*`
  vars that **compose the Roots motion tokens** (`dialog-overlay-in var(--duration-slow)
  var(--ease-decelerate)`, …) — not hardcoded ms/easing.
- `build.mjs` folds the partial onto the freshly-built `dist/tailwind-preset.css` in an **idempotent
  single write** (read built preset + partial → write the concatenation), the same pure-function-of-
  inputs pattern as the `tokens.css` theme fold.
- The Storybook copy (the `@theme --animate-dialog-*` + four `@keyframes`) is **removed**, replaced by
  a one-line comment pointing at the preset.
- A `tokens.test.ts` assertion greps the built preset for `@keyframes dialog-overlay-in`,
  `@keyframes dialog-content-in`, `--animate-dialog-overlay-in:`, and that the animate value composes
  `var(--duration-slow)` + `var(--ease-decelerate)` — guarding both that the motion ships and that it
  stays token-driven.

## Learning

See `docs/overview/learnings.md` — "Animation/motion utilities ship from the preset, not `@source`":
`@source` only emits utilities it sees as literal class usages, so any component needing keyframed
motion must have that CSS delivered by something every consumer imports (the Roots preset, the same
way `tokens.css` owns runtime vars). Compose the existing `--duration-*` / `--ease-*` tokens rather
than hardcoding values, and guard the built preset for the rule.
