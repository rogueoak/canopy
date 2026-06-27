# 0020 — FormField (the Twigs recipe)

## Problem

The Seeds layer is complete (15 atoms, specs 0005-0019). Time to grow the first **Twig** —
the first composition — and with it establish the **Twigs composition recipe** every later
molecule will follow. **FormField** is the right vehicle: it is the canonical molecule
(Label + a control + help text + error message), it exercises the cross-atom wiring a Twig
exists to own (id generation, `htmlFor`/`aria-describedby`/`aria-invalid` association,
required + disabled affordances), and the Label Seed (0007) explicitly **deferred the
disabled-label affordance to "a FormField Twig"** — this spec collects that debt.

This spec is deliberately the heavy one of the Twigs group: it carries the shared infra (the
`./twigs` subpath export, its tsup entry, the `src/twigs/index.ts` barrel, the Storybook
**Twigs** section) **plus** FormField. The sibling specs (0021 SearchBar, 0022 Card)
reference the recipe established here and stay small — one independently shippable component
each, per the protocol's "one spec = one feature = one PR" rule.

Audience: rogueoak app teams building forms, and us (locking the Twigs composition recipe).

## Outcome

When done:

- `@rogueoak/canopy/twigs` exists and exports an accessible, themed `FormField` family.
- The **Twigs composition recipe** exists and is proven end-to-end: a compound component
  (root + parts) that **composes Seeds**, sharing wiring through a small React **context**,
  styled with semantic tokens only (no new token, no per-component theme code) — light/dark
  "just works" via the token layer.
- The distribution seam extends cleanly: `./twigs` is a new tsup entry + export subpath,
  externalized deps unchanged in spirit (peers + first-party Seeds bundled-by-source).
- Storybook gains a real **Twigs** section; FormField has stories (with Input, with Select,
  with Checkbox, required, with error, disabled · both themes) and tests (association,
  describedby/invalid wiring, required, disabled).

## Scope

### In

- **FormField** — a **form-library-agnostic** compound that wires a label to any single
  control and surfaces help/error text accessibly:
  - `FormField` — the root. Generates a stable base `id` (`React.useId`), derives
    `${id}-description` / `${id}-message` ids, and provides them plus `invalid` / `disabled`
    via a `FormFieldContext`. Accepts `invalid?: boolean` (or derives it from the presence of
    an error message) and `disabled?: boolean`. Renders a vertical stack (`flex flex-col gap-*`).
  - `FormFieldLabel` — wraps the **Label** Seed; reads `htmlFor` (the control id) and the
    `required` + `disabled` state from context so the label dims with its field (the affordance
    Label 0007 deferred).
  - `FormFieldControl` — a Radix **`Slot`** that injects `id`, `aria-describedby` (description
    and/or message ids, space-joined, only those present), and `aria-invalid` onto whatever
    single control Seed it wraps (Input, Textarea, Select trigger, …) — so any Seed becomes a
    wired field without that Seed knowing about FormField.
  - `FormFieldDescription` — muted help text carrying the `${id}-description` id.
  - `FormFieldMessage` — the error/validation message carrying the `${id}-message` id, in the
    `danger` role; renders nothing when empty.
- **Twigs-layer infra (lives here):** `src/twigs/index.ts` barrel; tsup `twigs/index` entry +
  `./twigs` export subpath in `package.json`; a Storybook **Twigs** section.
- **Accessibility** — programmatic label association (`htmlFor`/`id`), `aria-describedby`
  pointing at description + message, `aria-invalid` on the control when invalid; the message
  region announced (`role="alert"` / polite live region as appropriate).
- **Stories** — FormField composing Input, Select, and Checkbox; required; with an error;
  disabled — in light and dark.
- **Tests** — label↔control association, `aria-describedby` includes the right ids (and omits
  absent ones), `aria-invalid` toggles with `invalid`/error, required marker, disabled dims
  label + control.

### Out

- **react-hook-form / Formik integration** — FormField is library-agnostic; it owns wiring,
  not validation state. A thin RHF adapter can come later.
- **Multi-control field groups** (e.g. a RadioGroup as the field with a fieldset/legend) —
  the single-control path first; fieldset/legend semantics for grouped controls is a follow-up.
- **SearchBar / Card** → their own specs (0021 / 0022), each referencing this recipe.

## Approach

- **Compound component + context** is the Twigs composition recipe. The root owns the shared
  wiring (ids, invalid, disabled) in a `FormFieldContext`; the parts consume it. This keeps the
  composition declarative (`<FormField><FormFieldLabel/><FormFieldControl><Input/></…>`) and
  lets a Twig wire **any** Seed without that Seed depending on the Twig.
- **Composes Seeds, adds no token.** Label is the Label Seed; the control is whatever Seed the
  consumer passes; description/message are plain elements on existing semantic tokens
  (`text-text-muted`, `text-danger`). No new token, no `dark:`.
- **`Slot` for the control** — `FormFieldControl` renders Radix `Slot` so it injects the wiring
  props onto its single child rather than rendering a wrapper element, keeping the control's own
  ref/props intact (the same `asChild` mechanism the Seeds recipe already uses).
- **Testing** — Vitest + Testing Library assert the association and ARIA wiring the molecule
  exists to guarantee (the behaviour, not the classes).

### Decision (locked) — distribution subpath
Twigs ship as a **new `./twigs` subpath** (`@rogueoak/canopy/twigs`), parallel to `./seeds`,
not folded into `./seeds`. A new tsup entry (`twigs/index`) emits `dist/twigs/index.js` +
`.d.ts`; `package.json` `exports` adds the `./twigs` map. Layer-per-subpath keeps imports
self-documenting (`from '@rogueoak/canopy/twigs'`) and tree-shaking per layer, and mirrors the
README's layer model. The consumer's `@source '@rogueoak/canopy'` already covers the new files,
so no styling-seam change.

## Acceptance

- [ ] `@rogueoak/canopy/twigs` subpath exists (tsup entry + `exports` map) and exports the
      `FormField` family; semantic tokens only, light **and** dark, no per-component theme code.
- [ ] `FormField` wires label↔control (`htmlFor`/`id`), `aria-describedby` (description +
      message ids, only those present), and `aria-invalid` — via context + `Slot`, composing
      any control Seed.
- [ ] `required` shows the Label marker; `disabled` dims **both** the label and the control
      (the affordance Label 0007 deferred).
- [ ] `FormFieldMessage` carries the `danger` role, is announced to assistive tech, and renders
      nothing when empty.
- [ ] Storybook **Twigs** section; FormField stories cover Input/Select/Checkbox, required,
      error, disabled — in both themes.
- [ ] Tests (association + describedby/invalid wiring + required + disabled) pass.
- [ ] Developer sign-off on FormField in Storybook.
