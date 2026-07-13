# 0033 - Expressive motion tokens (spring easings + motion presets)

## Problem

Canopy's motion scale is deliberately small but currently one-note: three durations
(`fast/base/slow`) and three easings (`standard/emphasized/decelerate`) that all **decelerate**.
There is no overshoot/spring curve and no ready-made motion for the small, expressive
interactions components keep re-inventing inline - a badge popping in, a form field shaking on
an invalid submit, a toast fading up. Consumers either hardcode `cubic-bezier`/`ms` values (off
the token seam) or skip the motion entirely.

transitions.dev (https://github.com/Jakubantalik/transitions.dev) is a well-tuned catalogue of
exactly these micro-interactions. We want its best, broadly-reusable motion **as Canopy tokens +
preset utilities**, curated to fit Canopy's minimal, opinionated scale - not a wholesale import.

Who it is for: component authors (Branches) and app consumers who want tasteful spring/pop/shake
motion that already composes Canopy's `--duration-*` / `--ease-*` tokens, works out of the box
from the preset every consumer imports, and honours `motion-reduce`.

## Outcome

- **Two new easing tokens** in `tokens/motion.json` (adapted from transitions.dev's bounce pair):
  - `ease.spring` = `cubic-bezier(0.34, 1.36, 0.64, 1)` - gentle overshoot for playful entrances.
  - `ease.spring-strong` = `cubic-bezier(0.34, 3.85, 0.64, 1)` - pronounced bounce, celebratory
    accents, use sparingly.
- **Two new duration tokens** extending the scale at both ends (existing `fast/base/slow`
  unchanged, so no collision and no consumer breakage):
  - `duration.micro` = `80ms` - tiny state changes, staggered children, badge/icon pops.
  - `duration.slower` = `480ms` - expressive / spring-driven motion that needs room to settle.
- **Three motion presets** hand-authored in `preset-motion.css` as `@keyframes` + a `@theme`
  block of `--animate-*` vars that **compose the tokens** (never hardcoded ms/easing), matching
  the existing `animate-dialog-*` / `animate-drawer-*` / `animate-bottom-sheet-*` pattern exactly:
  - `animate-pop-in` / `animate-pop-out` - scale + fade; `-in` springs, `-out` settles.
  - `animate-shake` - short horizontal shake for error/invalid states.
  - `animate-fade-in` / `animate-fade-out` - pure opacity for toasts/content reveal.
- All five outputs stay in lockstep: the new tokens appear in `dist/tokens.css` (`:root` vars),
  `dist/tokens.ts` (typed export), and `dist/tailwind-preset.css` (`@theme inline`), and the new
  `animate-*` utilities ship folded into `dist/tailwind-preset.css` from `preset-motion.css`.
- `pnpm test` + `pnpm lint` + `pnpm build` stay green in `packages/roots`; README motion section
  and `docs/overview/` (`features`, `architecture`) updated to match reality.

## Scope

In:

- `tokens/motion.json` - add `duration.micro`, `duration.slower`, `ease.spring`,
  `ease.spring-strong` with `$description`s.
- `preset-motion.css` - add the `pop-*` / `shake` / `fade-*` keyframes and their token-composed
  `--animate-*` theme vars; extend the file's header comment to cover the new presets.
- `tokens.test.ts` - assert the new tokens land in each output and the new `animate-*` utilities
  ship token-composed (grep the built preset, per the existing motion test).
- README motion section + `docs/overview/features.md` / `architecture.md`.

Out:

- `success-check` and other **multi-element composites** from transitions.dev (fade+rotate+blur+
  bob+SVG-path-draw). A single `--animate-*` utility is one keyframe timeline on one element; the
  check's path-draw needs `stroke-dashoffset` on a nested SVG path. That is component motion, not
  a token - a future Branches component can compose these tokens for it. Noted as future work.
- Distance / scale / blur helper tokens from transitions.dev. Canopy authors those inline per
  component today; adding a parallel token family is a separate decision, not this spec.
- Changing or renaming any existing token (`fast/base/slow`, `standard/emphasized/decelerate`)
  or existing `animate-dialog-*` / `-drawer-*` / `-bottom-sheet-*` utility. Purely additive.
- Retrofitting existing components to use the new presets (each is its own small follow-up).

## Approach

**Tokens.** Append to the existing DTCG groups in `motion.json`. Durations keep file order
low-to-high (`micro`, `fast`, `base`, `slow`, `slower`); easings append after `decelerate`. The
Style Dictionary pipeline already runs `cubicBezier/css` + duration transforms, so no config or
transform change is needed - the new tokens flow through the same three web outputs automatically.

**Naming.** Canopy easings are named by **intent** (`standard`/`emphasized`/`decelerate`), so
transitions.dev's `bounce` becomes `spring` (subtle) / `spring-strong` (pronounced). Durations
keep Canopy's t-shirt scale; transitions.dev's own `fast`(250)/`slow`(400) values are **not**
reused - they would collide with Canopy's `fast`(120)/`slow`(320). We map intent, not literals.

**Presets.** Mirror the established partial exactly - a pair of `@keyframes` (`-in`/`-out`) plus
`@theme { --animate-<name>: <keyframes> var(--duration-*) var(--ease-*); }`. Choices:

- `pop-in`: `scale(0.9)`+`opacity:0` -> `scale(1)`+`opacity:1`, `var(--duration-base)`
  `var(--ease-spring)` - the flagship showcase of the new spring curve (badges, popovers, menus,
  tooltips).
- `pop-out`: reverse to `scale(0.96)`+`opacity:0`, `var(--duration-fast)` `var(--ease-standard)` -
  exits settle rather than bounce, matching Canopy's existing `*-out` convention (dialog/drawer
  exits use `--ease-standard`).
- `shake`: 3 short `translateX` cycles (`+/- 4px`), `var(--duration-slow)` `var(--ease-standard)` -
  for `aria-invalid` form fields; the amplitude stays small and finite so it reads as feedback,
  not decoration.
- `fade-in` / `fade-out`: pure `opacity`, `var(--duration-base)`/`var(--duration-fast)`
  `var(--ease-standard)` - the most reusable primitive (toasts, content).

Every consumer gates these with `motion-reduce:animate-none` at the call site (documented in the
README), same as the dialog/drawer motion - the preset ships the motion; the component opts in.

**Testing.** Follow the existing motion test: build the preset in-test and grep the **built rule**
(the literal-class learning - keyframes/`@theme --animate-*` can never come from `@source`), and
assert each new `--animate-*` value contains the expected `var(--duration-*)`/`var(--ease-*)` so
motion stays token-driven, not hardcoded. Assert the four new tokens appear in `tokens.css`,
`tokens.ts`, and the preset's `@theme inline`.

## Acceptance

- [ ] `motion.json` defines `duration.micro` (80ms), `duration.slower` (480ms), `ease.spring`
      (`cubic-bezier(0.34, 1.36, 0.64, 1)`), `ease.spring-strong`
      (`cubic-bezier(0.34, 3.85, 0.64, 1)`) with `$description`s; existing tokens unchanged.
- [ ] `pnpm build` emits the four new tokens into `dist/tokens.css`, `dist/tokens.ts`, and
      `dist/tailwind-preset.css` (`@theme inline`).
- [ ] `preset-motion.css` adds `@keyframes` for pop-in/out, shake, fade-in/out and `--animate-*`
      theme vars that COMPOSE `--duration-*` / `--ease-*` (no hardcoded ms/easing); they ship
      folded into `dist/tailwind-preset.css`, and existing `animate-dialog-*`/`-drawer-*`/
      `-bottom-sheet-*` utilities are untouched.
- [ ] `tokens.test.ts` asserts: the four new tokens in each output; `animate-pop-in` composes
      `var(--duration-base)` + `var(--ease-spring)`; `animate-shake` and `animate-fade-in` ship
      token-composed; the fold stays idempotent (no double-append).
- [ ] `pnpm test` + `pnpm lint` green in `packages/roots`.
- [ ] README motion section documents the new easings, durations, and `animate-*` utilities
      (with the `motion-reduce` gating note); `docs/overview/features.md` + `architecture.md`
      updated to match. `success-check` listed as future component-level work.
