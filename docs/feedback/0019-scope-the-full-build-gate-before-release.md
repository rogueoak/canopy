# 0019 - A package-scoped lint/build gate misses Storybook - gate the full build

## Symptom

The fast inner-loop check gated only the component package (`turbo ... --filter @rogueoak/canopy`).
During the 1.0.0 build-out, several components changed shape and their **story files** in
`apps/storybook` drifted - a stale prop after an API change, a bad import, a hook in a `render`
callback. All of it passed the package-scoped gate green, because that filter never builds or lints
the Storybook app. The breakage only appeared when someone built Storybook locally or in the Pages
deploy - after the change had already merged.

## Root cause

`--filter @rogueoak/canopy` restricts the turbo run to one package's tasks. The Storybook app is a
**separate workspace package** that consumes canopy, so its lint/build is outside that filter. A
story file is a real consumer of the component API, but a package-scoped gate treats "the package is
green" as "everything is green" - and the app's build is exactly where a story-vs-component drift is
caught.

## Fix

- Make the pre-release (and CI) gate the **full** turbo build/lint/test across every package **and**
  app - `apps/storybook` included - not a package-scoped filter.
- Keep `--filter` for the fast inner-loop check only; never let it be the release gate.
- Treat `apps/storybook` as a first-class consumer whose build is part of "green," so a broken story
  blocks the merge, not the deploy.

## Learning

**Gate the whole workspace, not one package, before release.** A scoped filter is a speed tool for
the inner loop; used as the release gate it hides breakage in every workspace package it excludes -
here the Storybook app, canopy's own reference consumer. The gate that decides "safe to ship" must
run the same full build CI and the Pages deploy will run.
