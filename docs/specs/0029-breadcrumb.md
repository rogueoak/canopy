# 0029 - Breadcrumb

## Problem

Add the **Breadcrumb** Twig - the trail-of-ancestors navigation molecule that shows a user
where the current page sits in a hierarchy and lets them step back up it (`Home / Docs /
Components / Breadcrumb`). It is a common app-shell affordance that pairs with the navigation
Branches already shipped (TopNav [0025](0025-top-nav.md), SideNav [0026](0026-side-nav.md)) but
is a far simpler, **stateless, presentational** piece of markup.

API-shaped after shadcn's Base UI Breadcrumb
(https://ui.shadcn.com/docs/components/base/breadcrumb), retargeted onto Canopy's tokens, recipe,
and `asChild` polymorphism convention.

Independently shippable: one composition, one PR. Follows the [0020](0020-form-field.md) Twigs
recipe - a compound component on semantic tokens, adds no token, no new dependency.

### Layer decision (Twig, not Branch)

Breadcrumb renders a `<nav>` landmark like the two navigation **Branches**, but the layer split
in this repo is by **interaction class, not domain**: a Branch "additionally owns interaction
state and (often) a portal" (Dialog's open/close, TopNav's disclosure, SideNav's collapse +
drawer). Breadcrumb owns **no state and no portal** - it is pure, static, presentational
structure. That is exactly the **Card** precedent (0022): a structural compound Twig. So
Breadcrumb ships as a **Twig** on `@rogueoak/canopy/twigs`, consistent with the recipe's stated
boundary, and is called out here because a reader might otherwise expect a nav component under
`./branches`.

## Outcome

- `@rogueoak/canopy/twigs` exports a themed `Breadcrumb` family.
- A semantic, accessible breadcrumb trail: a `<nav aria-label="breadcrumb">` wrapping an ordered
  list of links, a marked current page, and separators between items - with an optional collapsed
  ellipsis for long trails.
- Router-agnostic: `BreadcrumbLink` takes `asChild` (Radix `Slot`) so a consumer's `<a>` or
  router `<Link>` carries the styling, exactly as `TopNavLink`/`CardTitle` do.
- Stories (basic trail · custom separator · collapsed-with-ellipsis · `asChild` router link ·
  both themes) and tests (structure, `aria-current`, separator/ellipsis a11y, `asChild`, `cn()`
  merge, ref forwarding).
- Storybook **Twigs** section updated with a `Twigs/Breadcrumb` entry.

## Scope

### In

A presentational compound, each part a small `forwardRef` element that spreads native props and
merges `className` via `cn()`, styled with **semantic tokens only** (no palette, no `dark:`, no
new token) - light/dark flips through the token layer (0004). All Tailwind classes are **full
literal strings** so the v4 scanner emits them.

- **`Breadcrumb`** (root) - renders `<nav aria-label="breadcrumb">` (label overridable via native
  props). The landmark wrapper.
- **`BreadcrumbList`** - renders `<ol>`; a wrapping `flex items-center` row with a gap, muted
  `text-body-sm`.
- **`BreadcrumbItem`** - renders `<li>`; an inline `flex items-center` group.
- **`BreadcrumbLink`** - the interactive ancestor link. Renders `<a>` by default, or the single
  child via `asChild` (Radix `Slot`) so a router `<Link>` is styled without nesting an anchor.
  Muted (`text-text-muted`) with `hover:text-text` and the shared focus-visible ring.
- **`BreadcrumbPage`** - the current page (non-interactive). Renders a `<span>` with
  `role="link"`, `aria-disabled="true"`, and **`aria-current="page"`** (the accessibility hook
  that marks "you are here"), in the un-muted `text-text` with normal weight.
- **`BreadcrumbSeparator`** - the divider between items. Renders `<li role="presentation"
  aria-hidden="true">` (decorative, skipped by assistive tech) holding a **default chevron**
  (inline `currentColor` SVG, hand-rolled - no icon dependency, matching Dialog's close X /
  Checkbox's tick), overridable by passing `children` (e.g. a `/`).
- **`BreadcrumbEllipsis`** - the collapsed-trail affordance. Renders a `<span
  role="presentation" aria-hidden="true">` with an inline horizontal-dots SVG plus an `sr-only`
  "More" label, for when a long trail is truncated in the middle.
- Stories: a basic 3-4 level trail; a custom `/` separator; a collapsed trail using
  `BreadcrumbEllipsis`; an `asChild` link (styled `<a>` standing in for a router link) - all in
  both themes via the toolbar toggle.
- Tests: renders the `<nav>` landmark with its label and an `<ol>`; the current page carries
  `aria-current="page"` and is not a link; separators/ellipsis are `aria-hidden` and out of the
  accessible name; `BreadcrumbLink asChild` renders the child element carrying the link classes
  (no nested anchor); `cn()` merges a caller `className`; each part forwards `ref`.

### Out

- **Automatic collapsing / responsive truncation** - Breadcrumb does not measure width or decide
  which items to hide; the consumer composes `BreadcrumbEllipsis` where they want the trail cut.
  An auto-collapsing variant is a later follow-up.
- **A dropdown/menu behind the ellipsis** (revealing hidden crumbs on click) - that needs a
  Branch-level popover (interaction state + portal); this ships the static ellipsis only.
- **A data-driven `items` API** (passing an array instead of composing parts) - the compound is
  the surface; a convenience wrapper can come later if wanted.
- **Icon-in-crumb helpers** - a consumer places any icon inside `BreadcrumbLink`/`BreadcrumbPage`
  children themselves; canopy stays decoupled from `@rogueoak/icons`.

## Approach

Follows the **0020 Twigs recipe** verbatim: a compound of small `forwardRef` elements, semantic
tokens only, `cn()` for merge-with-caller-wins, full-literal Tailwind classes, native prop
spread. `BreadcrumbLink` uses **Radix `Slot`** for `asChild` (already a canopy dep) - the same
router-agnostic polymorphism as `TopNavLink`. No React context is needed (unlike FormField):
there is no cross-part shared state to wire - each part is independent markup, so this is a
**structural** compound like Card, not a stateful one.

**A11y is the point of the component**, so it drives the design: the ordered list conveys
sequence, `aria-current="page"` marks the destination, and every decorative separator/ellipsis is
`aria-hidden` + `role="presentation"` so a screen reader announces "Home, link. Docs, link.
Breadcrumb, current page" with no "chevron" noise. Per the "test the a11y behaviour, not its
scaffolding" learning, tests assert the **observable** accessibility outcome (the current page is
reachable as `aria-current`, separators are absent from the accessible name), not just that
elements exist. The separator/ellipsis glyphs are **hand-rolled inline `currentColor` SVGs** so
they inherit text colour and add no dependency (the Dialog/Checkbox precedent). Vitest + Testing
Library verify structure and semantics; both themes are proven in Storybook.

## Acceptance

- [ ] `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`,
      `BreadcrumbSeparator`, `BreadcrumbEllipsis` (+ their prop types) exported from
      `@rogueoak/canopy/twigs`; semantic tokens only, light **and** dark, no per-component theme
      code, no new token, no new dependency.
- [ ] `Breadcrumb` is a `<nav aria-label="breadcrumb">` landmark wrapping an `<ol>` of `<li>`
      items; label overridable.
- [ ] `BreadcrumbPage` marks the current page with `aria-current="page"` and is non-interactive;
      `BreadcrumbLink` is the interactive ancestor link.
- [ ] `BreadcrumbSeparator` and `BreadcrumbEllipsis` are decorative (`aria-hidden`,
      `role="presentation"`), absent from the accessible name; the separator's default glyph is
      overridable via `children`; the ellipsis carries an `sr-only` label.
- [ ] `BreadcrumbLink` supports `asChild` (Radix `Slot`) - renders the child element carrying the
      link classes, no nested anchor.
- [ ] Each part forwards `ref` and spreads native props; `className` merges via `cn()`.
- [ ] Stories cover basic / custom-separator / collapsed-ellipsis / `asChild` in both themes;
      tests (landmark + list structure, `aria-current`, decorative separator/ellipsis a11y,
      `asChild`, `className` merge, ref forwarding) pass.
- [ ] Storybook **Twigs** section updated with a `Twigs/Breadcrumb` entry.
- [ ] README and `docs/overview/` (`features.md`, `architecture.md`) updated in the same change.
- [ ] Developer sign-off in Storybook.
