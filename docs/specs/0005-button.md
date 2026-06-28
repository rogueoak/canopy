# 0005 - Button (the Seeds recipe)

## Problem

Roots is locked (0003) and themeable (0004). Time to grow the first **Seed** - the first
real component - and with it establish the **component recipe** every later atom will follow.
Button is the right vehicle: it exercises variants, sizes, interaction states, focus rings,
and polymorphism, so getting it right sets the conventions for Input, Label, Badge, and
beyond.

This spec is deliberately the heavy one of the Seeds group: it carries the shared infra (the
`cn()` util, cva setup, component deps, the consumer styling seam) **plus** Button. The
sibling specs (0006 Input, 0007 Label, 0008 Badge) reference the recipe established here and
stay small - one independently shippable component each, per the protocol's
"one spec = one feature = one PR" rule.

Audience: rogueoak app teams building UIs, and us (locking the component recipe).

## Outcome

When done:

- `@rogueoak/canopy/seeds` exports an accessible, themed `Button`.
- The **component recipe** exists and is proven end-to-end: cva variants → semantic-token
  utilities, `cn()` for class merging, Radix where behaviour/a11y warrant, semantic tokens
  only (no raw palette, no per-component theme code) - light/dark "just works" via 0004.
- The **Tailwind-source consumer styling seam** is implemented and documented in the README.
- The throwaway `Sprout` placeholder is removed; Storybook gains a real **Seeds** section.
- Button has stories (variants · sizes · states · both themes) and tests
  (render · variant · a11y/interaction).
- The README quick start shows a **real** Button.

## Scope

### In
- **Button** - variants `primary` / `secondary` / `outline` / `ghost` / `destructive`; sizes
  `sm` / `md` / `lg` / `icon`; `disabled` + hover/active via 0004 interaction tokens;
  focus-visible ring; `asChild` (Radix Slot) for polymorphism.
- **Component infra (the recipe, lives here):**
  - `cn()` util - `clsx` + `tailwind-merge`.
  - `class-variance-authority` (cva) for variant→token mapping.
  - Radix primitives where behaviour/a11y warrant - `@radix-ui/react-slot` for Button.
  - Deps added to `@rogueoak/canopy`: `@radix-ui/react-slot`, `class-variance-authority`,
    `clsx`, `tailwind-merge` (Radix as deps; React stays peer).
- **Consumer styling seam (decision below)** - implemented and **documented in the README**.
- **Accessibility** - focus-visible ring (`ring`/`ring-offset` tokens), correct role, full
  keyboard support.
- **Stories** - all variants/sizes/states, rendered in light and dark.
- **Tests** - render, variant classes, disabled/keyboard/interaction (Testing Library +
  user-event).
- Remove `Sprout`; create a real **Seeds** section in Storybook.
- README: quick start shows a real `Button`; tick `0005`.

### Out
- **Input / Label / Badge** → their own specs (0006 / 0007 / 0008), each referencing this recipe.
- The rest of the atom catalogue (Checkbox, Switch, Textarea, Select, Tooltip, Avatar,
  Spinner, Kbd, …) → follow-up Seeds specs.
- **Twigs / Branches** → later.
- Actual `npm publish` → a dedicated release spec.

## Approach

- **shadcn as the source of patterns, adapted.** Use shadcn's Button structure (Radix +
  Tailwind + cva) as the starting point, but style against **canopy semantic tokens** and
  ship as a **compiled library** (the established distribution decision - not a copy-in
  registry).
- **Variants** via cva mapping to semantic-token utilities (`bg-primary
  text-primary-foreground hover:bg-primary-hover …`). Interaction states use the 0004 tokens;
  focus uses `ring`.
- **Theme-agnostic by construction** - Button never references a palette value or a theme;
  verified by rendering every story in both Storybook themes.
- **Testing** - Vitest + Testing Library + `@testing-library/user-event` for behaviour and
  a11y (focus, keyboard, disabled, aria).

### Decision (locked) - how component styles reach consumers
**A - Tailwind-source.** canopy ships `className` strings (Tailwind utilities); the consumer
runs Tailwind v4 + the `@rogueoak/roots` preset and adds `@rogueoak/canopy` to their content
sources, so the utilities are generated (and tree-shaken) in their own build:

```css
@import 'tailwindcss';
@import '@rogueoak/roots/tailwind-preset.css';
@source '../node_modules/@rogueoak/canopy';
```

Idiomatic, tree-shakeable, and fully themeable (consumer's `.dark` flips canopy too). rogueoak
apps are Tailwind-native and already pull the roots preset, so this is the natural fit. A
prebuilt-CSS bundle for non-Tailwind consumers can be added later if needed (not now). This
must be **clearly documented** in the README so consumers wire it up correctly.

## Acceptance

- [ ] `Button` exported from `@rogueoak/canopy/seeds`, styled via semantic tokens only,
      working in light **and** dark with no per-component theme code.
- [ ] Recipe in place: `cn()` util; cva variants; Radix `Slot` for `asChild`.
- [ ] Accessible: focus-visible ring, correct role, keyboard support (verified in tests).
- [ ] Storybook **Seeds** section; Button stories cover every variant/size/state in both
      themes; `Sprout` removed.
- [ ] Tests (render + variants + a11y/interaction) pass.
- [ ] The Tailwind-source consumer styling path is implemented and clearly documented in the
      README (preset import + `@source` for canopy).
- [ ] README quick start shows a real `Button`; `0005` ticked on the roadmap.
- [ ] Developer sign-off on Button in Storybook.
