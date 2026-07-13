# 0034 - Motion foundations page (tokens table + interactive presets)

## Problem

Canopy's Storybook Foundations has a `Motion` story, but it predates spec 0033: it shows only the
old three easings (`standard/emphasized/decelerate`) and three durations (`fast/base/slow`), paired
1:1, with no literal-value table and no demo of the animation presets. Since 0033 the token set is
larger (5 easings incl. `spring`/`spring-strong`, 5 durations incl. `micro`/`slower`) and now ships
ready-made `animate-*` presets (`pop-in/out`, `shake`, `fade-in/out`) - none of which are
documented or shown in motion. A designer or consumer has no single page to read the literal values
AND feel the motion.

Who it is for: designers picking a curve/duration, and engineers choosing a preset - both want the
numbers and the motion side by side, in the living Storybook.

## Outcome

The Foundations `Motion` story becomes a complete motion reference, driven by the generated Roots
tokens (no hardcoded values), reading correctly in light and dark:

- **Durations** - a table of all five (`micro` 80ms, `fast` 120ms, `base` 200ms, `slow` 320ms,
  `slower` 480ms) with the literal value pulled from `tokens`, each with a replayable bar that
  travels for exactly that duration.
- **Easings** - a table of all five (`standard`, `emphasized`, `decelerate`, `spring`,
  `spring-strong`) with the literal `cubic-bezier(...)` value from `tokens`, each with an
  interactive track (click/hover to send a dot across using that curve) so the overshoot of the
  spring curves is visible.
- **Presets** - each `animate-*` preset (`pop-in`, `pop-out`, `shake`, `fade-in`, `fade-out`)
  shown with: a Play button that runs the ACTUAL Tailwind utility on a sample element (re-triggered
  via a React key remount), and its composition (e.g. `animate-pop-in = pop-in . duration-base .
  ease-spring`) read from the token values. The `shake` demo is gated with
  `motion-reduce:animate-none` and carries a visible note that this gating is mandatory (a
  vestibular trigger), modelling correct consumer usage.
- A short intro paragraph noting all motion composes the `--duration-*` / `--ease-*` tokens and
  that consumers gate presets with `motion-reduce`.

## Scope

In:

- Rewrite the `Motion` component in `apps/storybook/src/Foundations.stories.tsx` (still the
  `Foundations` / `Motion` story - this IS the core-tokens page; no new story file).
- Use FULL literal class names for the `animate-*` utilities (`animate-pop-in`, ... ) so Tailwind
  v4's source scanner emits them (same rule the file already notes for radii/shadows).
- Values come from the typed `tokens` export (already imported), matching the other Foundations
  sections; nothing hardcoded.

Out:

- No new Roots tokens or preset changes (0033 shipped those; this only documents them).
- No changes to other Foundations sections (colours, type, spacing, radii, elevation, contrast).
- `spring-strong` has no shipped `animate-*` preset (by design); it appears in the easings table +
  track, not as a preset player. Not adding a preset just to demo it.
- No visual-regression/Playwright test committed to the repo (rendering is verified during build).

## Approach

Mirror the existing Foundations idioms exactly: the `wrap`/`h2` styles, `tokenVal()` reader, a
scoped `<style>` block for the demo CSS, and per-section tables like the Contrast story. Replays use
a `useState` counter as the element `key` so re-clicking restarts the CSS animation/transition
(forcing a remount is the simplest reliable restart). Easing tracks keep the hover-to-play affordance
and add click-to-replay. Preset players apply the literal `animate-*` class on the keyed element.
The composition line for each preset is derived from the token values so it can't drift from the
tokens. Keep everything theme-driven (`var(--color-*)`), like the rest of the file.

## Acceptance

- [ ] Foundations / Motion shows a durations table (5 rows, literal ms from `tokens`) with a
      replayable bar per duration.
- [ ] It shows an easings table (5 rows, literal `cubic-bezier` from `tokens`) with an interactive
      track per easing; the spring curves visibly overshoot.
- [ ] It shows the five `animate-*` presets, each with a working Play (remount) button that runs the
      real Tailwind utility, plus its token-composition line.
- [ ] `shake` is gated `motion-reduce:animate-none` with a visible mandatory-gating note.
- [ ] All values read from the `tokens` export; nothing hardcoded; renders in light + dark.
- [ ] `apps/storybook` builds (`pnpm build`) and lints (`pnpm lint`) clean; `packages/roots` tests
      stay green (unchanged). The page is visually confirmed to render and animate.
- [ ] `docs/overview/features.md` note for Foundations/Motion updated to mention the presets page.
