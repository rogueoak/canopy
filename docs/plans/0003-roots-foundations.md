# Plan 0003 - Roots: Foundations

Implements `docs/specs/0003-roots-foundations.md`. Builds the real two-tier token system
(primitive ramps + semantic tokens), typography (Figtree + Geist Mono, self-hosted), spacing,
radii, elevation, and motion - generated through the existing 0002 Style Dictionary pipeline
and rendered as Storybook **Foundations** stories for the visual lock. **Light theme only;
dark is 0004.**

## Guiding constraints
- Components consume **only semantic tokens**. Primitives are referenced by semantics, never
  used directly in components.
- Reuse the 0002 pipeline (CSS vars + typed TS + `@theme inline` Tailwind preset). The custom
  formats are already reference-aware - keep that working.
- **Token names must map onto Tailwind v4 `@theme` namespaces** so utilities generate (see §3).

## 1. Token sources (DTCG JSON under `packages/roots/tokens/`)
Replace the throwaway `sample.json`. Split by concern:

- `color/primitive.json` - ramps 50-950 for `moss`, `bark`, `stone`, `amber`, `success`,
  `warning`, `danger`, `info`, using the **approved hexes in the spec** (§Approved starting
  palette). Add `base.white` (#FFFFFF). Each step `{ "$value": "#…", "$type": "color" }`.
- `color/semantic.json` - light-theme semantic tokens that **reference** primitives. Names are
  the flattened path under `color.*` so they land as `--color-*`:
  - `color.bg` → `{color.stone.50}`, `color.surface` → `{color.base.white}`,
    `color.surface-raised` → `{color.base.white}`
  - `color.text` → `{color.stone.900}`, `color.text-muted` → `{color.stone.600}`,
    `color.text-subtle` → `{color.stone.500}`, `color.text-inverted` → `{color.stone.50}`
  - `color.border` → `{color.stone.200}`, `color.border-strong` → `{color.stone.300}`,
    `color.ring` → `{color.moss.600}`
  - `color.primary` → `{color.moss.600}`, `color.primary-foreground` → `{color.moss.50}`
  - `color.secondary` → `{color.bark.600}`, `color.secondary-foreground` → `{color.bark.50}`
  - `color.accent` → `{color.amber.500}`, `color.accent-foreground` → `{color.amber.950}`
  - `color.muted` → `{color.stone.100}`, `color.muted-foreground` → `{color.stone.600}`
  - `color.success` → `{color.success.600}`, `color.success-foreground` → `{color.success.50}`
    (same shape for `warning`/`danger`/`info`)
- `typography.json`:
  - `font.sans` → `"Figtree, ui-sans-serif, system-ui, -apple-system, sans-serif"`,
    `font.mono` → `"Geist Mono, ui-monospace, SFMono-Regular, monospace"` (`$type: fontFamily`)
  - `text.xs…text.6xl` font sizes (rem; 12→60 on ~1.2 ratio) (`$type: dimension`)
  - `leading.none/tight/snug/normal/relaxed` line-heights; `tracking.tight/normal/wide`
  - `font-weight.normal(400)/medium(500)/semibold(600)/bold(700)`
- `space.json` - `space.0…space.32` (rem, 4px base) for the typed export/docs. (Tailwind
  spacing utilities derive from a single `--spacing` base - see §3.)
- `radius.json` - `radius.none/sm(0.25rem)/md(0.5rem)/lg(0.75rem)/xl(1rem)/2xl(1.5rem)/full(9999px)`
- `shadow.json` - `shadow.sm/md/lg/xl` as soft, slightly-warm box-shadow strings.
- `motion.json` - `duration.fast(120ms)/base(200ms)/slow(320ms)`; `ease.standard/emphasized/decelerate`
  (cubic-beziers).

## 2. Fonts (self-hosted)
- Add `@fontsource-variable/figtree` and `@fontsource/geist-mono` (or `@fontsource-variable`
  equivalents) to `apps/storybook` and document them as the consumer install for
  `@rogueoak/roots`. Import the font CSS in Storybook's global CSS (`.storybook/tailwind.css`).
- Roots ships the **family tokens** (names), not the font binaries; consumers install the
  @fontsource packages (document in README). Confirm Figtree renders in Storybook.

## 3. Style Dictionary → Tailwind v4 namespace mapping (the critical part)
Tailwind v4 generates utilities from specific `@theme` variable namespaces. Token paths must
flatten to these names so the `@theme inline` preset produces working utilities:

| Token path | Flattened var | Tailwind utility |
|---|---|---|
| `color.*` | `--color-*` | `bg-*`, `text-*`, `border-*`, `ring-*` |
| `font.sans/mono` | `--font-sans/-mono` | `font-sans`, `font-mono` |
| `text.lg` | `--text-lg` | `text-lg` (font-size) |
| `font-weight.medium` | `--font-weight-medium` | `font-medium` |
| `leading.snug` | `--leading-snug` | `leading-snug` |
| `tracking.tight` | `--tracking-tight` | `tracking-tight` |
| `radius.md` | `--radius-md` | `rounded-md` |
| `shadow.md` | `--shadow-md` | `shadow-md` |
| `ease.standard` | `--ease-standard` | `ease-standard` |

- The existing `tailwind/preset-v4` format already emits `--<name>: var(--<name>)` for every
  token under `@theme inline` - which is correct for all the namespaces above. **Verify** each
  category actually generates a utility in the built Storybook CSS.
- **Spacing special-case:** Tailwind v4 derives `p-*`/`gap-*`/`m-*` from a single `--spacing`
  base. Emit `--spacing: 0.25rem` in the preset (the build may special-case the `space` group,
  or add a literal). The `space.*` tokens remain in `tokens.css`/TS for direct use. Verify
  `p-4` = 1rem in Storybook.
- If any category needs a tweak to the preset format, keep it reference-safe (don't reintroduce
  flattened references - see feedback 0001).

## 4. Storybook Foundations stories (`apps/storybook/src/`)
Replace the placeholder stories. Add a **Foundations** section:
- `Foundations/Colours` - every primitive ramp (swatch + step + hex + AA note) and the semantic
  swatches grouped (surfaces / text / lines / roles / status), rendered via utilities + vars.
- `Foundations/Typography` - Figtree specimen: the type scale (xs→6xl) via `text-*` utilities,
  weights, leading/tracking samples, and Geist Mono for code.
- `Foundations/Spacing` - the space scale visualised.
- `Foundations/Radii` - radius swatches.
- `Foundations/Elevation` - shadow cards.
- `Foundations/Motion` - duration/easing demo (CSS transitions).
Keep the `Seeds/Sprout` story or replace it with a small "in-context" demo card using semantic
tokens (no real components yet - those are 0005).

## 5. Tests
- Extend `packages/roots/tokens.test.ts` (reads built `dist/`): assert semantic tokens resolve
  to references (e.g. `--color-primary: var(--color-moss-600)` in `tokens.css`;
  `tokens['color-primary'] === 'var(--color-moss-600)'`); assert a few primitive hexes; assert
  `--spacing` and a radius/text/shadow var exist in the preset.
- Keep canopy's Sprout test green (or update if the component/story changed).

## 6. Contrast
Document WCAG AA results for text roles on their intended surfaces (`text` on `bg`/`surface`,
`text-muted` on `surface`, `primary-foreground` on `primary`, status foregrounds on status
surfaces). Adjust ramp steps if any role fails AA. Put the table in the Typography/Colours
story or a short `Foundations/Contrast` note.

## 7. Living docs + hygiene
- README: replace the Tokens section's sample-token language with the real system; document the
  `@fontsource` install for consumers; tick `0003` on the roadmap. Keep package rows _(planned)_.
- `.gitignore`: add `.preview/` (the throwaway exploration page lives in the main checkout).
- Reflect: update `overview/features.md` (the real foundation) and `overview/architecture.md`
  (token categories + Tailwind v4 namespace mapping). Learning only if real friction.

## Verify (all must pass from the worktree - actually run)
- `pnpm build` green (roots emits real tokens.css/tokens.js/tailwind-preset.css; canopy;
  Storybook static).
- `pnpm test` green (roots + canopy).
- `pnpm lint` + `pnpm format:check` green.
- Grep the built Storybook CSS to confirm utilities generated for **each** category:
  `bg-primary`, `text-lg`, `font-sans`, `rounded-md`, `shadow-md`, and `p-4` (= 1rem).
- Confirm Figtree is referenced/loaded in the Storybook build.
- Grep `dist/tokens.css` to confirm semantic→primitive references preserved
  (`--color-primary: var(--color-moss-600)`).

## Out of scope
Dark theme + switching (0004), real components (0005), breakpoints/density/multi-brand,
`npm publish`.
