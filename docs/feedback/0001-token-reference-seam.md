# 0001 — Token reference seam not preserved in generated outputs

Source: Spectra architect review on PR #2 (spec 0002 skeleton). Severity: **major**.

## Symptom

The skeleton's whole purpose is to prove every seam works — including theming. But the
Style Dictionary custom formats for the **Tailwind v4 preset** and the **typed TS export**
read each token's resolved `$value`. Only the `css/variables` platform set
`outputReferences: true`. So a token that *references* another (the basis of semantic →
primitive theming and the `.dark` remap) would have its reference flattened to a literal
value in two of the three outputs. The breakage is invisible today because the only sample
token is a single flat primitive with no references — it would first surface in 0004 when
semantic tokens and dark mode arrive, i.e. the seam would ship "green" and break later.

## Root cause

Custom SD formats were written to emit `token.$value` (already resolved) rather than
honoring references the way SD's built-in `css/variables` does with `outputReferences`.
Compounding it: `tokens.css` (`:root`) and the preset (`@theme`) both declared the same
variables, leaving ownership of runtime registration ambiguous.

## Fix

- Make **`tokens.css`** the single owner of runtime `:root` variables (keeps
  `outputReferences: true`, so a semantic token emits `--x: var(--primitive)`).
- Rewrite the **Tailwind preset** to use Tailwind v4 **`@theme inline`**, mapping each token
  to `var(--<name>)` — utilities reference the runtime vars instead of redeclaring values
  (resolves the double-declaration too). Dark mode then works by overriding vars in
  `tokens.css` `.dark`, and it cascades to utilities.
- Make the **typed TS export** reference-aware: tokens using references emit
  `var(--<ref>)`; primitives keep their literal value.
- Add a second **sample token that references the first** so the skeleton actually exercises
  the reference seam through all three outputs, guarded by a test.

## Learning

Custom token-build formats must **honor references**, not resolved values — otherwise the
theming seam silently breaks downstream. And prove a seam with input that actually exercises
it (a referencing token), never a degenerate flat sample. Rolled into
`overview/learnings.md`.
