# 0028 - Brand theming API

## Problem

Canopy is themeable across light and dark (0004), but only within its OWN palette. A downstream
app that needs its own brand - custom primitive ramps plus the same semantic role names - has no
supported way to re-theme every Canopy component in light AND dark. Today the only options are to
fork `@rogueoak/roots` or to hand-write a wall of `--color-*` overrides with no guard that the
result still meets WCAG AA. Both are fragile: a fork drifts from upstream, and hand-rolled
overrides silently ship an illegible role the moment a ramp step is a shade off.

The project has always framed this as in scope - `project.md` states theming (light/dark, future
brands) is a token concern, not a component one - so the seam exists; what is missing is a
consumer-facing pipeline that turns a brand's token file into a validated override stylesheet.

Audience: rogueoak app teams (e.g. a party-game platform) that consume `@rogueoak/canopy` and want
their own brand without forking, and us (so the brand path is a first-class, tested capability).

## Outcome

When done:

- `@rogueoak/roots` exposes a build-time brand pipeline - an exported `buildBrand()` and a
  `roots-brand` CLI - that takes a brand's DTCG token files (new primitive ramps + light and dark
  semantic mappings using Canopy's role names) and emits a single `brand.css` with a `:root { ... }`
  block (brand primitives + light roles) and a `.dark { ... }` block (dark roles).
- A consumer imports `brand.css` AFTER `@rogueoak/roots/tokens.css`, and every Canopy component
  re-themes to the brand in light and dark with ZERO component changes - because components consume
  only semantic roles, and the brand re-points those roles.
- The pipeline reuses the SAME custom Style Dictionary formats/transforms as the core build, and the
  SAME WCAG AA guard: `buildBrand()` FAILS (throws) if any role/state pair breaks AA in either
  theme, or if the brand leaves any Canopy semantic role unmapped, or if a dark override is a flat
  hex instead of a primitive reference.
- A neutral example brand (`sunset`) ships as the test fixture and the docs example, proving AA
  passes for both themes and that every semantic role is mapped.
- A lightweight RUNTIME path (an app redefining `--color-*` in its own `:root`/`.dark`) is
  documented for quick cases that do not need the build-time guard.

## Scope

### In

- **`buildBrand(options)`** (new `packages/roots/brand.mjs`, exported at `@rogueoak/roots/brand`) -
  runs Style Dictionary over a brand's primitive + semantic-light + semantic-dark DTCG sources and
  writes `brand.css` (`:root` + `.dark`, or a scoped `.<brand>` + `.<brand>.dark` when a `scope` is
  given). Returns the output path, the CSS, and the mapped role list.
- **`roots-brand` CLI** (new `packages/roots/cli.mjs`, a package `bin`) - a thin wrapper: reads a
  `brand.config.json`, resolves paths relative to it, calls `buildBrand()`, prints the result.
- **Reused AA guard** (new `packages/roots/contrast.mjs`) - the WCAG relative-luminance + contrast
  math and the canonical role-pair list, extracted from `tokens.test.ts` so ONE definition guards
  both the core tokens and every brand. `buildBrand()` uses it to validate the emitted `brand.css`
  in both themes and to check role coverage against Canopy's own shipped role set.
- **Generalized theme factory** - `style-dictionary.config.mjs` `themeConfig`/`registerThemeFormat`
  gain a `selector` (and output-path) parameter so the brand dark block can reuse the exact
  reference-aware, hard-error-on-flat-hex format that Canopy's `.dark` uses. Canopy's own build is
  unchanged (defaults preserve current behavior).
- **Example brand `sunset`** (`packages/roots/examples/sunset/`) - its own ramp names
  (`ember`/`orchid`/`blossom`/`dune` + status ramps), light + dark semantic mappings, and a
  `brand.config.json`. Ships in the package `files` so consumers can copy it.
- **Tests** (`packages/roots/brand.test.ts`) - build the example brand and assert: `:root` + `.dark`
  emitted; every Canopy semantic role mapped in both; AA passes for every pair in both themes;
  overrides reference brand primitives (never flat hex); and a broken brand FAILS the build.
- **Docs** - roots README (brand pipeline + runtime path), root README theming section, and
  `overview/{features,architecture}.md`.

### Out

- Any component change (none is needed - that is the point).
- A visual Storybook brand demo (the pipeline is build-time + headless-tested; a showcase can come
  later).
- Multi-brand runtime switching UI, density/compact modes, high-contrast brands.
- Publishing the example brand as its own package.

## Approach

- **Override by cascade, reference-aware.** A brand is the two-tier model again, authored by the
  consumer: NEW primitive ramps (any names) + semantic roles that reference them using CANOPY's role
  names. The light pass reuses `css/variables-with-roles` (with `outputReferences`) to emit brand
  primitives as literals and light roles as `var(--<brand-primitive>)` into `:root`. The dark pass
  reuses the generalized theme-overrides format to emit dark roles as `var(--<brand-primitive>)`
  into `.dark`. Imported after `tokens.css`, these blocks win by source order and re-point every
  role; since Canopy's Tailwind preset and utilities read the runtime vars, the whole UI re-themes.
- **Same guard, one definition.** Extract the WCAG math + pair list into `contrast.mjs`;
  `tokens.test.ts` imports it (proving core tokens with the exact same code) and `buildBrand()` runs
  it over the brand CSS. Coverage (every role mapped, dark differs, primitive-only references) is
  derived from Canopy's OWN shipped `dist/tokens.css` role set, so the brand contract never drifts
  from what Canopy actually ships. A brand that fails AA, leaves a role unmapped, or flat-hexes a
  dark value throws - it cannot ship green.
- **Renaming ramps sidesteps the DEFAULT trick.** Canopy needs `color.<status>.DEFAULT` because a
  status role collides with a same-named ramp. A brand names its ramps distinctly
  (`positive`/`caution`/...), so its status roles are plain leaves referencing those ramps - no
  DEFAULT gymnastics.
- **Style Dictionary as an optional peer.** The brand pipeline needs `style-dictionary` at build
  time; the core exports (typed tokens, CSS, preset) do not. So `style-dictionary` becomes an
  OPTIONAL `peerDependency` (already a devDependency for our own build) - a consumer pays for it
  only if they run the brand pipeline.
- **Example brand tuned for AA.** `sunset` uses distinct hues but ramp steps whose luminance tracks
  Canopy's, so every AA pair clears the same thresholds in both themes (verified by the test, not by
  hand). It is a demo/fixture, deliberately neutral - not a rogueoak brand.

## Acceptance

- [ ] `@rogueoak/roots/brand` exports `buildBrand()`; a `roots-brand` bin runs it from a config file.
- [ ] `buildBrand()` on the `sunset` example writes a `brand.css` with a `:root` block (brand
      primitives + light roles) and a `.dark` block (dark roles), all reference-aware.
- [ ] The pipeline reuses the core custom formats/transforms and the extracted AA guard; the core
      `tokens.test.ts` uses the same extracted `contrast.mjs`.
- [ ] `buildBrand()` FAILS the build when a role/state pair breaks AA in either theme, a semantic
      role is unmapped, or a dark override is a flat hex - each covered by a test.
- [ ] The `sunset` fixture maps EVERY Canopy semantic role and passes AA in light AND dark (tested).
- [ ] Canopy's own build/test/lint are unchanged and green (the theme-factory generalization is
      backward compatible).
- [ ] roots README documents the brand pipeline + the runtime path; root README theming section and
      `overview/{features,architecture}.md` updated; `0028` reflected.
