# 0040 - Alert

## Problem

Canopy has no **static inline notice**: a banner that sits in the page flow and tells the user
something now - a form-level error summary, a "changes saved" confirmation, a deprecation warning,
an informational callout at the top of a settings panel. Today a consumer who needs this has to
hand-build a coloured box with a border, an icon, a title, and body text, and then get the
semantics right (`role="alert"` for urgent messages, `role="status"` for passive ones) - repeated
and re-guessed on every surface. This is exactly the reuse a design system should own once.

This is distinct from the two related-but-different surfaces canopy plans separately: **AlertDialog**
(0053), which is a modal, focus-trapping, portalled *interruption* that demands a response, and
**Toast** (0058), which is a transient, auto-dismissing, portalled *notification*. Alert is neither -
it is presentational, non-portalled, has no state and no timers, and stays where it is rendered. It
composes the same token layer as `Card` (0022) and reuses the semantic fill/text tokens already used
by `Badge` (0008) and `Button` (0005), so it belongs at the Twig layer next to `Card` as a small
compound surface. Shadcn ships an `Alert` primitive but only in the default/destructive pair with a
raw `svg` slot; canopy needs the full semantic-variant set (info/success/warning/danger) mapped to
its own tokens and wired to the correct ARIA role.

## Outcome

- A new canopy component family, `Alert`, exported from `@rogueoak/canopy/twigs`, made of three
  parts: **`Alert`** (the banner container), **`AlertTitle`** (the heading line), and
  **`AlertDescription`** (the supporting body text).
- A **`variant`** prop - `default` / `info` / `success` / `warning` / `danger` - maps each banner to
  the matching semantic tokens (a tinted/subtle surface, a `border`, and readable text) so an error
  summary reads as danger and a confirmation reads as success, themed entirely through the token
  layer.
- **Semantics**: `Alert` renders a native element carrying `role="alert"` by default (assertive, for
  urgent notices); callers can pass `role="status"` for non-urgent, passive messages. The role is a
  real, overridable native prop, not a bespoke API.
- **Optional leading icon**: an `icon` slot renders a leading graphic in the banner's start column;
  when omitted the banner lays out title/description with no icon column. The icon is decorative and
  marked `aria-hidden`; the text carries the meaning.
- **Presentational, no state**: no open/close, no timers, no portal, no focus management. It is a
  static box in the document flow.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token Tailwind utilities, `cn()`
  merge with caller `className` winning, `forwardRef` + native prop spread on every part), so it
  themes light/dark through the token layer with **no `dark:` on the common path**.
- **Docs**: a Storybook catalog entry with Playground, all variants, with/without icon, and
  title-only stories in both themes; canopy `README.md` component list and the `overview/` living
  docs updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/Alert.tsx` (+ `packages/canopy/src/twigs/Alert.test.tsx`) - the
  `Alert` / `AlertTitle` / `AlertDescription` family, exported (component + prop types) from
  `packages/canopy/src/twigs/index.ts`.
- A `variant` prop on `Alert` (`default` / `info` / `success` / `warning` / `danger`) driven by
  `cva` with **full-literal** semantic-token utility strings, `defaultVariants: { variant: 'default' }`.
- `role="alert"` as the default, overridable to `role="status"` (or any role) via native props.
- An optional `icon` prop (a `React.ReactNode` slot) that renders a leading, `aria-hidden`
  decorative graphic; layout collapses cleanly to text-only when absent. Icons are supplied by the
  caller (canopy ships no icon library) or via inline `svg`, matching the existing `Breadcrumb`
  chevron idiom.
- `AlertTitle` renders a heading-weight line (`text-label`/`font-medium`, `text-text`);
  `AlertDescription` renders muted body text (`text-body-sm`, `text-text-muted`). Both `forwardRef`
  and spread native props.
- Story `apps/storybook/src/Alert.stories.tsx` importing from `@rogueoak/canopy/twigs`.
  Stories: **Playground**, **Variants** (all five), **WithIcon**, **TitleOnly** (no description),
  **DescriptionOnly**, **AsStatus** (non-urgent `role="status"`) - each rendering under the toolbar
  light/dark toggle with no per-story theme code.
- Tests (`Alert.test.tsx`): renders with `role="alert"` by default; `role="status"` override honored;
  each of the five variants renders its container; `icon` slot renders and is `aria-hidden` while the
  text is not; `AlertTitle` / `AlertDescription` render their content; `className` merge (caller
  wins); `ref` forwarding on all three parts.
- No new runtime dependency (reuses `cva`, `cn`, and semantic tokens canopy already has; no Radix,
  no icon package). No `package.json` / `tsup.config.ts` change.
- Docs on completion: canopy `README.md` component list, `docs/overview/features.md` (new Alert
  capability), and `docs/overview/architecture.md` (Alert placed at the Twig layer, no new dep).

### Out
- **AlertDialog** (0053) - the modal, portalled, focus-trapping confirmation surface is a separate
  spec; Alert must not grow open state, a portal, or focus management.
- **Toast** (0058) - transient/auto-dismissing/portalled notifications are a separate spec.
- **Dismissible Alert** (a close button that removes the banner) - that introduces state and a
  dismiss callback; defer to a clean follow-up (`AlertDismissible` or a `dismissible` prop) so v1
  stays purely presentational.
- **Built-in per-variant default icons** - v1 keeps the icon caller-supplied to avoid bundling an
  icon set; an opt-in default-icon map can follow once canopy settles an icon strategy.
- **Action slots / buttons inside the banner** - callers compose `Button` as children for now;
  a dedicated `AlertActions` part is deferred.
- Changing any existing component (`Card` 0022, `Badge` 0008, `Button` 0005) - Alert is purely
  additive.

## Approach

**Primitive stack: none - pure recipe.** Alert has no interaction and no portal, so it needs no Radix
primitive. It is the 0005/0020 recipe applied to a compound surface, exactly like `Card` (0022): each
part is a small `forwardRef` element that spreads native props and merges `className` via `cn()`,
with `Alert` adding a `cva` for its variant. This keeps it firmly at the **Twig** layer (composes
tokens and sub-parts, owns no state, no portal) and imports only downward (`cn` from `../lib`).

**Part surface (compound, mirrors `Card`).**
- `Alert` - the container. `cva` base sets the shared layout: `relative flex gap-3 rounded-lg border p-4`,
  with the optional `icon` rendered in a leading column (`[&>svg]:...` sizing on the slot, `shrink-0`)
  and the title/description stacked in a `flex flex-col` text column. The base carries `role="alert"`
  as a default attribute that native props can override to `status`.
- `AlertTitle` - the heading line: `text-label font-medium text-text`, a `forwardRef` element that
  spreads native props. Rendered as a `<div>` (not a heading) so it never disturbs the document
  outline; callers who need a heading level pass their own via children semantics or `className`.
- `AlertDescription` - muted body: `text-body-sm text-text-muted`, `forwardRef`, spreads native props.

**Variant to token mapping (full-literal `cva`).** Each variant is a complete, literal utility string
so Tailwind v4's scanner emits it (no dynamic class construction):
- `default` - neutral: `bg-muted border-border text-text`.
- `info` - `bg-info` tint with `text-info-foreground` (or the subtle info surface + `border` +
  `text-text` pairing that reads correctly in both themes; the exact subtle-token combination is
  chosen against the token layer during build and must stay within the semantic vocabulary).
- `success` / `warning` / `danger` - the matching `bg-success` / `bg-warning` / `bg-danger`
  (or their subtle surfaces) with the paired `*-foreground` text and a `border` that carries the
  variant hue, so each banner is distinguishable by more than colour (icon + text back it up).

All variants use **semantic tokens only** - no palette classes, no `dark:` on the common path; the
light/dark rendering is a property of the token layer (`.dark` block in tokens.css), consistent with
`Card`, `Badge`, and `Button`.

**Icon slot.** The `icon` prop is a decorative `React.ReactNode`. Alert wraps it in an `aria-hidden`
span sized via the `[&>svg]` idiom already used by `Breadcrumb`, positioned in the leading column.
When `icon` is undefined the column is not rendered and the text column fills the banner. The meaning
lives in the text (`AlertTitle` / `AlertDescription`), never in the icon, so screen-reader users lose
nothing when the icon is hidden.

**Accessibility.** The banner defaults to `role="alert"` (assertive live region) for urgent notices;
callers pass `role="status"` (polite) for passive confirmations - both are native, overridable
attributes rather than a canopy-specific prop, keeping the API honest. The a11y promises are guarded
by **observable tests** (the default role is present, the override is honored, the icon is
`aria-hidden` while the text is exposed), per the repo learning that a11y is verified by outcomes,
not by asserting a class exists.

**Motion.** None. Alert is static; there is no enter/exit animation (that belongs to Toast 0058 and
AlertDialog 0053).

**Trade-offs.**
- *Title as `<div>` vs heading element*: rendering `AlertTitle` as a `<div>` avoids injecting an
  unpredictable heading level into the caller's document outline; the cost is callers who want a
  heading must supply their own. Accepted - a banner's title level is context-dependent and the
  system should not guess it (same reasoning `Card` uses, inverted).
- *Caller-supplied icon vs bundled defaults*: keeps canopy free of an icon dependency and keeps v1
  presentational; the cost is a little more caller code, revisited when canopy picks an icon story.
- *No dismiss in v1*: keeps Alert stateless and at the Twig layer; dismissal (state + callback) is a
  deliberate follow-up rather than smuggled in here.
- *No new dependency* - nothing for security/architecture review to weigh on the dependency surface;
  the review focus is the token-to-variant mapping reading correctly in both themes.

## Acceptance

- [ ] `Alert`, `AlertTitle`, `AlertDescription` (and their prop types) ship from
      `@rogueoak/canopy/twigs`, exported via `packages/canopy/src/twigs/index.ts`; no new runtime
      dependency added.
- [ ] Built with the 0005/0020 recipe: `cva` full-literal semantic-token strings, `cn()` merge with
      caller `className` winning, `forwardRef` + native prop spread on all three parts, `React.ComponentRef`
      where a ref type is needed, **no `dark:` on the common path**, semantic tokens only.
- [ ] `variant` supports `default` / `info` / `success` / `warning` / `danger`, each mapping to its
      paired surface / `border` / `*-foreground` tokens; `default` is the default variant.
- [ ] `Alert` renders `role="alert"` by default and honors a `role="status"` (or other) override via
      native props.
- [ ] The optional `icon` slot renders in a leading column, is `aria-hidden`, and the layout collapses
      to text-only when `icon` is absent; the banner's meaning stays in the text.
- [ ] Alert is presentational: no open/close state, no timers, no portal, no focus management.
- [ ] Storybook catalog entry `apps/storybook/src/Alert.stories.tsx` with Playground, Variants (all
      five), WithIcon, TitleOnly, DescriptionOnly, and AsStatus stories, rendering correctly in light
      and dark via the toolbar; the storybook build is green.
- [ ] Tests cover: default `role="alert"`; `role="status"` override; each of the five variants renders;
      `icon` renders and is `aria-hidden` while text is exposed; `AlertTitle` / `AlertDescription`
      render content; `className` merge (caller wins); `ref` forwards on all three parts.
- [ ] `pnpm build`, `pnpm test`, and `pnpm lint` pass from the repo root; all text and source are
      ASCII-only.
- [ ] Canopy `README.md` component list includes Alert; `docs/overview/features.md` (new Alert
      capability) and `docs/overview/architecture.md` (Alert at the Twig layer, no new dependency)
      updated on completion.
