# Plan 0023 — npm publishing (tag-driven)

Source spec: [`docs/specs/0023-npm-publishing.md`](../specs/0023-npm-publishing.md).

Tag-driven, lockstep release of `@rogueoak/roots` + `@rogueoak/canopy`. A bare-SemVer tag
(`X.Y.Z`, no `v` — trellis `rules/guidelines.md`) is the version; CI stamps both packages,
builds clean, and publishes. Changesets is removed.

## Steps

1. **Remove Changesets.**
   - Delete `.changeset/` (config.json).
   - Remove `@changesets/cli` devDep and the `"changeset": "changeset"` script from root
     `package.json`.
   - `pnpm install` to refresh `pnpm-lock.yaml`.
   - Verify: no `changeset` references remain outside historical `docs/specs/0002*`,
     `docs/plans/0002*` and this trail.

2. **Package metadata** (both `packages/roots` and `packages/canopy`):
   - Add `"publishConfig": { "access": "public" }`.
   - Add `"repository": { "type": "git", "url": "git+https://github.com/rogueoak/canopy.git",
     "directory": "packages/<pkg>" }`, `"homepage"`, `"bugs"`.
   - Add `"prepublishOnly": "pnpm build"` to scripts.

3. **Per-package READMEs** — `packages/roots/README.md`, `packages/canopy/README.md`:
   install, subpath exports (`.` / `./seeds` / `./twigs`; roots `.` / `./tokens.css` /
   `./tailwind-preset.css`), React peer-dep + Tailwind v4 setup. Keep concise; root README
   stays the monorepo overview.

4. **Release workflow** — `.github/workflows/release.yml`:
   - `on: push: tags: ['[0-9]*.[0-9]*.[0-9]*']`; job `permissions: id-token: write` +
     `contents: read` (OIDC trusted publishing).
   - checkout → `pnpm/action-setup` → `actions/setup-node` (node 24, `cache: pnpm`, **no**
     `registry-url` — the auth stub blocks OIDC) → `pnpm install --frozen-lockfile`.
   - Stamp: validate `$GITHUB_REF_NAME` is semver, then
     `pnpm -r --filter './packages/*' exec npm version "$GITHUB_REF_NAME"
     --no-git-tag-version --allow-same-version`.
   - `pnpm build`.
   - `pnpm -r --filter './packages/*' publish --no-git-checks --access public` — auth via OIDC
     (no `NODE_AUTH_TOKEN`/`NPM_TOKEN`).

5. **Reflect** — update `docs/overview/architecture.md` (publishing now on; tag-driven
   lockstep; remove "stays off" + Changesets-versioning notes) and `docs/overview/features.md`
   (CI/release capability). No `learnings.md` entry unless friction surfaces.

## Verification (before commit)

- `pnpm install` clean; `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check` green.
- Simulate a release locally to prove the tarballs:
  - `pnpm -r --filter './packages/*' exec npm version 0.1.0 --no-git-tag-version
    --allow-same-version` (in the worktree only — do **not** commit the bumped versions).
  - `pnpm build`.
  - `pnpm --filter @rogueoak/roots pack --dry-run` → README present, version `0.1.0`.
  - `pnpm --filter @rogueoak/canopy pack --dry-run` → README + `dist/twigs/index.js` present,
    version `0.1.0`, roots dep resolved to `0.1.0` (not `workspace:*`).
  - Revert the version bumps (`git checkout packages/*/package.json`) so committed versions
    stay `0.0.0`.
- `grep -rn changeset .github package.json packages` returns nothing.

## Out of scope / developer-performed

npm org membership, the trusted-publisher config per package, independent versions, changelogs,
provenance.
