# 0011 - Brand pipeline: omitted roles inherit Canopy defaults (partial brands)

A refinement of the brand theming API (spec 0028). Surfaced while adopting a brand in a real
consumer (matthewmaynes.com's "Harbor" theme), which re-points only `primary` + the neutral ramp
and deliberately inherits Canopy's accent / secondary / status roles.

## Symptom

`buildBrand()` required a brand to map **every** Canopy semantic role and threw
`unmapped in light: ...` otherwise. A consumer that wants to change only a few roles had two bad
options: re-declare (and freeze copies of) every ramp it actually wanted to inherit, or drop the
build-time AA guard and hand-write the `--color-*` overrides (the runtime path). The first is
verbose and silently pins the inherited roles to a snapshot; the second loses the guarantee.

The full-coverage rule also made **adding a role to Canopy a breaking change** for every downstream
brand - the next roots upgrade failed their build until they mapped the new role.

## Root cause

The pipeline treated "role not mapped" as "brand is incomplete -> fail". But `brand.css` is imported
AFTER `tokens.css`, so an unmapped role already falls back to Canopy's default **by cascade** - the
render is correct without the mapping. The only real risk is a *legibility* one: an override on one
side of a pair (say `primary`) combined with an inherited default on the other (`primary-foreground`)
could break AA. Coverage was standing in for a check that should have been about the effective pair.

## Fix

- `contrast.mjs` gains `resolveCanopyDefaults(tokensCss)` -> `{ light, dark }` maps of each themed
  role's resolved default hex, derived from Canopy's own shipped `dist/tokens.css` (same source as
  the required-role list, so it can't drift).
- `checkBrandCss` no longer treats missing roles as failures. It resolves each side of every
  `AA_PAIR` through **brand value if mapped, else the Canopy default**, and checks the resulting
  **effective** pair in both themes. `missingLight` / `missingDark` are still returned, now purely
  informational.
- `buildBrand` passes the defaults in, drops the unmapped-role errors from the fatal set (AA,
  copy-paste-identical-dark, and flat-hex-dark stay fatal), and returns
  `inherited: { light, dark }` so callers/CLI can report what fell back.

Net: a brand maps any subset it likes; whatever it omits inherits Canopy's default, and the AA
guarantee holds for the effective result. A brand that paints `primary` pale but omits
`primary-foreground` still fails the build (near-white default foreground on a pale fill). Adding a
role to Canopy is no longer breaking - the new role inherits its (already AA-verified) default.

## Tests

`brand.test.ts`: the "rejects an unmapped role" test is replaced by (a) a partial brand that omits
`secondary*` builds and emits only its mapped roles, reporting the rest as inherited, and (b) a
partial override that breaks AA against an inherited default (pale `primary`, omitted
`primary-foreground`) still fails with an AA error. A unit test covers `resolveCanopyDefaults`.
