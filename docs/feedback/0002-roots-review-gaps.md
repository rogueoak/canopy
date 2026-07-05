# 0002 - Roots foundation: review gaps (text roles, contrast guard, accent AA)

Source: Spectra designer/architect/engineer/tester reviews on PR #3 (spec 0003). Severity:
**major** (×2) + minors.

## Symptom

1. **Composite semantic text roles missing** (designer + architect major; engineer noted).
   Spec 0003 scoped semantic text roles (`display`, `h1-h4`, `body`, `body-sm`, `label`,
   `caption`, `code`) so components reference `text-h2`, not raw scale+weight+leading. The
   build shipped only **primitives** (sizes/weights/leading/tracking). The two-tier boundary
   held for colour but leaked for type - 0005 components would re-derive heading/body styling
   by hand.
2. **AA contrast not executably guarded** (tester major). The acceptance item "text roles meet
   WCAG AA" was verified by a hand-typed ratio table in a story, decoupled from the token
   hexes. A ramp edit (exactly what 0004's dark remap does) keeps the table reading "AA" while
   real contrast drops below 4.5:1.
3. **Accent fails AA as a foreground** (designer minor). `accent` (amber.500) is only 2.83:1 on
   `bg` - fine as a fill, failing for text/icon/border use; the table only validated the fill.

## Root cause

"Typography tokens" was implemented as the primitive layer only, without the composite role
tier. Contrast was checked once, by hand, instead of by a test. The accent role was validated
for a single use (fill), not all uses (fill + foreground).

## Fix

- Add **composite text roles** as Tailwind v4 `--text-<role>` + companion
  `--text-<role>--line-height` / `--font-weight` / `--letter-spacing`, referencing the type
  primitives so `text-h2` applies the whole role.
- Add a **computed contrast test** in `tokens.test.ts` over the real token hexes (resolve
  semantics → primitives), asserting each role's pair ≥ its AA threshold - so a ramp edit can't
  silently break AA.
- Add an **`accent-strong`** role (amber.700, ~6.15:1) for foreground accent use; document
  `accent` as fill. Extend the contrast coverage to foreground-on-bg pairs.
- Tighten tests (`.DEFAULT` loop for warning/danger/info + negative `-default` guard) and docs
  (dark-remap wording, stale comment, namespace coverage). Add `ring-offset` + `tighter`
  tracking.

## Decision - interaction states deferred to 0004

Designer (major) / architect (minor) flagged missing `hover`/`active`/`disabled` state tokens.
**Decision:** introduce interaction-state semantic tokens in **0004 (theming)**, where each
state gets both light *and* dark values in one coherent pass, following the existing semantic
pattern (e.g. `color-primary-hover` → a deeper ramp step). 0004 lands before components (0005),
so states are ready before the first Button - no ad-hoc values. Convention recorded in
`architecture.md`.

## Learning

When a spec scopes a **semantic/composite tier**, verify that tier is actually delivered - not
just the primitives under it. Guard cross-cutting acceptance criteria (contrast, a11y) with
**executable tests**, never a hand-maintained table. And validate a colour role for **all** its
uses (fill *and* foreground), not just one. Rolled into `overview/learnings.md`.
