# 0017 — Spinner

## Problem

With the Seeds recipe established in [0005](0005-button.md), add the **Spinner** atom — an
accessible busy indicator for in-flight actions (button loading, inline fetches). Spinner is the
"working…" primitive reused across the catalogue.

Independently shippable: one component, one PR. Follows the 0005 recipe — pure CSS/SVG, no Radix.

## Outcome

- `@rogueoak/canopy/seeds` exports an accessible, themed `Spinner`.
- Pure CSS/SVG animation; correct busy semantics; respects reduced-motion.
- Stories (sizes · on surfaces · reduced-motion · both themes) and tests (render · role/aria ·
  sizes).
- README/Storybook updated; `0017` ticked.

## Scope

### In
- **Spinner** — CSS/SVG spinning indicator; `role="status"` with an accessible `aria-label`
  (default "Loading", overridable); sizes `sm` / `md` / `lg`; `currentColor` so it inherits or
  takes a token utility. Respects `prefers-reduced-motion` (animation reduced/stilled).
  Forwards `ref`, spreads native props.
- No new dep (pure CSS/SVG).
- Stories: each size, on default and raised surfaces, reduced-motion — light and dark.
- Tests: render, `role="status"` + `aria-label`, sizes, reduced-motion respected.

### Out
- **Determinate progress bar / progress ring** → separate, later spec (different semantics:
  `role="progressbar"` with value).
- **Full-page loading overlay** → a Twig composing Spinner + overlay later.

## Approach

Follows the **0005 recipe**: cva for size variants → semantic-token utilities, `cn()` for
merging, semantic tokens only, theme-agnostic by construction. Colour is `currentColor` by
default (inherits text/role tokens); a muted variant can use `text-muted`. The spin animation is
gated behind `motion-safe` / `prefers-reduced-motion` so reduced-motion users see a static or
gently-pulsed indicator. Vitest + Testing Library verifies busy semantics.

## Acceptance

- [ ] `Spinner` exported from `@rogueoak/canopy/seeds`, semantic tokens only, light **and** dark.
- [ ] `role="status"` with an overridable `aria-label`; sizes `sm`/`md`/`lg`.
- [ ] Pure CSS/SVG; respects `prefers-reduced-motion`.
- [ ] Forwards `ref`, spreads native props; colour via `currentColor`.
- [ ] Stories cover sizes/reduced-motion in both themes; tests (render + aria + sizes) pass.
- [ ] README/Storybook updated; `0017` ticked.
- [ ] Developer sign-off in Storybook.
