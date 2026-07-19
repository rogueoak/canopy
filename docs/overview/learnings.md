# Learnings

Non-obvious lessons discovered while building.

## Always have working software and working docs

Documentation must never outrun what actually works. The README is specced **first** (0001)
and every subsequent spec carries a "README updated" acceptance item, so docs and software
advance together. Forward-looking examples are allowed only when clearly labelled _(planned)_
 - never presented as if they work today.

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
*references* - only the built-in `css/variables` preserves them (via `outputReferences`).
With a single flat sample token this looks fine and ships green; it would first break in 0004
when semantic→primitive references and the `.dark` remap arrive - the exact theming seam the
skeleton exists to prove. Fix: reference-aware custom formats, with `tokens.css` as the single
owner of runtime `:root` vars and the Tailwind preset using `@theme inline` to reference them.
See [`docs/feedback/0001-token-reference-seam.md`](../feedback/0001-token-reference-seam.md).

**Apply it:** never prove a seam with degenerate input (a flat token, an empty list). Use
input that actually exercises the mechanism - here, a token that references another - and add
a test that asserts the mechanism survives into every generated output.

## A Style Dictionary token can't share a path with a group (the `.DEFAULT` fix)

A functional colour is naturally both a **ramp** (`color.success.50…950`) and a single
**semantic role** (`color.success`). Authoring the role as `color.success` with a `$value`
collides with the `color.success` group node: SD merges them, treats the node as one token,
and **silently drops the ramp children** - `--color-success-600` vanishes and `--color-success`
resolves to the raw `{color.success.600}` string (build stays green; output is wrong). Fix: put
the role at `color.success.DEFAULT` (a sibling leaf, no clash) and a custom `name`-type
transform that strips a trailing `-default`, so it still emits `--color-success` (→ `bg-success`)
alongside the ramp. Brand roles avoid this naturally by using a *different* name from their ramp
(`color.primary` → `color.moss.600`).

**Apply it:** a DTCG node is either a token or a group, never both. When a name must be both a
scale and a single default, use the `DEFAULT` leaf + a name transform - don't put a value on a
group node.

## Ship the semantic/composite tier, not just the primitives under it

When a spec scopes a **semantic or composite token tier** (here: text roles `text-h2`/`text-body`
composed from the size/weight/leading primitives), verify that tier is actually *delivered* - not
just the primitives. The 0003 build emitted only the type primitives, so components would have
re-derived heading/body styling by hand, leaking the two-tier boundary that held for colour. In
Tailwind v4 a composite text role is a `--text-<role>` font-size with **companion vars**
(`--text-<role>--line-height` / `--font-weight` / `--letter-spacing`, double-dash); our
single-dash kebab pipeline can't produce them, so the SD format expands DTCG `typography`
composites itself - kept reference-aware (companions are `var(--primitive)`, never literals).

**Apply it:** check the *highest* tier a spec names is present in the built output, and prove a
composite expands correctly by grepping the built CSS for the whole rule (`.text-h2 { font-size;
line-height; font-weight }`), not just the base var.

## Guard cross-cutting a11y criteria with executable tests, and validate a role for all its uses

WCAG AA was "verified" by a hand-typed ratio table in a Storybook story, decoupled from the token
hexes - a ramp edit (exactly what 0004's dark remap does) keeps the table reading "AA" while real
contrast drops below 4.5:1. Replaced with a **computed** test that resolves each semantic role to
its real primitive hex (following the typed export's `var(--…)` references) and computes the WCAG
ratio. It immediately caught that `accent` (amber.500) is only **2.83:1** on `bg` - fine as a fill
but failing as a foreground - because the table had only validated the fill use. Fix: add
`accent-strong` (amber.700, **6.15:1**) for foreground accent, keep `accent` as fill.

**Apply it:** never guard a cross-cutting acceptance criterion (contrast, a11y) with a
hand-maintained table - compute it from the real token values in a test. And validate a colour
role for **all** its uses (fill *and* foreground), not just one.

## Guard the full token surface, test visual depth, and make composed build outputs idempotent

The 0004 contrast guard covered base role pairs but **not the interaction-state tokens**
(`*-hover`, `*-active`) - exactly the surfaces a Button renders its foreground on. A near-black
`.950` foreground on a too-dark hover/active step shipped green: light `accent-hover` (amber.600)
was 3.79:1 and dark `secondary-active` (bark.500) 3.77:1, both below AA, undetected because the
test only checked base roles. Worse, **visual depth is invisible to text-contrast checks**: dark
`border` mapped to `stone-800` - identical to `surface-raised` - a literal **1.0:1 hairline** that
every text-AA assertion happily ignores. And `build.mjs` composed `tokens.css` by *appending* the
`.dark` sidecar, only safe because `clean` ran first; a standalone/watch run double-appended, and
a throw between append and cleanup left a stale sidecar + half-themed file. Finally the Storybook
contrast table was light-only hardcoded strings that didn't flip with `.dark`.

Fixes: extend the both-theme guard to foreground-on-`hover`/`-active` (nudging the two failing
state steps - accent-hover *lightens* since its fg is near-black, secondary-active lifts to
bark-200); `disabled` stays excluded **with a comment** (WCAG exempts disabled controls); lift
dark `border`→`stone-700`/`border-strong`→`stone-600` for a visible step; rewrite the build as a
**single `writeFileSync` of light + theme blocks** (pure function of inputs → idempotent) inside
`try/finally`; and make the story compute ratios **live per theme** from resolved CSS vars.

**Apply it:** guard the **whole token surface a component will touch** (states, not just base
roles), in every theme. Test **visual depth** (border-vs-surface separation), not only text
legibility - a 1.0:1 border passes every contrast check. Composed build artifacts should be
**pure functions of their inputs** (single write, idempotent), never in-place appends, with
`try/finally` cleanup. And living-doc tables must be **computed**, never hardcoded, or they drift.

## Tailwind v4 emits utilities only for class names it sees as literal strings

Tailwind v4 generates utilities by scanning source for **literal** class strings. A story that
builds class names dynamically - `` className={`rounded-${r}`} `` over an array - produces no
CSS for those utilities (the build succeeds; `.rounded-md` just never exists). Fix: carry the
full literal class name in the data (`['md', 'rounded-md']`) so the scanner sees it. (A plain
literal array like `['p-1','p-4']` *is* seen, because each element is a literal string.)

**Apply it:** when verifying that a token category generates a utility, grep the built CSS for
the exact rule; and in iterating UI, keep class names literal, not interpolated.

## Self-hosting fonts: Roots ships names, consumers ship bytes

Roots emits only the font *family* tokens (`--font-sans: Figtree, …`). The actual @font-face
declarations come from `@fontsource-variable/*` packages the **consumer** installs and imports
once in global CSS - so the token package has no binary assets and no CDN dependency. Storybook
is itself a consumer (imports them in `.storybook/tailwind.css`); the built `storybook-static`
bundles the `.woff2` files, which is how you verify the font actually loads.

## Storybook under pnpm needs a hoist pattern

Storybook's preset loader resolves modules (e.g. `@storybook/react-vite/preset`) from the
project root, which breaks under pnpm's isolated node_modules - `storybook build` dies with
`Cannot find module '@storybook/react-vite/preset'`. Fix: add `.npmrc` with
`public-hoist-pattern[]=*storybook*` (and `@storybook/*`) so Storybook packages are hoisted
where the loader looks.

## Components ship class names; the consumer's Tailwind build emits the CSS

Canopy's distribution model (spec 0005, Decision A - "Tailwind-source") is that components ship
`className` strings, **not** a prebuilt stylesheet. The utilities only exist once a Tailwind v4
build **scans canopy's source** and emits them - so every consumer (Storybook included) must add
`@source` pointing at `@rogueoak/canopy` alongside the roots preset import. Forget it and
components render **unstyled** with no error - nothing fails, the classes are just absent.

**Apply it:** the `@source` line is part of the public wiring, not an internal detail - document
it in the README and treat Storybook's `.storybook/tailwind.css` as the reference consumer setup.
Verify styling by grepping the built `storybook-static` CSS for the component's utilities (e.g.
`bg-primary{background-color:var(--color-primary)}`); their presence proves the seam end-to-end
without a browser.

## The component recipe: cva literals + cn() + Slot

The first Seed (Button) locks the pattern later atoms copy: `cva` maps `variant` × `size` to
**full literal** token-utility strings (the Tailwind-scanner constraint applies inside cva too - 
never interpolate a class name), `cn()` (`clsx` + `tailwind-merge`) merges them with the caller's
`className` so the caller always wins, and Radix `Slot` powers `asChild` for polymorphism. Style
**only** with semantic tokens - no palette, no `dark:` on the common path - so light/dark stays a
property of the token layer and the component never knows its theme.

## Guard interaction-state tokens for within-theme distinctness

A role's hover/active fills must differ from its **base within the same theme** - and the AA
+ dark-coverage guards did not check that. Dark `danger-hover` was left equal to dark `danger`
(both `danger.300`), so the destructive button's hover was invisible in dark, yet every test
passed: the contrast guard only checks legibility, the coverage guard only checks dark differs
from light (feedback 0004). A swatch grid renders each token alone, so the collision is
invisible there too - only the first interactive component using the role revealed it.

**Apply it:** when adding any `-hover`/`-active` interaction token, assert base/hover/active
resolve to distinct hexes in *each* theme (added to `tokens.test.ts`). And expect the first
real component to exercise a role to surface token gaps the Foundations stories cannot - treat
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
font-weight (`text-label`, `text-h2`, …) - they share the `text-` prefix with colour utilities
(`text-text`, `text-danger`) but target different CSS properties, so in the browser a role and a
colour happily coexist. `tailwind-merge`, however, doesn't know the custom role values, so it
misclassifies a role like `text-label` into its `text-color` group; when `cn('text-label text-text')`
runs, the two "conflict" and one is **silently dropped before it ever reaches the DOM** (last one
wins). Button never tripped this because it never pairs a role with a colour on one element; Label
(`text-label … text-text`) is the first, and its render came out without its font-size.

**Apply it:** `cn()` (`src/lib/cn.ts`) now uses `extendTailwindMerge` to register every Roots role
in the `font-size` group, so a role and a colour are orthogonal - a Seed can carry both, and a
caller can still override either axis independently (`className="text-danger"` swaps the colour and
keeps the role; `text-h2` swaps the role and keeps the colour). Fixed once in the shared util, so
every Seed inherits it. The lesson generalises: when a design-token namespace overloads a Tailwind
prefix (`text-`, `bg-`, …) with a meaning tailwind-merge can't infer, teach the merge - don't work
around it per component.

## Empty component-prop types: alias vs interface

The choice between `type` alias and `interface` for a Seed's props is not stylistic - it's forced
by `react/prop-types`. A Seed **with** cva variants extends `NativeAttrs & VariantProps<…>` (a
non-empty type - fine either way). A Seed whose props are exactly a Radix Root's props uses a
`type` alias (`type X = React.ComponentPropsWithoutRef<typeof Root>`). But a Seed with **no** extra
props and no variants (Textarea) genuinely needs an empty `interface X extends NativeAttrs {}`,
because `react/prop-types` only resolves the spread-prop members through an interface's `extends` - 
a `type` alias there breaks prop-types resolution. That empty interface trips
`@typescript-eslint/no-empty-object-type`; the minimal correct fix is a **line-scoped
`eslint-disable` with a rationale comment**, not a rewrite to a `type` alias.

**Apply it:** pick by need - variants → extend a non-empty type; props == a Radix Root's props →
`type` alias; no props and no variants → empty `interface … extends NativeAttrs {}` + a
line-scoped `eslint-disable` explaining the prop-types constraint.

## Disabled styling is per-control-kind, not one global rule

Two disabled treatments coexist by design. **Fields** (Input, Textarea, the Select trigger) use the
`bg-disabled` / `text-disabled-foreground` **token pair** - an empty field has no fill to preserve,
so a flat muted surface reads best. **Toggle controls that can be checked** (Checkbox, Switch,
RadioGroupItem) use `disabled:opacity-50` + `cursor-not-allowed` instead - a disabled-but-checked
control must stay visibly *filled* (its `primary` fill), and the token pair would flatten that to a
neutral surface and lose the on/off signal. The Roots `disabled` token note explicitly sanctions
opacity for controls that merely dim.

**Apply it:** choose the disabled treatment by whether a **filled/checked** state must survive
disabling - yes → `opacity-50` + `cursor-not-allowed`; no (an empty field) → the
`bg-disabled` / `text-disabled-foreground` pair.

## Use `React.ComponentRef`, not the deprecated `React.ElementRef`

`React.ElementRef` is deprecated in React 19.2. New Radix-based Seeds should type their forwarded
ref with `React.ComponentRef<typeof X>` (the drop-in replacement) rather than
`React.ElementRef<typeof X>`. The consistency sweep is now **done** - every Seed uses
`React.ComponentRef`; the five older Batch 1 Seeds that still used `ElementRef` (Label, Switch,
Checkbox, RadioGroup, Select) were converted in the Seeds-layer closeout (a type-only change - both
resolve to the same element type, so behaviour and tests are unchanged).

**Apply it:** in any new `forwardRef` over a Radix primitive, write
`React.forwardRef<React.ComponentRef<typeof X>, …>`; don't copy `ElementRef` from the older Seeds.

## A "one step up" interaction fill is surface-relative

A `muted` hover/highlight that lightens correctly on the base canvas can **invert** on a *raised*
surface in the opposite theme: on a `surface-raised` popover in dark, base `muted` (stone.900) is
darker than the surface (stone.800), so a "focus" fill *recedes* instead of lifting - the same one
token reading as a highlight in light and a recess in dark (feedback 0006, surfaced by Select, the
first portalled Seed). Model the raised-surface highlight **explicitly** rather than reusing base
`muted`: `color-muted-raised` steps toward the foreground on `surface-raised` in BOTH themes
(stone.100 in light, stone.700 - lighter than surface-raised - in dark), guarded by a new
`text` × `muted-raised` AA pair. (The elevation-shadow half of 0006 - dark popovers reading as
lifted - stays open; the dark border carries the lift for now, no shadow token yet.)

**Apply it:** when a hover/highlight fill will appear on more than one surface elevation, don't
assume "one step up" is the same lightness direction everywhere - give the raised surface its own
token (`color-muted-raised`) and add an AA pair for the foreground that renders on it. Fix it at the
token layer the first time a portalled component needs it, so later portalled Seeds inherit it.

## Portalled / raised surfaces are their own design context

Content that floats on `surface-raised` - popovers, menus, tooltips - is a distinct styling context,
not just "the page with a shadow," and the same three needs recurred across **Select + Tooltip +
Skeleton**. (1) **Fills must use the raised-surface tokens:** an item highlight or a placeholder fill
reaches for `muted-raised`, not base `muted`, because base `muted` collapses to `surface` in dark
(stone.900 = the dark surface), so a highlight *recedes* and a skeleton goes *invisible* on a card.
(2) **The 1px `border` carries the lift, not the shadow:** `shadow-md` reads weakly in dark, so the
hairline `border border-border` is what visually separates the raised card from the canvas (there is
no semantic elevation token yet). (3) **Portals still theme correctly:** because `.dark` lives on
`<html>`, a Radix portal mounted under `<body>` (Select / Tooltip content) inherits the theme, so the
common-path semantic utilities just work - no per-portal theme wiring.

**Apply it:** when building any future portalled component, reach for `surface-raised` + `border`
(for the lift) + `muted-raised` (for any item-highlight / placeholder fill) from the start; don't
reuse base `muted` or lean on a shadow for elevation. (The `ElementRef`→`ComponentRef` sweep is now
done too - the earlier learning's "pending sweep" caveat is resolved.)

## A Twig wires Seeds without the Seeds knowing - context + Slot

The composition layer (Twigs) needs to add cross-cutting wiring (a shared id, `aria-describedby`,
`aria-invalid`, a disabled state) across several atoms **without** pushing that knowledge down into
the atoms - a Seed must stay a context-free, drop-in element. Two primitives solve this together and
became the Twigs recipe (FormField, 0020): a small React **context** on the compound's root owns the
shared state, and a Radix **`Slot`** part injects the wiring onto whatever single control child the
consumer passes. So `FormFieldControl` makes an Input, a Textarea, a Select trigger, or a Checkbox a
fully-wired field by merging props onto it - none of those Seeds import or depend on FormField. The
**reverse import is forbidden**: twigs import seeds, never the other way, which is what keeps the
layer boundary (and the `./twigs` vs `./seeds` subpaths) honest.

A second, subtler lesson from the same build: **derive ARIA from what is actually rendered, not from
props.** `aria-describedby` must list the description / message ids only when those parts exist, so
the parts **register their presence** via a mount/unmount effect and the control composes the
attribute from the live flags. Driving it off props instead ("there is a `description` prop, so point
at its id") silently lies the moment a part is conditionally rendered.

**Apply it:** for any future Twig that coordinates atoms, put the shared state in a root context and
inject onto children with `Slot`; keep atoms ignorant of the composition. When the coordination is an
ARIA relationship, register the real parts and build the attribute from them - never infer DOM that
might not be there. And debts a Seed defers upward (Label 0007 left the disabled-label affordance "to
a FormField Twig") are collected here, at the composition layer, where the context to honour them
finally exists. (Card reuses the raised-surface tokens from the portalled-surfaces learning above.)

## State in a Storybook story lives in a component, not the `render` callback

A story that needs `useState` (a controlled-field demo) must put it in a **top-level component**
and render that - `render: (args) => <ControlledExample {...args} />` - not call the hook inside
the `render` arrow. A `render` body is not a React component (lowercase, not a hook), so the
Rules of Hooks lint rejects a hook there even though Storybook happens to invoke `render` like a
component, so it "works" at runtime. SearchBar's `WithValue` story (0021) shipped the hook inline
and put `main` in a red-lint state (feedback 0007).

**Apply it:** any story needing state gets a named component; keep the `render` callback a thin
`(args) => <Example {...args} />`. And the process half - wire CI (`build`/`test`/`lint`/
`format:check`) as a **required** status check so a red `main` can't happen: a failing lint
should block the merge, not be discovered a spec later.

## A control outside a Branch's subtree can't use its context - decouple it and own focus-return

SideNav's mobile drawer (0026) is opened by a `SideNavTrigger` that, in a real app shell, lives in
the **top bar** - a *sibling* of `<SideNav>`, not a descendant. So it cannot read SideNav's React
context (context only flows down): a trigger that called `useSideNavContext()` threw
"must be used within a <SideNav>", and there is no common ancestor to hoist a provider onto without
inventing a wrapper component the spec didn't ask for. The fix is to **decouple the trigger**: the
consumer already owns the drawer's `open` state (it passes `open`/`onOpenChange` to SideNav), so the
trigger is a presentational Button the consumer wires (`onClick` to open, `aria-expanded`/
`aria-controls` for the disclosure), and SideNav coordinates `aria-controls` via a shared `id`.

That breaks Radix Dialog's **return-focus**, though: Radix restores focus to its `DialogTrigger`'s
ref, and there is no DialogTrigger here (the opener is an unrelated sibling) - Radix's
`onCloseAutoFocus` unconditionally `preventDefault()`s and focuses a null trigger ref, so focus is
lost to `<body>` and `FocusScope`'s own restore is suppressed. Recover it **without** a trigger ref:
capture the opener in the content's **`onOpenAutoFocus`** (which fires while `document.activeElement`
is *still* the element that opened the dialog, before focus moves in), then restore it in
`onCloseAutoFocus` (`preventDefault()` + `opener.focus()`). This returns focus to whatever opened the
drawer with zero coupling to the trigger.

Two more SideNav points worth keeping: (1) pick the responsive wrapper in **JS** (a `useIsMobile()`
matchMedia hook), not by rendering both a desktop and a mobile form behind `md:` visibility
utilities - that keeps the `<nav aria-label>` **landmark single** (no duplicated landmark, no
doubled `aria-current`). (2) Radix `aria-hidden`s the background while a modal is open, so a query
like `getByRole('button', { name: 'Open navigation' })` can't find the (now hidden) trigger after
opening - assert on the **captured node reference** instead, which React still updates in place.

**Apply it:** when a Branch's control must sit outside the Branch's DOM subtree, don't force a
context onto it - decouple it (consumer-wired) and have the Branch own any side effects that the
missing context would have carried (here, focus-return via `onOpenAutoFocus`/`onCloseAutoFocus`).
Render responsive variants single-landmark via a JS breakpoint hook, and remember a Radix modal
hides its background from role queries.

## Animation/motion utilities ship from the preset, not `@source`

Canopy's distribution seam (Decision A) is that components ship `className` strings and the
**consumer's** Tailwind build emits the CSS by scanning canopy's source via `@source`. That seam
generates *utilities* - but `@source` only emits a class where it sees that class **used as a literal
string**. A component's keyframed motion is **not** a utility: `@keyframes` and a `@theme {
--animate-*: … }` block are **theme declarations**, and the scanner can never synthesize them. So
Dialog's `animate-dialog-*` motion (0024) couldn't ride the `@source` seam the way its `bg-surface-raised`
/ focus-ring utilities do. Parked in Storybook's `tailwind.css`, it animated in Storybook but left a
real consumer with **dead `animate-dialog-*` classes and no motion** - and no error, since an undefined
`animate-*` utility is silently not emitted (feedback 0008). Fix: ship the keyframes + `--animate-*`
vars from the Roots **`tailwind-preset.css`** - the file every consumer already imports (the same way
`tokens.css` owns runtime `:root` vars) - folded in from a `preset-motion.css` partial by `build.mjs`
in an idempotent single write. Compose the existing `--duration-*` / `--ease-*` tokens
(`dialog-overlay-in var(--duration-slow) var(--ease-decelerate)`), never hardcoded ms/easing, so motion
stays token-driven; and guard the built preset (grep the rule) so the motion can't silently vanish again.

**Apply it:** when a component needs keyframed motion, deliver the `@keyframes` + `@theme --animate-*`
from CSS **every consumer imports** (the Roots preset), not from component source or a single app's CSS
 - `@source` can't emit theme declarations. Compose the Roots motion tokens rather than hardcoding, and
add a built-preset assertion that the keyframes + token-composed animate value ship.

## A multi-form component's public surface must land on the same conceptual element in every form

A Branch that renders **two structurally different forms** (SideNav: a desktop `<aside>` rail and a
mobile Radix drawer) has to choose, *per branch*, which element a caller's `ref` / `className` /
`{...props}` attach to - and SideNav's two branches drifted. The props landed on the `<aside>` on
desktop but on the inner `<nav>` on mobile, so a consumer styling "the rail" had their `className`
applied to the styled panel on desktop and to an unstyled inner wrapper below the breakpoint - 
**silently** (nothing errors; the class is just on the wrong element). The fix routes the public
surface to the **styled panel** in both forms (the `<aside>`, and `DialogPrimitive.Content` on mobile,
merging `className` into the drawer classes), with the `<nav aria-label>` a static landmark wrapper in
both; the forwarded ref is documented as the rail panel (an `<aside>` on desktop, the drawer `div` on
mobile, `null` while the drawer is closed). See
[`docs/feedback/0009-sidenav-review-gaps.md`](../feedback/0009-sidenav-review-gaps.md).

**Apply it:** when a component forks into more than one render shape, deliberately pick the **same
conceptual element** (the styled panel) as the `ref`/`className`/native-prop surface in *every* branch,
and keep them in lockstep - otherwise a caller's `className` targets different things across states. A
desktop ref/className test passes while the mobile surface is wrong, so assert the surface in each form.

## Test the a11y behaviour, not its scaffolding

SideNav's headline collapsed-rail promise is "an icon-only item still surfaces its label, via a
Tooltip on hover/focus." The tests asserted only the **`sr-only`** half (the label survives in the
accessible name) - the actual Tooltip behaviour (focus the collapsed item → its label appears in a
`role="tooltip"`) was never exercised, so the marquee a11y feature could have regressed with every
test still green. A passing `sr-only` assertion *looks* like coverage but proves only that a hidden
node exists, not that the label becomes perceivable. The fix adds a test that focuses a collapsed
`SideNavItem` and asserts `findByRole('tooltip')` resolves with the label text.

**Apply it:** guard a component's headline accessibility promise with a test of the **observable
outcome** (a `role="tooltip"` appears on focus, focus returns to the trigger on close), not of the
scaffolding that enables it (an `sr-only` node exists). Write the test that would **fail if the promise
broke** - not the one that passes because a hidden element is present.

## A re-export package's dependency floor is part of its contract

`@rogueoak/icons` (0027) re-exports curated names from `react-icons` (`LuHouse as Home`,
`FaXTwitter as X`, …). Those upstream symbols are **renamed and added across versions** (Lucide
churns names; `FaXTwitter` only exists in recent FA6), so the curated names are only valid against a
new-enough `react-icons`. The package shipped with a `^5.4.0` floor while the verified names needed
`5.6.0`: a consumer (or a dedupe) that resolves an **older** `5.4.x` gets `undefined` for a missing
re-export - and because a missing named import is `undefined`, not a type error, it compiles, ships,
and only fails at **render** (`Element type is invalid`). Caught in review by the architect persona,
not by the build. Fix: raise the floor to the version the names were verified against (`^5.6.0`).

The matching test lesson (tester persona): a count-based check (`length >= 40` + a few `toContain`s)
does **not** guard the headline "no `Lu*`/`Fa*` prefix leaks" promise - a forgotten `as` alias would
leak a raw name and the count still holds. Guard a curated **surface** with an assertion over its
*shape* (no name matches a family-prefix regex) plus an explicit list of promised names, so a rename
or a leak fails loudly.

**Apply it:** when a package's value *is* a curated re-export of another, treat the upstream **version
floor as a contract** - pin it to the version the curated names were verified against, never lower,
because a too-low floor fails silently at runtime (missing named export → `undefined` → render-time
crash), invisible to types and the build. And test the curated surface's **shape** (prefix-leak guard
+ promised-name list), not just its size.

## A public API option must consume its value, and a fixture must not let two params share one

The brand pipeline's `buildBrand({ scope })` (spec 0028) documented `scope` as the CSS class to scope
a brand to, but the code derived the selector from `slugify(name)` and used `scope` only as a truthy
flag - so `{ name: 'My Brand', scope: 'acme' }` emitted `.my-brand`, not `.acme`. Both the engineer
and architect personas caught it; the shipped test **masked** it because the only fixture passed the
SAME string (`'sunset'`) for `name` and `scope`, so reading the wrong source still looked right
(feedback 0010). Two more gaps rode along: `buildBrand` **wrote `brand.css` before validating**, so a
failed build left an invalid file on disk (against its own "can't ship a broken brand" contract), and
the new pipeline didn't **port the core's copy-paste guard** (dark must differ from light, from
feedback 0004), so a brand whose dark file is a copy of its light file passed every check yet renders
the light palette in dark.

**Apply it:** when an API option carries a *value* (not just an on/off), make the code consume that
value, and test it with a value **distinct from every sibling parameter** - two params sharing a
value in the only fixture hides one being ignored. Validate an artifact **before** you write it, so a
failed run leaves nothing shippable. And when a new pipeline re-states a guarantee the core already
guards (AA, dark≠light, coverage), **port the guard** - a parallel surface does not inherit it.

## `aria-hidden` hides the whole subtree - never nest an `sr-only` label inside it

`BreadcrumbEllipsis` (spec 0029) wrapped an `sr-only` "More" label in a `<span aria-hidden="true">`,
so the label reached **nobody**: `sr-only` hides it from sighted users, and the ancestor
`aria-hidden` prunes the entire subtree (label included) from the accessibility tree. It looked
accessible - a real `sr-only` label was right there - but announced nothing, contradicting the spec's
"still describable" intent. `sr-only` (hide visually, keep for AT) and `aria-hidden` (hide from AT,
keep visually) are **opposites**; nesting them with the label inside cancels it out. The bug rode in
because the pattern was copied from `BreadcrumbSeparator` - which is *genuinely* fully decorative -
without re-asking whether the ellipsis carries meaning it doesn't (it does: "there are collapsed
crumbs"). The shipped test asserted only `toHaveClass('sr-only')` (scaffolding), so it stayed green
regardless of reachability - the same failure mode as "test the a11y behaviour, not its scaffolding"
above. Caught by the engineer + tester personas.

**Apply it:** when an element has a **decorative glyph inside a meaningful element** (an icon in an
ellipsis, a chevron in a labelled control), put `aria-hidden` on the **glyph only**, never the
wrapper that carries the label. Never place an `sr-only` node inside an `aria-hidden` ancestor. And
test the **observable** outcome - the label has no `aria-hidden` ancestor / is exposed in the
accessibility tree - not that an `sr-only` class exists.

## A component's tier is its interaction class, not the component it resembles

`Combobox` (spec 0030) was specced and built in the **Seeds** tier next to `Select`, because it
looks like Select - a field that opens a list. The architect persona caught it as a layer
violation: it imports the `Badge` Seed (a Seed importing a Seed breaks the one-way "twigs import
seeds, never the reverse" rule), owns real interaction state, and portals its content. Select is a
Seed for the opposite reason - Radix owns *all* its state (zero `useState`) and it composes nothing;
Combobox hand-rolls open/search/selection state, portals, and composes Badge. It is Branch-shaped
(like `Dialog`, a Branch precisely because it "owns interaction state and/or a portal") and was
moved to `branches/`. See [`docs/feedback/0013-combobox-tier-placement.md`](../feedback/0013-combobox-tier-placement.md).

**Apply it:** decide a component's tier at **spec time** by its interaction class against the
`architecture.md` definitions - owns interaction state and/or a portal, or composes another
Seed/Twig => at least a Twig, and a stateful/portalled one is a Branch - **regardless** of which
existing component it visually resembles. Surface resemblance (Combobox ~ Select) is not tier
kinship.

## Interactive components: keyboard operation and controlled mode are first-class tests

Combobox's first suite (spec 0030) covered the mouse happy path well but left two spec-mandated
paths untested: keyboard navigation (arrow/enter/escape, asserted only via `click`) and
**controlled** mode (every test uncontrolled, so the `isControlled` branch never ran - though every
story used a controlled `value`). Both are distinct code branches with distinct failure modes,
invisible if you only click and only pass `defaultValue`. Caught by the tester persona. See
[`docs/feedback/0014-interactive-component-test-coverage.md`](../feedback/0014-interactive-component-test-coverage.md).

**Apply it:** for any interactive Seed/Twig/Branch, bake two cases into the test plan up front -
drive it by **keyboard** in at least one test (not just `click`), and if it supports both controlled
and uncontrolled use, test **both** (controlled: the display follows the `value` prop, and
`onValueChange` fires without the display changing until the parent updates). Don't let an
acceptance item be satisfied by the easiest interaction that superficially passes.

## Test every shipped variant and every acceptance property, not a representative sample

Spec 0033 shipped five `animate-*` presets but first tested only the `-in` halves, and listed
"the fold stays idempotent" in Acceptance with no test enforcing it - a dropped `-out` preset or a
regressed double-append would both have stayed green, because a `toContain` assertion passes on the
correct AND the doubled/partial output. Caught by the tester + engineer personas. See
[`docs/feedback/0015-assert-every-shipped-variant-and-acceptance-property.md`](../feedback/0015-assert-every-shipped-variant-and-acceptance-property.md).

**Apply it:** when a change ships a set of variants (preset pairs, token families), assert **every**
member with a per-variant loop, not a hand-picked one - and check composition/value, not mere
presence. When an acceptance item names a property (idempotency, single-occurrence, ordering),
encode the test that **fails** if it regresses (e.g. an occurrence-count guard), because a
presence check can't see a duplicate. This recurs with
[keyboard/controlled coverage (0014)](../feedback/0014-interactive-component-test-coverage.md): the
shared root is testing the happy representative instead of the whole contract.

## A shipped component must not bake in a consumer's transport or analytics - inject them

`SubscribeForm` (spec 0035) consolidated two app copies whose only real divergence was
**app-specific coupling**: each imported PostHog directly, hard-coded a `/v1/subscribe` `fetch`, and
carried its own event names + copy. A design-system component can't own any of that - a different
consumer has a different endpoint, a different (or no) analytics SDK, and different wording. The fix
is **injection**: Canopy owns the UI, the `submit/success/error` state machine, the optional-Name
reveal, the honeypot, and the a11y wiring, while the consumer passes `onSubscribe(values) =>
Promise<void>` (the network I/O) and an optional `onEvent(phase, props)` (analytics). To preserve the
fidelity the apps had when they owned the `fetch`, the contract carries the failure detail *back out*:
`onSubscribe` rejects, and Canopy shows the rejected error's `.message` and forwards its `.reason` to
`onEvent('failed', ...)` - so `http_500` / `network` reasons and per-app messages survive without
Canopy knowing any HTTP. Copy is defaulted props (`title`/`successMessage`/...), so each app
reproduces its exact wording. The component also stayed **icon-free** (a hand-rolled `currentColor`
check SVG, the Dialog-close precedent) to keep Canopy's no-`@rogueoak/icons`-dependency invariant.

**Apply it:** when a component would otherwise `import` a specific analytics SDK, `fetch` a specific
endpoint, or hard-code one consumer's copy, **invert it** - take an async `on*` handler for the I/O
and an optional event callback for analytics, and pass failure detail back out (reject with a
`.message` + a machine `.reason`) rather than resolving a status the component has to interpret. The
design system ships behaviour, state, and a11y; the app ships transport, analytics, and words. And
what moves into the shared component is the *duplicated UI*, not the app-specific server core - here
the Constant Contact `subscribe.ts` (secrets-adjacent, per-app list handling) deliberately stayed in
each app.

## Verify motion in flight, not at rest

The Storybook motion page (0034) shipped a first pass where the easing track clipped
`spring-strong`'s overshoot and a "hover to play" affordance was a dead CSS no-op - both passed a
build and a full-page screenshot, because a settled screenshot captures the REST state and the
overshoot had already returned in-bounds by capture time. Caught by review. See
[`docs/feedback/0016-verify-motion-in-flight-not-at-rest.md`](../feedback/0016-verify-motion-in-flight-not-at-rest.md).

**Apply it:** a static screenshot proves layout, not animation - it cannot see clipping, overshoot,
or a mid-flight glitch. For any spring/overshoot demo, size the stage for the **peak** (compute
`travel x max-bezier-y`, add clearance) and prove the extreme is in-bounds by frame-sampling the
live animation or freezing at the computed peak. Never ship a motion affordance you have not
watched fire (a CSS `:hover` re-declaring an identical `animation-name` restarts nothing).

## Form controls must default to >=16px on mobile (iOS auto-zoom)

iOS Safari auto-zooms the page when a focused `<input>`/`<textarea>`/`<select>` has a computed
font-size below 16px. `Input`, `Textarea`, and the `Select` trigger all shipped `text-sm` (14px), so
every consumer hit the zoom on phones - surfaced downstream on rogueoak.com, then fixed at the source
(feedback 0017), not per-app.

**Apply it:** a focusable form control's mobile font-size must be >=16px. Default the field controls
to `text-base md:text-sm` (16px on phones, 14px from `md` up) rather than a bare `text-sm`; a
design-system default is a stronger guarantee than asking each consumer to override. This is a
platform rule, not an aesthetic choice - verify the computed size, and remember `md` (width) is the
right proxy since iOS zoom is a small-viewport phone behavior.

## Never `union`-merge structured TS/JSON - it corrupts barrels and manifests

Git's `union` merge driver resolves a conflict by keeping **both** sides' lines. On prose that is
harmless; on a **multi-line structured block** it is corruption. Merging two branches that both add
exports to a barrel produced a broken `index.ts`: the `union` driver kept both branches' bodies but
**dropped the `export {` opener** of one block (the shared opening line collapsed to one copy while
the two bodies concatenated), and on a JSON manifest it **duplicated keys**. Both "merged" files
were syntactically broken yet looked plausible in a diff. During the 1.0.0 build-out, many parallel
branches each touched the three tier barrels (`seeds` / `twigs` / `branches` `index.ts`) and
`package.json`, so this hit repeatedly.

**Apply it:** do **not** put a `union` merge driver (or any auto-both-sides strategy) on structured
files - TS barrels, JSON manifests, lockfiles. Resolve barrel and manifest conflicts **explicitly**
(take both entries, but keep exactly one `export {` / one JSON key each), and after any merge that
touched a barrel or a `package.json`, build once - a dropped `export {` or a duplicate key fails the
parse immediately, where a diff read will not. See
[`docs/feedback/0018-union-merge-corrupts-structured-files.md`](../feedback/0018-union-merge-corrupts-structured-files.md).

## A package-scoped gate misses the Storybook app - gate the FULL turbo build before release

Running the lint/build gate scoped to one package (`--filter @rogueoak/canopy`) is fast, but it does
**not** build or lint the Storybook app, so a broken story file - a bad import, a hook in a `render`
callback, a stale prop after a component's API changed - ships green through the package-scoped gate
and only fails when someone builds Storybook (or in the Pages deploy). During the build-out, several
components changed and their story files drifted, invisible to `--filter @rogueoak/canopy`.

**Apply it:** the pre-release (and CI) gate must be the **full** `turbo` build/lint/test across every
package **and** app (`apps/storybook` included), not a package-scoped filter - the storybook app is a
first-class consumer and its build is part of "green." Use `--filter` only for a fast inner-loop
check, never as the release gate. See
[`docs/feedback/0019-scope-the-full-build-gate-before-release.md`](../feedback/0019-scope-the-full-build-gate-before-release.md).

## Do not assert a third-party library's browser internals in jsdom - test your own mapping

Several 1.0.0 Branches wrap a third-party behavioural library (cmdk, vaul, embla, recharts,
react-day-picker). Tests that asserted **the library's own** caret position, text selection, or
computed layout were **flaky** under jsdom, which under-models focus, selection, and layout - the
assertions passed or failed on jsdom's approximation, not on real behaviour, so they broke
intermittently while proving nothing about our code.

**Apply it:** in jsdom, assert the **observable mapping you own** - the props you pass in, the
callbacks you fire, the ARIA/classes you render, the data you transform - not the wrapped library's
internal caret/selection/layout state. Trust the library's own suite for its internals; if you must
verify real browser behaviour (focus, selection, motion), do it in a real browser, not jsdom.

## Any coloured fill pairs with its `text-<fill>-foreground` token, never `text-text`

A component that paints a coloured fill (`bg-primary`, `bg-danger`, a status fill on a Toast / Alert
/ Badge) must set its text to the **matching foreground token** (`text-primary-foreground`,
`text-danger-foreground`, ...), which the token layer guarantees meets AA against that fill in both
themes. Reaching for the generic body colour `text-text` instead breaks contrast: `text-text` is
tuned for the page surface, not for a saturated coloured fill, and there is no AA guard for that
pairing - so it can read fine in one theme and fail in the other.

**Apply it:** whenever you set a `bg-<role>` fill, set the paired `text-<role>-foreground` in the
same class string - never `text-text` on a coloured fill. The foreground tokens exist precisely so
the contrast is AA-verified; using the body colour opts out of that guarantee silently.

## An API-preserving refactor can silently regress focus and motion - verify the outcome, not the tests

Rebuilding a component onto a new primitive while keeping its public API (Combobox onto Command,
SideNav / ResponsiveDialog onto the vaul-backed Drawer, TopNav onto NavigationMenu - specs
0066/0067/0069) is tempting to gate on "the existing tests still pass." But the existing tests were
written against the **old** primitive's behaviour, and jsdom under-models exactly what the swap can
break: **focus** (vaul's `autoFocus`/focus-return differs from the Radix dialog SideNav previously
used) and **motion** (a new primitive brings its own, or per-direction, keyframes, so a drawer can
lose its slide or animate the wrong axis). Both regress with every test still green, because the
suite asserts the old mechanics or asserts nothing about focus/motion at all.

**Apply it:** when refactoring onto a new primitive under a preserved API, don't stop at "old tests
pass." Verify the **a11y and motion outcomes** the component promises - focus lands and returns where
it should (asserted on a captured node, since jsdom/Radix hide the background from role queries), and
the motion fires in the right direction - adding tests for those outcomes if the old suite lacked
them. A preserved API is not a preserved experience; jsdom's under-modelling of focus makes "tests
still pass" a weak signal for precisely the properties a primitive swap threatens.

## A CSS-heavy library's skin ships as a stylesheet of ROLE tokens, so brand overrides apply

Most Canopy component styling ships as `className` strings the consumer's Tailwind build emits by
scanning canopy source (`@source`). But a library that renders its **own** DOM with its **own**
structural classes - video.js's `.vjs-*` control bar (Video, 0070) - defeats that seam entirely: the
scanner only emits utilities it sees as literal strings in canopy's source, and those `.vjs-*`
classes exist only at video.js runtime. This is the same shape as "motion ships from the preset, not
`@source`": CSS the scanner can't synthesise (keyframes, `@theme` declarations, a third-party lib's
structural classes) must ship from a **file the consumer imports**. So Video ships Canopy's first
component stylesheet, `@rogueoak/canopy/video.css` (a new package export + `files` entry, imported
after the library's own base CSS so it overrides).

The load-bearing rule is **what that stylesheet may reference**: only Canopy's semantic **role** vars
(`--color-primary`, `--color-surface-raised`, `--color-ring`, ...), never a primitive ramp step
(`--color-moss-600`) and never a hardcoded value (no hex, no `rgba()` literal - translucency is
`color-mix(... transparent)` over a role var so the mix still tracks the role). Because the role vars
are the exact seam `.dark` and a consumer brand (`buildBrand()`, spec 0028, or a runtime `:root`
override) re-point, a skin built on role vars themes light/dark AND **adopts a consumer's brand
override for free** - the same guarantee every token-styled component gives, extended to a
third-party lib's chrome. A hex or a primitive ramp would silently opt the player out of the
consumer's brand (and out of dark), invisibly.

**Apply it:** when wrapping a library that ships/needs its own CSS, don't try to force its skin
through `@source` - ship a stylesheet the consumer imports, and author it against **role** tokens
only. Guard the file with a test that rejects hex / `rgba()` / `.dark` / primitive-ramp vars and
asserts every colour var is a known overridable role - that test IS the proof that a brand override
(and dark) reach the wrapped controls, which jsdom can't verify at runtime (no `var()`/`color-mix`
resolution). And lazy-load a heavy player lib via a dynamic `import()` so, with `sideEffects: false`,
it code-splits into its own chunk and a consumer who never renders it ships none of it.

## Theme only Canopy surfaces - content over media needs a theme-invariant treatment

The Video skin (0070) coloured video.js caption cue text with the *inverted* role
(`--color-text-inverted`), so in dark theme captions rendered near-black over a dark video frame -
illegible (designer persona, feedback 0020). Captions don't sit on a Canopy surface; they float over
the **video layer**, whose colour is arbitrary and theme-independent. A semantic role token assumes a
known Canopy background behind the text, and the inverted role assumes the opposite surface - neither
is true over media, so "flip with the theme" is actively wrong there.

**Apply it:** a semantic role/`text-*` token is correct only for content on a **known Canopy
surface**. Content drawn over **media or an arbitrary background** (video captions, a label over an
image/video) needs a **self-contained, theme-invariant** treatment - its own contrasting box (the
library's default white-on-black cue box is fine) - never a role token, and never the inverted role,
which inverts to match a surface that isn't there. When skinning a third-party player/canvas, ask per
element "what is actually behind this?" before reaching for a token.

## A validity guard must also prove the load-bearing value is present, not just allowed

The Video skin's brand-override guard (0070) asserted every `var(--color-*)` in `video.css` *is* a
role token (no hex/`.dark`/primitive) - necessary, but a skin that accented everything with
`--color-surface`/`--color-text` and never used `--color-primary` would pass in full while a
consumer's brand accent override stayed invisible (tester persona, feedback 0021). "All X are valid"
is silent on whether the one X the feature depends on is present.

**Apply it:** when a guard asserts a *validity* property over a set ("every var is a role", "every
export is prefixed", "no forbidden value appears"), pair it with a *presence/use* assertion for the
load-bearing member (`expect(refs).toContain('primary')`) - the value that makes the promise work must
be shown to be **there**, not merely **allowed**. This is the dual of "test every shipped variant, not
a representative sample": a whole-set validity check can pass vacuously on a degenerate set that drops
the element the promise hinges on.
