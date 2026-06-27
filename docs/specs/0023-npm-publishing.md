# 0023 — npm publishing (tag-driven)

## Problem

Canopy is meant to ship as versioned npm packages under the `@rogueoak` scope
(`@rogueoak/roots`, `@rogueoak/canopy`), but publishing has been deliberately deferred
(see `overview/architecture.md`: "Actual `npm publish` stays off until a later spec").
Consumers outside this repo cannot install Canopy. This spec turns publishing on, driven by
**git tags**: a tag *is* the release.

## Outcome

- Pushing a tag `X.Y.Z` (bare SemVer, no `v` prefix — per trellis `rules/guidelines.md`) to
  the repo publishes **both** `@rogueoak/roots` and
  `@rogueoak/canopy` to the public npm registry at version `X.Y.Z` (**lockstep** — both
  packages always share the tag's version), in dependency order (roots before canopy).
- The tag is the single source of truth for the version; no version-bump PRs, no changesets.
- Published tarballs contain a **fresh** build (no stale `dist`) and each package renders a
  real README on its npm page.
- `@rogueoak/canopy`'s `workspace:*` dep on `@rogueoak/roots` is rewritten to the real
  published version on publish.

## Scope

**In**
- A GitHub Actions release workflow triggered on `push` of bare-SemVer tags (`X.Y.Z`, no
  `v`): it derives
  the version from the tag, stamps it into both packages, builds, and `pnpm -r publish`es.
- Removal of the Changesets tooling (`.changeset/`, `@changesets/cli` devDep, the root
  `changeset` script) — superseded by tag-driven releases.
- Package metadata needed to publish correctly: `publishConfig.access: public`,
  `repository`/`homepage`/`bugs` on both packages.
- A per-package `README.md` for `@rogueoak/roots` and `@rogueoak/canopy` (npm page content).
- A `prepublishOnly` clean-build guard so a stale `dist` can never ship.

**Out**
- npm org creation and configuring the trusted publisher (OIDC) on each package — account/
  registry actions the developer performs (documented below, not automated).
- Independent per-package versions — releases are lockstep by design.
- Automated changelogs — history lives in git tags / GitHub Releases; release notes are
  written by hand on the GitHub Release if desired.
- Publishing the private `@rogueoak/storybook` app (`pnpm -r publish` skips `private` packages).
- npm provenance / attestation (possible follow-up, not done here).
- Any change to component/token source or the build tooling itself.

## Approach

**Tag → version.** Repo `package.json` versions stay at a `0.0.0` placeholder; the real
version is injected at publish time from the tag, so the tag is unambiguously the source of
truth and there is no version-commit-back or bot write access to the repo. Tags are bare
SemVer with no `v` prefix (trellis `rules/guidelines.md`). To cut a release:
`git tag 0.1.0 && git push origin 0.1.0`.

**Release workflow** (`.github/workflows/release.yml`), `on: push: tags: ['[0-9]*.[0-9]*.[0-9]*']`,
job `permissions: id-token: write` (+`contents: read`):
1. checkout, pnpm + Node 24 (`actions/setup-node`, `cache: pnpm`, **no** `registry-url` — its
   `.npmrc` auth stub would block the OIDC exchange), `pnpm install --frozen-lockfile`.
2. `VERSION="$GITHUB_REF_NAME"` (the tag, used verbatim); validate it is semver.
3. Stamp version into both packages without git side effects:
   `pnpm -r --filter './packages/*' exec npm version "$VERSION" --no-git-tag-version
   --allow-same-version`.
4. `pnpm build` (clean — tsup `clean: true` rebuilds the currently-stale `canopy/dist`,
   including the `./twigs` subpath its `exports` already references).
5. `pnpm -r --filter './packages/*' publish --no-git-checks --access public`
   (`--no-git-checks` for the detached-HEAD tag checkout; pnpm rewrites `workspace:*` and
   skips private packages; roots publishes before canopy via the workspace dep graph).

**Auth — npm trusted publishing (OIDC), no `NPM_TOKEN`.** The job grants `id-token: write`;
npm verifies the run against each package's trusted-publisher config (repo + workflow filename
`release.yml`) and pnpm exchanges the OIDC token for a short-lived publish credential. Requires
pnpm ≥ the OIDC fix (pnpm/pnpm#11526; the pinned `pnpm@11.8.0` includes it, past the broken
11.0.8) on Node 24. Provenance is left out for now (see Out).

**Stale-dist guard.** `packages/canopy/dist` currently lacks the `./twigs` output its
`exports` map references; root cause is publishing without a rebuild. The workflow always
builds before publish, and each package gets `"prepublishOnly": "pnpm build"` so a manual
`pnpm publish` can't ship stale output either.

**Metadata.** Add to both `package.json`: `publishConfig.access: public`, and `repository`
(with `directory`), `homepage`, `bugs` pointing at the GitHub repo. Add a focused `README.md`
to each package (install, subpath exports, peer-dep/Tailwind setup); the root README stays the
monorepo overview.

**Trade-offs.** Lockstep means roots gets a version bump even when only canopy changed (and
vice-versa) — acceptable for a design system where tokens and components ship together, and it
keeps the tag-as-version model trivial. Dropping changesets loses generated changelogs; git
history + hand-written GitHub Release notes replace them.

**Developer-performed prerequisites (documented, not automated):**
1. Ensure the `@rogueoak` npm org exists and the publishing identity is a member.
2. Configure the trusted publisher on each package at `npmjs.com/package/<pkg>/access` —
   GitHub provider, this repo, workflow filename `release.yml`. (Trusted publishing can only
   be set on a package that already exists, so the first version is published manually.)

## Acceptance

- [ ] `.github/workflows/release.yml` triggers on bare-SemVer tags (`X.Y.Z`, no `v`), derives
      the version from the tag, stamps both packages, builds, and runs `pnpm -r publish` via
      OIDC trusted publishing (`permissions: id-token: write`, no `NPM_TOKEN`).
- [ ] Changesets tooling removed: no `.changeset/`, no `@changesets/cli` devDep, no root
      `changeset` script; `pnpm install` and `pnpm build` still pass.
- [ ] Both packages have `publishConfig.access: public`, `repository` (+`directory`),
      `homepage`, `bugs`, and a `prepublishOnly` clean-build script.
- [ ] `@rogueoak/roots` and `@rogueoak/canopy` each have a `README.md` included in their
      published tarball (verified via `pnpm --filter <pkg> pack --dry-run`).
- [ ] After a simulated stamp to `0.1.0`, `pnpm --filter @rogueoak/canopy pack --dry-run`
      shows `dist/twigs/index.js` present (fresh build) and version `0.1.0`, and canopy's
      roots dep resolves to `0.1.0` (not `workspace:*`) in the packed manifest.
- [ ] `overview/architecture.md` updated: publishing is on via tag-driven lockstep releases;
      the "stays off" note and the Changesets-versioning note removed/replaced.
- [ ] This spec documents the two developer-performed prerequisites (org membership,
      trusted-publisher config per package).
