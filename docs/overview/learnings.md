# Learnings

Non-obvious lessons discovered while building.

## Always have working software and working docs

Documentation must never outrun what actually works. The README is specced **first** (0001)
and every subsequent spec carries a "README updated" acceptance item, so docs and software
advance together. Forward-looking examples are allowed only when clearly labelled _(planned)_
— never presented as if they work today.

**Apply it:** when a build adds real capability, update the README (and these living docs) in
the same change to match reality. Don't leave aspirational snippets unmarked.

## pnpm 11 build approval lives in `pnpm-workspace.yaml`, not `package.json`

pnpm 11 blocks dependency build scripts (esbuild, style-dictionary, …) until approved, and
on each install it **rewrites `pnpm-workspace.yaml`** to inject an `allowBuilds:` block with
placeholder string values (`set this to true or false`). The fix is to set those values to
boolean `true` in that file. The old `pnpm.onlyBuiltDependencies` field in `package.json` is
**ignored** in pnpm 11 (it warns and drops it). Symptom if unresolved: `style-dictionary
build` fails because pnpm's pre-run dep check (`pnpm install`) exits non-zero on every build.

## Token-build formats must honor references, and seams need exercising input

Custom Style Dictionary formats that emit a token's resolved `$value` silently flatten token
*references* — only the built-in `css/variables` preserves them (via `outputReferences`).
With a single flat sample token this looks fine and ships green; it would first break in 0004
when semantic→primitive references and the `.dark` remap arrive — the exact theming seam the
skeleton exists to prove. Fix: reference-aware custom formats, with `tokens.css` as the single
owner of runtime `:root` vars and the Tailwind preset using `@theme inline` to reference them.
See [`docs/feedback/0001-token-reference-seam.md`](../feedback/0001-token-reference-seam.md).

**Apply it:** never prove a seam with degenerate input (a flat token, an empty list). Use
input that actually exercises the mechanism — here, a token that references another — and add
a test that asserts the mechanism survives into every generated output.

## A Style Dictionary token can't share a path with a group (the `.DEFAULT` fix)

A functional colour is naturally both a **ramp** (`color.success.50…950`) and a single
**semantic role** (`color.success`). Authoring the role as `color.success` with a `$value`
collides with the `color.success` group node: SD merges them, treats the node as one token,
and **silently drops the ramp children** — `--color-success-600` vanishes and `--color-success`
resolves to the raw `{color.success.600}` string (build stays green; output is wrong). Fix: put
the role at `color.success.DEFAULT` (a sibling leaf, no clash) and a custom `name`-type
transform that strips a trailing `-default`, so it still emits `--color-success` (→ `bg-success`)
alongside the ramp. Brand roles avoid this naturally by using a *different* name from their ramp
(`color.primary` → `color.moss.600`).

**Apply it:** a DTCG node is either a token or a group, never both. When a name must be both a
scale and a single default, use the `DEFAULT` leaf + a name transform — don't put a value on a
group node.

## Ship the semantic/composite tier, not just the primitives under it

When a spec scopes a **semantic or composite token tier** (here: text roles `text-h2`/`text-body`
composed from the size/weight/leading primitives), verify that tier is actually *delivered* — not
just the primitives. The 0003 build emitted only the type primitives, so components would have
re-derived heading/body styling by hand, leaking the two-tier boundary that held for colour. In
Tailwind v4 a composite text role is a `--text-<role>` font-size with **companion vars**
(`--text-<role>--line-height` / `--font-weight` / `--letter-spacing`, double-dash); our
single-dash kebab pipeline can't produce them, so the SD format expands DTCG `typography`
composites itself — kept reference-aware (companions are `var(--primitive)`, never literals).

**Apply it:** check the *highest* tier a spec names is present in the built output, and prove a
composite expands correctly by grepping the built CSS for the whole rule (`.text-h2 { font-size;
line-height; font-weight }`), not just the base var.

## Guard cross-cutting a11y criteria with executable tests, and validate a role for all its uses

WCAG AA was "verified" by a hand-typed ratio table in a Storybook story, decoupled from the token
hexes — a ramp edit (exactly what 0004's dark remap does) keeps the table reading "AA" while real
contrast drops below 4.5:1. Replaced with a **computed** test that resolves each semantic role to
its real primitive hex (following the typed export's `var(--…)` references) and computes the WCAG
ratio. It immediately caught that `accent` (amber.500) is only **2.83:1** on `bg` — fine as a fill
but failing as a foreground — because the table had only validated the fill use. Fix: add
`accent-strong` (amber.700, **6.15:1**) for foreground accent, keep `accent` as fill.

**Apply it:** never guard a cross-cutting acceptance criterion (contrast, a11y) with a
hand-maintained table — compute it from the real token values in a test. And validate a colour
role for **all** its uses (fill *and* foreground), not just one.

## Tailwind v4 emits utilities only for class names it sees as literal strings

Tailwind v4 generates utilities by scanning source for **literal** class strings. A story that
builds class names dynamically — `` className={`rounded-${r}`} `` over an array — produces no
CSS for those utilities (the build succeeds; `.rounded-md` just never exists). Fix: carry the
full literal class name in the data (`['md', 'rounded-md']`) so the scanner sees it. (A plain
literal array like `['p-1','p-4']` *is* seen, because each element is a literal string.)

**Apply it:** when verifying that a token category generates a utility, grep the built CSS for
the exact rule; and in iterating UI, keep class names literal, not interpolated.

## Self-hosting fonts: Roots ships names, consumers ship bytes

Roots emits only the font *family* tokens (`--font-sans: Figtree, …`). The actual @font-face
declarations come from `@fontsource-variable/*` packages the **consumer** installs and imports
once in global CSS — so the token package has no binary assets and no CDN dependency. Storybook
is itself a consumer (imports them in `.storybook/tailwind.css`); the built `storybook-static`
bundles the `.woff2` files, which is how you verify the font actually loads.

## Storybook under pnpm needs a hoist pattern

Storybook's preset loader resolves modules (e.g. `@storybook/react-vite/preset`) from the
project root, which breaks under pnpm's isolated node_modules — `storybook build` dies with
`Cannot find module '@storybook/react-vite/preset'`. Fix: add `.npmrc` with
`public-hoist-pattern[]=*storybook*` (and `@storybook/*`) so Storybook packages are hoisted
where the loader looks.
