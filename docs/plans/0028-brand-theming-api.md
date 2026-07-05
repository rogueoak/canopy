# 0028 - Brand theming API (plan)

Source: `docs/specs/0028-brand-theming-api.md`.

## Steps

1. **Extract the AA guard** into `packages/roots/contrast.mjs`:
   - `srgbToLinear`, `luminance`, `contrast` (WCAG 2.1), verbatim from `tokens.test.ts`.
   - `AA_PAIRS` (the `[fg, bg, min]` role-pair list) moved verbatim.
   - `parseDecls(body)`, `extractBlock(css, selector)` (anchored selector match), `extractThemedRoles(css)`.
   - `checkBrandCss(css, { lightSelector, darkSelector, requiredRoles })` -> `{ failures, missingLight, missingDark }`.
   - Rewire `tokens.test.ts` to import `contrast`, `luminance`, `AA_PAIRS` (keep all existing assertions).

2. **Generalize the theme factory** in `style-dictionary.config.mjs`:
   - `export const cssTransforms`.
   - `registerThemeFormat(name, { selector })` - selector defaults to `.${name}`; comment de-hardcoded.
   - `themeConfig(name, glob, { include, buildPath, destination, selector })` - all default to Canopy's
     current values so `build.mjs`'s `themeConfig(name, glob)` is unchanged.

3. **`buildBrand()`** in `packages/roots/brand.mjs`:
   - Options: `{ name, primitives, semantic, semanticDark, outFile, scope }`.
   - Light pass (brand primitives + light semantics) -> `css/variables-with-roles` with
     `selector` = `:root` or `.<scope>`.
   - Dark pass via generalized `themeConfig` (include = brand primitives) -> `.dark` or `.<scope>.dark`.
   - Compose `brand.css` in ONE write (idempotent), sidecars removed in `finally`.
   - Validate with `checkBrandCss` against required roles read from the sibling `dist/tokens.css`;
     throw an aggregated error on any AA failure / missing role. (Flat-hex dark values already throw
     in the reused format.)
   - Return `{ outFile, css, roles, selectors }`.

4. **CLI** `packages/roots/cli.mjs` (`bin: roots-brand`): read config JSON, resolve paths relative to
   it, call `buildBrand`, print output path + role count.

5. **Example brand** `packages/roots/examples/sunset/`: `primitive.json` (ember/orchid/blossom/dune +
   positive/caution/critical/informative + base.white), `semantic.json`, `semantic.dark.json`,
   `brand.config.json`, short `README.md`. Ramp luminances tracked to Canopy's so AA passes; verify
   with a throwaway script, not by hand.

6. **package.json**: add `./brand` export, `bin`, `files` entries (brand.mjs, cli.mjs, contrast.mjs,
   style-dictionary.config.mjs, examples), and `style-dictionary` as an optional `peerDependency`.

7. **Tests** `packages/roots/brand.test.ts`: build the example to a temp dir; assert blocks, full role
   coverage, AA both themes, reference-awareness, brand ramp names; negative: an AA-breaking brand and
   a flat-hex dark both reject.

8. **Docs**: roots README (brand pipeline + runtime path), root README theming, `overview/features.md`
   + `overview/architecture.md`. No new learning unless review surfaces one.

## Verification

- `pnpm --filter @rogueoak/roots build` then `pnpm -w test`, `pnpm -w lint`, `pnpm -w build`, `pnpm
  format:check` - all green before commit.
