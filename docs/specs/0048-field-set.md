# 0048 - FieldSet

## Problem

Canopy has `FormField` (0020) for the single-control molecule - one label wired to one
control (Input, Select, Checkbox, ...) with help and error text. But 0020 explicitly put
**multi-control field groups** out of scope: "a RadioGroup as the field with a
fieldset/legend semantics for grouped controls is a follow-up." That follow-up is this spec.

A form regularly needs to group several related controls under one shared caption - a set of
address fields, a block of notification toggles, a RadioGroup (0016) whose options are the
field, or two or three `FormField`s that belong together. The correct native primitive for
this is `<fieldset>` with a `<legend>`: the legend labels the whole group for assistive tech,
and `fieldset[disabled]` cascades the disabled state to every control inside it for free. Today
a consumer hand-rolls a bare `<fieldset>` and re-styles the legend from scratch every time, or
worse skips the semantics and loses the group label. shadcn/ui ships no fieldset primitive at
all, so there is nothing to lean on there either.

FieldSet is the sibling of `FormField` (0020): FormField labels **one** control, FieldSet
labels a **group**. It composes `FormField` and the field Seeds (RadioGroup 0016, Checkbox
0011, Input 0009, ...) rather than replacing them. Audience: rogueoak app teams building forms
with grouped controls, and us (closing the 0020 debt for the grouped-control case).

## Outcome

When done:

- `@rogueoak/canopy/twigs` exports an accessible, themed `FieldSet` family - `FieldSet`,
  `FieldSetLegend`, `FieldSetDescription`, and `FieldGroup` - built on the native
  `<fieldset>` / `<legend>` elements.
- **Grouping**: `FieldSet` renders a real `<fieldset>` and `FieldSetLegend` a real `<legend>`,
  so the legend is the accessible **group label** (assistive tech announces it when focus
  enters any control in the group) with no ARIA plumbing needed.
- **Disabled cascade**: setting `disabled` on `FieldSet` sets the native `disabled` attribute
  on the `<fieldset>`, which the browser cascades to **every** form control inside it (the
  controls go inert). No per-child wiring; the legend and description dim to match.
- **Layout**: `FieldGroup` is a layout part that arranges the grouped controls (a vertical
  stack by default, with an optional row/inline direction), so callers do not re-invent the
  spacing each time.
- **Composition**: FieldSet wraps one or more `FormField`s (0020), a `RadioGroup` (0016), a
  block of `Checkbox`es (0011), or arbitrary field Seeds - it owns the group caption and
  disabled cascade, the children own their own wiring.
- **Theming**: styled with the 0005 recipe (full literal semantic-token utilities, `cn()`
  merge, `forwardRef` + native prop spread, no `dark:` on the common path) - light/dark flips
  through the token layer, matching `FormFieldLabel` / `FormFieldDescription`.
- **Docs**: a Storybook **Twigs** entry (RadioGroup group, checkbox group, grouped
  FormFields, disabled, with-description - both themes); canopy README component list and the
  `overview/` living docs updated on completion.

## Scope

### In

- `packages/canopy/src/twigs/FieldSet.tsx` (+ `FieldSet.test.tsx`) - the FieldSet family and
  its parts, exported from `packages/canopy/src/twigs/index.ts`:
  - `FieldSet` - the root. Renders a native `<fieldset>`; takes `disabled?: boolean` (spread as
    the native `disabled` attribute so the browser cascades it) and standard `<fieldset>` props.
    Provides `disabled` to the parts via a small `FieldSetContext` so the legend/description dim
    in step. Styled as a bordered or borderless group container (semantic tokens only).
  - `FieldSetLegend` - wraps the native `<legend>`; the accessible group label, styled with the
    `label` typography role on `text-text`, dimming to `text-text-muted` when the set is
    disabled (mirrors `FormFieldLabel`'s disabled affordance). Supports an optional `required`
    marker consistent with Label (0007) / FormFieldLabel.
  - `FieldSetDescription` - muted group help text (`text-text-muted text-body-sm`), carrying a
    generated `${id}-description` id and wired to the fieldset via `aria-describedby`; dims when
    disabled. Mirrors `FormFieldDescription` (0020).
  - `FieldGroup` - the layout part: a `flex` container arranging the grouped controls, with a
    `direction` (`column` default / `row`) and consistent gap. Full literal token classes only.
- **Disabled cascade** driven by native `fieldset[disabled]` - no per-child disabled wiring in
  FieldSet itself; a test asserts a control inside a disabled FieldSet is actually inert.
- **No new runtime dependency** - reuses what canopy already has (native elements, `cn()`,
  Radix `Slot` if a part needs `asChild`, and the existing FormField/Seeds for composition).
- Barrel export added to `packages/canopy/src/twigs/index.ts` (parts + prop types).
- Storybook story `apps/storybook/src/FieldSet.stories.tsx` importing from
  `@rogueoak/canopy/twigs`, in the **Twigs** section. Stories: Playground, RadioGroup group,
  Checkbox group, grouped FormFields, With description, Disabled (cascade visible) - each
  rendering correctly in light and dark via the toolbar (no per-story theme code).
- Tests (`FieldSet.test.tsx`): renders a `<fieldset>` with a `<legend>` group label;
  legend labels the group (accessible name / group semantics present); `disabled` sets the
  native attribute and a nested control is inert (cascade); description is associated via
  `aria-describedby`; `FieldGroup` direction variants render; disabled dims legend +
  description; `className` merge (caller wins) on each part; ref forwarding on each part; parts
  throw a clear error if used outside `FieldSet` (context guard).
- **README** component list adds FieldSet; `overview/features.md` (new grouped-field
  capability) and `overview/architecture.md` (FieldSet as the grouped sibling of FormField in
  the Twigs layer - no new dependency) updated on completion.

### Out

- **Changing `FormField` (0020)** - FieldSet is additive and composes FormField unchanged;
  0020's public API is not touched.
- **A `useFieldGroup`-style controlled invalid/error rollup** for the whole group (a single
  group-level error message aggregating child errors) - v1 leaves per-control error messages to
  each `FormField`/`FieldSetMessage`; a group-level validation rollup is a clean follow-up.
- **Roving-tabindex / arrow-key navigation across the group** - grouping and the disabled
  cascade come from native `<fieldset>`; controls that need arrow navigation (RadioGroup 0016)
  already own it. FieldSet adds no keyboard behaviour of its own.
- **`aria-required` / group-level required validation semantics** beyond the visual legend
  marker - the marker is presentational; enforcing requiredness stays with the controls.
- Any change to unrelated components or the introduction of a new runtime dependency.

## Approach

**Native fieldset + legend, composed with the Twigs recipe.** FieldSet is a Twig (composes
Seeds and shares wiring through a small React context), so it follows the recipe established by
`FormField` (0020). The key decision is to use the **native `<fieldset>` / `<legend>`** pair
rather than an ARIA `role="group"` div: the browser then gives us the group label association
and, crucially, the **disabled cascade** (`fieldset[disabled]` disables every descendant form
control) for free - no per-child prop injection, no context-driven disable plumbing. This is
strictly less code and more correct than re-implementing the cascade over a `div`.

**Part surface (mirrors FormField, canopy-styled).**
- `FieldSet` - `React.forwardRef` over `<fieldset>`. Generates a base `id` (`React.useId`),
  derives `${id}-description`, and provides `{ disabled, descriptionId, hasDescription,
  setHasDescription }` via `FieldSetContext`. Spreads native props including `disabled` onto
  the `<fieldset>` (so the cascade is the browser's, not ours), and sets `aria-describedby` to
  the description id only when a `FieldSetDescription` is actually rendered (the same
  render-driven wiring 0020 uses, so `aria-describedby` never points at an absent node). Styled
  with full literal token classes (`border-border` / `rounded-md` group container or a
  borderless stack, `text-text`), no `dark:`.
- `FieldSetLegend` - `React.forwardRef` over `<legend>`; reads `disabled` from context to dim
  to `text-text-muted` with a `cursor-not-allowed` hook, otherwise `text-text text-label`;
  optional `required` marker reusing the Label (0007) danger `*` idiom.
- `FieldSetDescription` - `React.forwardRef` over `<p>`; carries `${id}-description`, registers
  its presence via the context setter (mount/unmount effect) so `FieldSet` adds it to
  `aria-describedby`, and dims when disabled. Same `text-text-muted text-body-sm` as
  `FormFieldDescription`.
- `FieldGroup` - `React.forwardRef` over `<div>`; a `cva` maps `direction` (`column` /
  `row`) to full literal `flex` + gap token classes. No state, pure layout.

**Styling & recipe.** FULL LITERAL semantic-token utility strings so Tailwind v4's scanner
emits each; `cn()` merges the caller `className` (caller wins); `forwardRef` on every part with
a native prop spread; `React.ComponentRef` for ref types; **no `dark:` on the common path** -
light/dark is the token layer's job. The legend/description disabled affordance reuses the exact
tokens `FormFieldLabel` / `FormFieldDescription` use so a disabled FieldSet reads identically to
a disabled FormField.

**Accessibility.** Native `<legend>` as the first child of `<fieldset>` gives the group its
accessible label - no ARIA needed. `disabled` on the `<fieldset>` makes descendant controls
inert natively. Group help text is associated with `aria-describedby` pointing at the rendered
description only. Guard these promises with **observable** tests: a `<fieldset>`/`<legend>` are
present and the legend names the group, a nested control inside a disabled set is actually
inert, and `aria-describedby` resolves to a present node - per the repo learning that a11y is
proven by outcomes, not by asserting a class exists.

**Motion.** None - FieldSet is a static container.

**Trade-offs.**
- *Native `<fieldset>` vs `role="group"` div*: `<fieldset>` brings legacy layout quirks (the
  legend's float/`min-width` behaviour) that need a little CSS care, but it is the only element
  that cascades `disabled` and labels the group with zero ARIA. Accepted - correctness and less
  code win; the layout quirks are handled with token utilities in the recipe.
- *No group-level error rollup in v1*: keeps the surface small and lets each `FormField` own its
  own message; a group rollup is a documented follow-up rather than speculative API now.
- *No new dependency*: FieldSet is pure native elements plus `cn()` and (optionally) Radix
  `Slot` that canopy already ships - nothing new to review or externalize.

## Acceptance

- [ ] `FieldSet`, `FieldSetLegend`, `FieldSetDescription`, and `FieldGroup` ship from
      `@rogueoak/canopy/twigs` (exported via `src/twigs/index.ts` with their prop types); no new
      runtime dependency; no `dark:` on the common path.
- [ ] `FieldSet` renders a native `<fieldset>` and `FieldSetLegend` a native `<legend>`; the
      legend is the accessible group label (group semantics + accessible name present).
- [ ] `disabled` on `FieldSet` sets the native `<fieldset>` `disabled` attribute and a control
      rendered inside the set is actually inert (cascade proven by test), and the legend +
      description dim with the shared disabled tokens.
- [ ] `FieldSetDescription` is associated via `aria-describedby` only when rendered, resolving
      to a present node (render-driven wiring matching 0020).
- [ ] `FieldGroup` arranges controls with `direction` (`column` default / `row`) using full
      literal token classes; `FieldSetLegend` supports the optional `required` marker.
- [ ] Recipe obeyed: `cva`/full literal token classes, `cn()` merge (caller wins), `forwardRef`
      + native prop spread + `React.ComponentRef` on every part; parts throw a clear error when
      used outside `FieldSet`.
- [ ] FieldSet composes `FormField` (0020) unchanged and works with `RadioGroup` (0016) and
      `Checkbox` (0011) groups; 0020's public API is untouched.
- [ ] Storybook **Twigs** entry with Playground, RadioGroup group, Checkbox group, grouped
      FormFields, With description, and Disabled (cascade visible) stories - both themes;
      `pnpm storybook` build is green.
- [ ] Tests cover: `<fieldset>`/`<legend>` render and group label; disabled cascade makes a
      nested control inert; description `aria-describedby` wiring; `FieldGroup` directions;
      disabled dims legend + description; `className` merge and ref forwarding per part; context
      guard error. `pnpm test` / `lint` / `build` pass from the root.
- [ ] Canopy `README.md` component list includes FieldSet; `overview/features.md` (grouped-field
      capability) and `overview/architecture.md` (FieldSet as the grouped sibling of FormField in
      the Twigs layer, no new dependency) updated on completion.
