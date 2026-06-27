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

## Guard the full token surface, test visual depth, and make composed build outputs idempotent

The 0004 contrast guard covered base role pairs but **not the interaction-state tokens**
(`*-hover`, `*-active`) — exactly the surfaces a Button renders its foreground on. A near-black
`.950` foreground on a too-dark hover/active step shipped green: light `accent-hover` (amber.600)
was 3.79:1 and dark `secondary-active` (bark.500) 3.77:1, both below AA, undetected because the
test only checked base roles. Worse, **visual depth is invisible to text-contrast checks**: dark
`border` mapped to `stone-800` — identical to `surface-raised` — a literal **1.0:1 hairline** that
every text-AA assertion happily ignores. And `build.mjs` composed `tokens.css` by *appending* the
`.dark` sidecar, only safe because `clean` ran first; a standalone/watch run double-appended, and
a throw between append and cleanup left a stale sidecar + half-themed file. Finally the Storybook
contrast table was light-only hardcoded strings that didn't flip with `.dark`.

Fixes: extend the both-theme guard to foreground-on-`hover`/`-active` (nudging the two failing
state steps — accent-hover *lightens* since its fg is near-black, secondary-active lifts to
bark-200); `disabled` stays excluded **with a comment** (WCAG exempts disabled controls); lift
dark `border`→`stone-700`/`border-strong`→`stone-600` for a visible step; rewrite the build as a
**single `writeFileSync` of light + theme blocks** (pure function of inputs → idempotent) inside
`try/finally`; and make the story compute ratios **live per theme** from resolved CSS vars.

**Apply it:** guard the **whole token surface a component will touch** (states, not just base
roles), in every theme. Test **visual depth** (border-vs-surface separation), not only text
legibility — a 1.0:1 border passes every contrast check. Composed build artifacts should be
**pure functions of their inputs** (single write, idempotent), never in-place appends, with
`try/finally` cleanup. And living-doc tables must be **computed**, never hardcoded, or they drift.

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

## Components ship class names; the consumer's Tailwind build emits the CSS

Canopy's distribution model (spec 0005, Decision A — "Tailwind-source") is that components ship
`className` strings, **not** a prebuilt stylesheet. The utilities only exist once a Tailwind v4
build **scans canopy's source** and emits them — so every consumer (Storybook included) must add
`@source` pointing at `@rogueoak/canopy` alongside the roots preset import. Forget it and
components render **unstyled** with no error — nothing fails, the classes are just absent.

**Apply it:** the `@source` line is part of the public wiring, not an internal detail — document
it in the README and treat Storybook's `.storybook/tailwind.css` as the reference consumer setup.
Verify styling by grepping the built `storybook-static` CSS for the component's utilities (e.g.
`bg-primary{background-color:var(--color-primary)}`); their presence proves the seam end-to-end
without a browser.

## The component recipe: cva literals + cn() + Slot

The first Seed (Button) locks the pattern later atoms copy: `cva` maps `variant` × `size` to
**full literal** token-utility strings (the Tailwind-scanner constraint applies inside cva too —
never interpolate a class name), `cn()` (`clsx` + `tailwind-merge`) merges them with the caller's
`className` so the caller always wins, and Radix `Slot` powers `asChild` for polymorphism. Style
**only** with semantic tokens — no palette, no `dark:` on the common path — so light/dark stays a
property of the token layer and the component never knows its theme.

## Guard interaction-state tokens for within-theme distinctness

A role's hover/active fills must differ from its **base within the same theme** — and the AA
+ dark-coverage guards did not check that. Dark `danger-hover` was left equal to dark `danger`
(both `danger.300`), so the destructive button's hover was invisible in dark, yet every test
passed: the contrast guard only checks legibility, the coverage guard only checks dark differs
from light (feedback 0004). A swatch grid renders each token alone, so the collision is
invisible there too — only the first interactive component using the role revealed it.

**Apply it:** when adding any `-hover`/`-active` interaction token, assert base/hover/active
resolve to distinct hexes in *each* theme (added to `tokens.test.ts`). And expect the first
real component to exercise a role to surface token gaps the Foundations stories cannot — treat
that component as the token layer's true acceptance test, and fix gaps at the token layer (so
every component inherits the fix) rather than patching the component.

## Drive component state from native ARIA attributes, not a bespoke prop

Input's invalid state is the native `aria-invalid` attribute styled through Tailwind v4's
`aria-invalid:` variant (`aria-invalid:border-danger aria-invalid:ring-danger`) rather than a
custom `invalid` boolean. The accessible attribute *is* the styling trigger, so the two can
never drift, the caller uses a standard form a11y attribute, and no extra prop or effect is
needed. Verified the variant compiles by grepping the built CSS for the escaped selector
`.aria-invalid\:border-danger` (Tailwind v4 escapes `:` as `\:`), so `aria-[invalid=true]:`
was not needed. Prefer this attribute-driven pattern for future state-bearing Seeds.

## Native HTML attribute names can collide with cva variant names

`React.InputHTMLAttributes<HTMLInputElement>` already declares `size` (the numeric HTML input
attribute), which clashes with the recipe's `size` cva variant. Resolve by omitting the native
name so the variant owns it: `Omit<React.InputHTMLAttributes<…>, 'size'> & VariantProps<…>`.
Watch for the same collision on any future Seed whose variant reuses a native attribute name.

## Teach `cn()` about Roots typography roles (the role-vs-colour merge collision)

The Roots typography **roles** are composite `text-*` utilities that set font-size / line-height /
font-weight (`text-label`, `text-h2`, …) — they share the `text-` prefix with colour utilities
(`text-text`, `text-danger`) but target different CSS properties, so in the browser a role and a
colour happily coexist. `tailwind-merge`, however, doesn't know the custom role values, so it
misclassifies a role like `text-label` into its `text-color` group; when `cn('text-label text-text')`
runs, the two "conflict" and one is **silently dropped before it ever reaches the DOM** (last one
wins). Button never tripped this because it never pairs a role with a colour on one element; Label
(`text-label … text-text`) is the first, and its render came out without its font-size.

**Apply it:** `cn()` (`src/lib/cn.ts`) now uses `extendTailwindMerge` to register every Roots role
in the `font-size` group, so a role and a colour are orthogonal — a Seed can carry both, and a
caller can still override either axis independently (`className="text-danger"` swaps the colour and
keeps the role; `text-h2` swaps the role and keeps the colour). Fixed once in the shared util, so
every Seed inherits it. The lesson generalises: when a design-token namespace overloads a Tailwind
prefix (`text-`, `bg-`, …) with a meaning tailwind-merge can't infer, teach the merge — don't work
around it per component.

## Empty component-prop types: alias vs interface

The choice between `type` alias and `interface` for a Seed's props is not stylistic — it's forced
by `react/prop-types`. A Seed **with** cva variants extends `NativeAttrs & VariantProps<…>` (a
non-empty type — fine either way). A Seed whose props are exactly a Radix Root's props uses a
`type` alias (`type X = React.ComponentPropsWithoutRef<typeof Root>`). But a Seed with **no** extra
props and no variants (Textarea) genuinely needs an empty `interface X extends NativeAttrs {}`,
because `react/prop-types` only resolves the spread-prop members through an interface's `extends` —
a `type` alias there breaks prop-types resolution. That empty interface trips
`@typescript-eslint/no-empty-object-type`; the minimal correct fix is a **line-scoped
`eslint-disable` with a rationale comment**, not a rewrite to a `type` alias.

**Apply it:** pick by need — variants → extend a non-empty type; props == a Radix Root's props →
`type` alias; no props and no variants → empty `interface … extends NativeAttrs {}` + a
line-scoped `eslint-disable` explaining the prop-types constraint.

## Disabled styling is per-control-kind, not one global rule

Two disabled treatments coexist by design. **Fields** (Input, Textarea, the Select trigger) use the
`bg-disabled` / `text-disabled-foreground` **token pair** — an empty field has no fill to preserve,
so a flat muted surface reads best. **Toggle controls that can be checked** (Checkbox, Switch,
RadioGroupItem) use `disabled:opacity-50` + `cursor-not-allowed` instead — a disabled-but-checked
control must stay visibly *filled* (its `primary` fill), and the token pair would flatten that to a
neutral surface and lose the on/off signal. The Roots `disabled` token note explicitly sanctions
opacity for controls that merely dim.

**Apply it:** choose the disabled treatment by whether a **filled/checked** state must survive
disabling — yes → `opacity-50` + `cursor-not-allowed`; no (an empty field) → the
`bg-disabled` / `text-disabled-foreground` pair.

## Use `React.ComponentRef`, not the deprecated `React.ElementRef`

`React.ElementRef` is deprecated in React 19.2. New Radix-based Seeds should type their forwarded
ref with `React.ComponentRef<typeof X>` (the drop-in replacement) rather than
`React.ElementRef<typeof X>`. The consistency sweep is now **done** — every Seed uses
`React.ComponentRef`; the five older Batch 1 Seeds that still used `ElementRef` (Label, Switch,
Checkbox, RadioGroup, Select) were converted in the Seeds-layer closeout (a type-only change — both
resolve to the same element type, so behaviour and tests are unchanged).

**Apply it:** in any new `forwardRef` over a Radix primitive, write
`React.forwardRef<React.ComponentRef<typeof X>, …>`; don't copy `ElementRef` from the older Seeds.

## A "one step up" interaction fill is surface-relative

A `muted` hover/highlight that lightens correctly on the base canvas can **invert** on a *raised*
surface in the opposite theme: on a `surface-raised` popover in dark, base `muted` (stone.900) is
darker than the surface (stone.800), so a "focus" fill *recedes* instead of lifting — the same one
token reading as a highlight in light and a recess in dark (feedback 0006, surfaced by Select, the
first portalled Seed). Model the raised-surface highlight **explicitly** rather than reusing base
`muted`: `color-muted-raised` steps toward the foreground on `surface-raised` in BOTH themes
(stone.100 in light, stone.700 — lighter than surface-raised — in dark), guarded by a new
`text` × `muted-raised` AA pair. (The elevation-shadow half of 0006 — dark popovers reading as
lifted — stays open; the dark border carries the lift for now, no shadow token yet.)

**Apply it:** when a hover/highlight fill will appear on more than one surface elevation, don't
assume "one step up" is the same lightness direction everywhere — give the raised surface its own
token (`color-muted-raised`) and add an AA pair for the foreground that renders on it. Fix it at the
token layer the first time a portalled component needs it, so later portalled Seeds inherit it.

## Portalled / raised surfaces are their own design context

Content that floats on `surface-raised` — popovers, menus, tooltips — is a distinct styling context,
not just "the page with a shadow," and the same three needs recurred across **Select + Tooltip +
Skeleton**. (1) **Fills must use the raised-surface tokens:** an item highlight or a placeholder fill
reaches for `muted-raised`, not base `muted`, because base `muted` collapses to `surface` in dark
(stone.900 = the dark surface), so a highlight *recedes* and a skeleton goes *invisible* on a card.
(2) **The 1px `border` carries the lift, not the shadow:** `shadow-md` reads weakly in dark, so the
hairline `border border-border` is what visually separates the raised card from the canvas (there is
no semantic elevation token yet). (3) **Portals still theme correctly:** because `.dark` lives on
`<html>`, a Radix portal mounted under `<body>` (Select / Tooltip content) inherits the theme, so the
common-path semantic utilities just work — no per-portal theme wiring.

**Apply it:** when building any future portalled component, reach for `surface-raised` + `border`
(for the lift) + `muted-raised` (for any item-highlight / placeholder fill) from the start; don't
reuse base `muted` or lean on a shadow for elevation. (The `ElementRef`→`ComponentRef` sweep is now
done too — the earlier learning's "pending sweep" caveat is resolved.)

## A Twig wires Seeds without the Seeds knowing — context + Slot

The composition layer (Twigs) needs to add cross-cutting wiring (a shared id, `aria-describedby`,
`aria-invalid`, a disabled state) across several atoms **without** pushing that knowledge down into
the atoms — a Seed must stay a context-free, drop-in element. Two primitives solve this together and
became the Twigs recipe (FormField, 0020): a small React **context** on the compound's root owns the
shared state, and a Radix **`Slot`** part injects the wiring onto whatever single control child the
consumer passes. So `FormFieldControl` makes an Input, a Textarea, a Select trigger, or a Checkbox a
fully-wired field by merging props onto it — none of those Seeds import or depend on FormField. The
**reverse import is forbidden**: twigs import seeds, never the other way, which is what keeps the
layer boundary (and the `./twigs` vs `./seeds` subpaths) honest.

A second, subtler lesson from the same build: **derive ARIA from what is actually rendered, not from
props.** `aria-describedby` must list the description / message ids only when those parts exist, so
the parts **register their presence** via a mount/unmount effect and the control composes the
attribute from the live flags. Driving it off props instead ("there is a `description` prop, so point
at its id") silently lies the moment a part is conditionally rendered.

**Apply it:** for any future Twig that coordinates atoms, put the shared state in a root context and
inject onto children with `Slot`; keep atoms ignorant of the composition. When the coordination is an
ARIA relationship, register the real parts and build the attribute from them — never infer DOM that
might not be there. And debts a Seed defers upward (Label 0007 left the disabled-label affordance "to
a FormField Twig") are collected here, at the composition layer, where the context to honour them
finally exists. (Card reuses the raised-surface tokens from the portalled-surfaces learning above.)

## State in a Storybook story lives in a component, not the `render` callback

A story that needs `useState` (a controlled-field demo) must put it in a **top-level component**
and render that — `render: (args) => <ControlledExample {...args} />` — not call the hook inside
the `render` arrow. A `render` body is not a React component (lowercase, not a hook), so the
Rules of Hooks lint rejects a hook there even though Storybook happens to invoke `render` like a
component, so it "works" at runtime. SearchBar's `WithValue` story (0021) shipped the hook inline
and put `main` in a red-lint state (feedback 0007).

**Apply it:** any story needing state gets a named component; keep the `render` callback a thin
`(args) => <Example {...args} />`. And the process half — wire CI (`build`/`test`/`lint`/
`format:check`) as a **required** status check so a red `main` can't happen: a failing lint
should block the merge, not be discovered a spec later.
