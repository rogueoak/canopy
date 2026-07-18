# 0044 - input-group

## Problem

Canopy has a standalone `Input` (0006) and a bespoke `SearchBar` (0021), but no general way to
attach **addons** to a text field inside a single bordered box. Real forms are full of these:
`$` before a price, `.00` after it, `https://` prefixing a URL, a units suffix (`kg`, `%`), a
leading search or email icon, or a trailing "Copy" / "Go" button. Today a consumer either
hand-rolls absolute-positioned overlays against a raw `Input` (re-computing padding to clear each
addon, re-wiring the focus ring, re-deriving the invalid border every time) or bends `SearchBar`
to a job it was not built for. `SearchBar` bakes in one fixed layout (magnifier + clear +
shortcut hint) and a search-specific contract; it is not a reusable addon shell.

shadcn/ui ships no input-group primitive at all - the common advice there is "wrap the input in a
flex div and fake the border", which loses the single-focus-ring-on-the-whole-group behaviour and
the invalid-state propagation that make the pattern read as one field. This is the gap `InputGroup`
fills: **one bordered field, with the focus ring and the invalid state on the group**, and
leading/trailing addons (icon, text, or button) that sit flush inside it.

This is for any form surface that needs an affixed input: pricing/amount fields, URL and handle
inputs, email capture, unit-suffixed measurements, and copy/paste or inline-action fields. It
composes the existing `Input` (0006) and can reuse `Button` (0008), so it belongs in canopy as
the field-composition Twig that **generalizes** `SearchBar` (0021) - SearchBar becomes one
possible arrangement of an InputGroup rather than a special case.

## Outcome

- A new canopy component family, `InputGroup`, exported from `@rogueoak/canopy/twigs`, that
  wraps an `Input` (0006) with leading and/or trailing addons inside a **single bordered box**.
- **Parts**: `InputGroup` (the bordered flex shell that owns the border, radius, and one focus
  ring for the whole group), `InputGroupAddon` (a non-interactive-by-default affix with an
  `align` of `start` (leading) or `end` (trailing), for an icon or short text), `InputGroupInput`
  (the borderless `Input` that flexes to fill the remaining width), and `InputGroupButton` (a
  trailing/leading action button flush inside the group, for "Copy" / "Go" / a reveal toggle).
- **One focus ring on the group**: focus moves to the inner input, but the ring renders on the
  outer `InputGroup` (via `focus-within`), so the whole field lights up as a unit rather than the
  bare input; the inner input drops its own border and ring so there is no double outline.
- **States**: `disabled` propagates from the group to the input and addons (shared disabled
  tokens, field style - `disabled:bg-disabled` / `disabled:text-disabled-foreground`); an invalid
  field is driven by native **`aria-invalid`** set on the group and **propagated** to the inner
  input, applying the danger border/ring to the whole group exactly as `Input`/`Select` do for a
  lone field.
- **a11y**: addons are decorative by default (`aria-hidden` icons via `currentColor`); the input
  keeps its own accessible name (`aria-label` or an associated `Label` (0009) / `FormField`
  (0031)); `InputGroupButton` is a real, labelled `<button>`. No new roles are invented - it is a
  labelled text field with affixes.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token utilities, `cn()` merge,
  `forwardRef` + native prop spread, `React.ComponentRef` for typed refs), so it themes light/dark
  through the token layer with **no `dark:` on the common path**.
- **Storybook**: a catalog entry with leading-icon, leading-text (prefix), trailing-text (suffix),
  trailing-button, both-ends, sizes, disabled, and invalid (`aria-invalid`) stories, plus a story
  reproducing the `SearchBar` layout to show the generalization - light and dark.
- **Docs**: canopy `README.md` component list and the `overview/` living docs updated on
  completion.

## Scope

### In

- `packages/canopy/src/twigs/InputGroup.tsx` (+ `packages/canopy/src/twigs/InputGroup.test.tsx`) -
  the component family and its parts.
- Barrel export from `packages/canopy/src/twigs/index.ts` (`InputGroup`, `InputGroupAddon`,
  `InputGroupInput`, `InputGroupButton` and their prop types).
- **No new runtime dependency**: `InputGroup` composes the existing `Input` (0006) and, for
  `InputGroupButton`, the existing `Button` (0008); no dep or `tsup` external change.
- The four parts:
  - `InputGroup` - the bordered flex `div` shell: `border-border` / `bg-surface` / `rounded-md`,
    the shared focus ring rendered on the group via `focus-within:ring-*`, the `disabled:*` field
    token pair, and the `aria-invalid:` danger overrides; sizes `sm` / `md` / `lg` mirroring
    `Input`. Sets a small context so `align` and `disabled`/invalid propagate to children.
  - `InputGroupAddon` - a flush affix (`align: 'start' | 'end'`, default `start`) for an icon or
    short text (`text-text-muted`, `pointer-events-none` by default so clicks fall through to the
    input); decorative icons are `aria-hidden`.
  - `InputGroupInput` - a canopy `Input` with its own border, ring, radius, and background
    stripped (`border-0`, `focus-visible:ring-0`, `bg-transparent`) so the group owns the frame;
    flexes to fill remaining width; forwards `ref` to the `<input>`.
  - `InputGroupButton` - a canopy `Button` sized to sit flush inside the group (e.g. `ghost` /
    `sm`), a real labelled `<button>` for a trailing/leading action.
- `disabled` and `aria-invalid` set on `InputGroup` propagate to `InputGroupInput` (and visually
  to addons) so the whole group reads as one disabled/invalid field.
- Storybook story `apps/storybook/src/InputGroup.stories.tsx` (imported from
  `@rogueoak/canopy/twigs`): **Playground, LeadingIcon, Prefix (leading text), Suffix (trailing
  text), TrailingButton, BothEnds, Sizes, Disabled, Invalid, AsSearchBar** (the SearchBar layout
  rebuilt from parts) - each rendering correctly in light and dark from the toolbar, no per-story
  theme code.
- Tests (`InputGroup.test.tsx`): renders group + input; leading and trailing addons render in the
  right order (`align`); typing updates the input value; `disabled` on the group renders the input
  inert (input receives `disabled`); `aria-invalid` on the group propagates to the input;
  `InputGroupButton` is a labelled `<button>` and its `onClick` fires; the inner input keeps its
  accessible name; `className` merge (caller wins) on each part; `ref` forwards to the `<input>`.
- Docs: canopy `README.md` component list, `overview/features.md`, and `overview/architecture.md`
  updated on completion.

### Out

- **Retiring or rewriting `SearchBar` (0021)** - `InputGroup` generalizes the pattern and a story
  shows the search layout, but 0021 stays as-is in this spec; refactoring `SearchBar` to sit on
  top of `InputGroup` (and any behaviour changes that implies) is a clean follow-up.
- **Segmented / OTP / multi-box inputs** (one box per character) - different semantics; a separate
  later spec.
- **Built-in stateful affixes** - `InputGroup` provides the shell and the button slot but does not
  ship a managed password-reveal, copy-to-clipboard, or clear-value behaviour; those are composed
  by the caller (or added as focused follow-ups) so v1 stays a pure layout/composition Twig.
- **Changing `Input` (0006), `Button` (0008), or any other component** - `InputGroup` is additive
  and composes them through their existing public APIs; those APIs are **unchanged**.

## Approach

**Composition, no new primitive.** Per the layer rules this is a **Twig**: it composes 2+ Seeds
(`Input`, `Button`) via a small React context and Slot-free wrappers, owns no interaction state,
and needs no portal. It reuses exactly what canopy already ships, so there is **no new runtime
dependency** and no `tsup` external / `package.json` change - nothing for the security or
architecture personas to weigh on the dependency front.

**The single-frame trick (key decision).** The border, radius, background, focus ring, disabled
tokens, and `aria-invalid` danger overrides all live on the **outer `InputGroup`**, not on the
inner input. `InputGroupInput` strips its own frame (`border-0 bg-transparent
focus-visible:ring-0` layered over the base `Input` via `cn()`), so the group shows one border and
- through `focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
focus-within:ring-offset-ring-offset` on the group - one focus ring when the inner input is
focused. This is what makes the affixed field read as a single control instead of an input with
decorations pinned next to it. Trade-off: the ring is `focus-within` on the wrapper rather than
`focus-visible` on the input, so a mouse click into the field also shows the ring; this is the
correct behaviour for a grouped field (the whole box is the focus target) and matches how native
affixed fields present.

**State propagation via context.** `InputGroup` puts `disabled` and the invalid flag (derived from
`aria-invalid`) plus each region's `align` into a tiny context. `InputGroupInput` reads it to set
`disabled` and `aria-invalid` on the real `<input>` (so the input is genuinely inert / genuinely
invalid for assistive tech, not just styled), and `InputGroupAddon` reads it to mute its text when
disabled. Callers can still set `disabled` / `aria-invalid` directly on `InputGroupInput`; the
group value is the default. The invalid styling is driven by the native `aria-invalid` attribute
and Tailwind's `aria-invalid:` variant on the group - no custom `invalid` prop - matching the
`Input`/`Select` idiom (recipe rule 6).

**Part surface (canopy-styled, small).**
- `InputGroup` - `cva` size variants (`sm`/`md`/`lg`, heights matching `Input`) over a base of
  `flex w-full items-center rounded-md border border-border bg-surface` + the group focus ring +
  `has-[:disabled]` / `disabled` token pair + `aria-invalid:border-danger aria-invalid:ring-danger`;
  `forwardRef` to the `div`, native props spread, context provider.
- `InputGroupAddon` - `align: 'start' | 'end'` (order in flex), `flex items-center px-3
  text-text-muted`, `pointer-events-none` default; `forwardRef` to the `div`.
- `InputGroupInput` - wraps `Input` with the frame-stripping classes and `h-full flex-1`;
  `forwardRef` to the `<input>` via `React.ComponentRef<typeof Input>`.
- `InputGroupButton` - wraps `Button` (default `variant="ghost"`, flush sizing) as a real labelled
  action button; `forwardRef` to the `<button>`.

**Styling & recipe.** FULL LITERAL token-utility strings on every part (so Tailwind v4's scanner
emits each), `cn()` merge with the caller's `className` winning, `forwardRef` + native prop spread
on every styled wrapper, `React.ComponentRef` for typed refs, **no `dark:` on the common path** -
identical to 0005/0006. The group's disabled and `aria-invalid` token classes are the same ones
`Input` uses, so a disabled/invalid `InputGroup` reads identically to a disabled/invalid lone
`Input`.

**Accessibility.** No new roles: it is a labelled text field with decorative affixes. Addon icons
are `aria-hidden` and inherit colour via `currentColor`; the input keeps its own accessible name
(`aria-label` or an associated `Label`/`FormField`); `InputGroupButton` is a real `<button>` with
a caller-supplied label. `disabled`/`aria-invalid` reach the real `<input>` so assistive tech sees
the true state. These promises are guarded by **observable tests** (input inert when group
disabled, `aria-invalid` present on the input, button labelled and clickable), per the repo
learning that a11y is guarded by outcomes, not by asserting a class exists.

**Motion.** None - a static layout shell.

## Acceptance

- [ ] `InputGroup`, `InputGroupAddon`, `InputGroupInput`, and `InputGroupButton` (and their prop
      types) ship from `@rogueoak/canopy/twigs` (exported via `twigs/index.ts`); **no new runtime
      dependency** and no `tsup` external change.
- [ ] The recipe is obeyed: full-literal semantic-token utilities, `cn()` merge (caller wins),
      `forwardRef` + native prop spread, `React.ComponentRef` refs, **no `dark:` on the common
      path**; the component themes light and dark through the token layer.
- [ ] One bordered box with **one focus ring on the group**: focusing the inner input renders the
      ring on the outer `InputGroup` (via `focus-within`), and the inner input shows no border or
      ring of its own (no double outline).
- [ ] Leading (`align="start"`) and trailing (`align="end"`) addons render flush in the correct
      order; an icon addon is `aria-hidden` and inherits `currentColor`.
- [ ] `disabled` set on `InputGroup` propagates to the inner `<input>` (genuinely inert) and mutes
      addons, using the shared field disabled tokens.
- [ ] `aria-invalid` set on `InputGroup` propagates to the inner `<input>` and applies the danger
      border/ring on the group exactly as a lone `Input`/`Select` does; no custom `invalid` prop.
- [ ] `InputGroupButton` is a real, labelled `<button>`; its `onClick` fires and it sits flush in
      the group; the inner input keeps its own accessible name.
- [ ] Sizes `sm`/`md`/`lg` match `Input` heights; `className` merge works on each part.
- [ ] The existing public APIs of `Input` (0006), `Button` (0008), and every other component are
      **unchanged**; `SearchBar` (0021) is not modified.
- [ ] Storybook catalog entry with Playground, LeadingIcon, Prefix, Suffix, TrailingButton,
      BothEnds, Sizes, Disabled, Invalid, and AsSearchBar stories; `pnpm storybook` build is green
      in light and dark.
- [ ] Tests cover: group + input render, addon order by `align`, typing updates value, group
      `disabled` makes the input inert, group `aria-invalid` propagates to the input, button is
      labelled and its click fires, input keeps its accessible name, per-part `className` merge,
      and `ref` forwards to the `<input>`. `pnpm test` / `lint` / `build` pass from the root.
- [ ] Canopy `README.md` component list includes InputGroup; `overview/features.md` (new
      field-composition capability) and `overview/architecture.md` (InputGroup as the Twig that
      generalizes SearchBar, no new dependency) updated on completion.
