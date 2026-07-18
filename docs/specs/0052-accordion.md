# 0052 - accordion

## Problem

Canopy has modal disclosure (`Dialog` 0030-era Branch, `ResponsiveDialog`) and navigation
disclosure (`SideNav` collapsible sections), but no **general-purpose accordion**: a stack of
vertical, headed sections where each section's body expands and collapses in place. This is the
canonical pattern for FAQs, settings groups, filter panels, and progressive-disclosure content
where the sections stay inline (not portalled) and the header stays visible while the body
animates open. shadcn ships an Accordion on `@radix-ui/react-accordion`; canopy has the Radix +
0005-recipe stack to match it but has not yet vendored the primitive, so a consumer today has to
hand-roll header/panel wiring, `aria-expanded`/`aria-controls`, roving focus, and open/close
height animation - exactly the reusable behaviour the design system exists to own once.

This is for any surface that groups related content into collapsible sections: a settings page,
an FAQ, a filter sidebar, a "details" region on a card. It complements the modal `Dialog` (which
interrupts) and `SideNav` (which navigates) with an **inline, multi-section** disclosure that
sits in the normal document flow.

## Outcome

- A new canopy Branch component family, `Accordion`, exported from `@rogueoak/canopy/branches`,
  built on `@radix-ui/react-accordion`, with four parts: `Accordion` (root), `AccordionItem`,
  `AccordionTrigger`, and `AccordionContent`.
- **Single vs multiple**: `type="single"` allows one open section at a time (with `collapsible`
  to allow closing the open one); `type="multiple"` allows any number open at once. Works
  controlled (`value`/`onValueChange`) and uncontrolled (`defaultValue`).
- **Trigger**: a full-width header button showing the section label and a trailing chevron that
  rotates 180 degrees when its section is open, driven by Radix's `data-state="open"` attribute
  (no custom state prop). Correct heading semantics via `AccordionItem` rendering an
  accessible header.
- **Content**: the section body animates open and closed with an accordion-down / accordion-up
  height transition, gated with `motion-reduce:animate-none` so reduced-motion users get an
  instant show/hide.
- **a11y**: Radix supplies the header `button` with `aria-expanded` and `aria-controls`, the
  region wired by `id`, and roving keyboard support (Up/Down/Home/End between triggers,
  Enter/Space to toggle). `disabled` on an item makes its trigger inert.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**.
- **Motion**: `accordion-down` / `accordion-up` keyframes and their `animate-*` utilities ship
  from the Roots preset (added if missing), consistent with the other named canopy animations.
- **Docs**: a Storybook catalog entry (single, multiple, collapsible, disabled-item,
  default-open, long-content) and canopy `README.md` + `overview/` living docs updated on
  completion.

## Scope

### In
- `packages/canopy/src/branches/Accordion.tsx` (+ `Accordion.test.tsx`) - the component family
  (`Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`), exported from
  `packages/canopy/src/branches/index.ts`.
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-accordion`** (the
  portalless disclosure primitive: root, item, header, trigger, content, `data-state`,
  `type` single/multiple, `collapsible`, roving focus). Added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` alongside the other Radix deps; run
  `pnpm install` at the repo root after.
- **Motion**: `accordion-down` / `accordion-up` `@keyframes` + `--animate-accordion-down` /
  `--animate-accordion-up` theme entries added to the Roots preset
  (`packages/roots/preset-motion.css`) if not already present, so the height animation is a
  named utility (never inline), matching the existing `drawer-in` / `pop-in` idiom.
- `type` single/multiple, `collapsible`, controlled + uncontrolled value, per-item `disabled`,
  chevron rotate on `data-state`, animated `AccordionContent`.
- Storybook story `apps/storybook/src/Accordion.stories.tsx` importing from
  `@rogueoak/canopy/branches` (no per-story theme code; light/dark via the toolbar):
  Playground, Single, Multiple, Collapsible, DisabledItem, DefaultOpen, LongContent.
- Tests (`Accordion.test.tsx`, Vitest + Testing Library): renders trigger/region roles;
  clicking a trigger expands its region and toggles `aria-expanded`; `type="single"` closes the
  previously open section on opening another; `collapsible` closes the open one when re-clicked;
  `type="multiple"` keeps several open; controlled (`value`/`onValueChange`) and uncontrolled
  (`defaultValue`) both work; keyboard (Up/Down/Home/End move focus between triggers,
  Enter/Space toggles); a disabled item's trigger is inert; caller `className` merges (caller
  wins) on each part; `ref` forwards on each styled wrapper.
- `README.md` component list, `overview/features.md` (new inline-disclosure capability), and
  `overview/architecture.md` (new `@radix-ui/react-accordion` dependency + the two new Roots
  motion keyframes) updated on completion.

### Out
- **Non-Radix / custom animation** (JS height measurement, spring physics) - v1 uses the Radix
  `data-[state]` height CSS-variable animation with the Roots keyframes; richer motion is a
  later concern.
- **Nested / tree accordions** and **grouped headings level control beyond a sensible default** -
  flat single-level stack for v1; nesting is a caller composition, not a new part.
- **Icon / rich trigger slots** beyond the label + chevron - callers pass children into the
  trigger; a dedicated icon-slot API is deferred.
- **Changing any existing component** - `Accordion` is additive; `Dialog`, `SideNav`, and the
  other Branches are untouched.
- **Introducing a second primitive library** - v1 stays on the Radix + 0005-recipe stack that
  every existing canopy component uses.

## Approach

**Primitive stack: Radix Accordion + the 0005 recipe.** Canopy is built entirely on Radix
primitives styled with the 0005 recipe; the accordion follows suit. `@radix-ui/react-accordion`
owns the hard parts - `type` single/multiple, `collapsible`, controlled/uncontrolled value,
roving keyboard focus, `data-state` attributes, and the `--radix-accordion-content-height` CSS
variable that drives the open/close height animation. It is a portalless primitive (the content
lives inline in the flow), so unlike `Dialog`/`Combobox` there is no portal or overlay to wire.
The dependency is added to `@rogueoak/canopy`'s `dependencies` and externalized in `tsup.config.ts`
(matching the externalization rule for every Radix dep), so the consumer installs one copy.

**Part surface (mirrors the shadcn accordion, canopy-styled).**
- `Accordion` - the Radix `Accordion.Root`, a thin styled wrapper forwarding `type`,
  `collapsible`, `value`/`defaultValue`/`onValueChange`, and native props. Discriminated props so
  `type="single"` implies a `string` value and `type="multiple"` implies `string[]`, matching
  Radix's own typing.
- `AccordionItem` - `Accordion.Item` with a bottom `border-border` divider (`border-b`), taking
  the required `value` and optional `disabled`.
- `AccordionTrigger` - `Accordion.Header` wrapping `Accordion.Trigger`: a full-width, left-aligned
  header button (`flex items-center justify-between`, `text-label text-text`, `py-4`,
  `hover:underline`, the shared focus-visible ring, `disabled:pointer-events-none
  disabled:opacity-50`) with a trailing chevron icon that carries
  `transition-transform data-[state=open]:rotate-180 motion-reduce:transition-none` so it rotates
  on open via Radix's `data-state` (no custom prop).
- `AccordionContent` - `Accordion.Content`: `overflow-hidden text-body text-text-muted` with the
  open/close animation `data-[state=open]:animate-accordion-down
  data-[state=closed]:animate-accordion-up motion-reduce:animate-none`, and an inner padding
  wrapper (`pb-4`) so padding does not fight the height animation.

**Styling & recipe.** FULL LITERAL semantic-token utility strings on every part (so Tailwind v4's
scanner emits each - never a computed class name), `cn()` merge with caller `className` winning,
`forwardRef` with `React.ComponentRef<typeof ...>` typing on each styled wrapper, native prop
spread, and **no `dark:` on the common path** - identical to 0005 and the other Branches. Only the
approved token vocabulary is used (`border-border`, `text-text`, `text-text-muted`, `text-label`,
`text-body`, the shared focus-visible ring); no palette utilities.

**Motion.** The height animation uses named Roots keyframes rather than inline CSS. `accordion-down`
animates height from `0` to `var(--radix-accordion-content-height)` and `accordion-up` the reverse;
both are declared once as `@keyframes` plus `--animate-accordion-down` / `--animate-accordion-up`
theme entries in `packages/roots/preset-motion.css` (added if missing), so the component references
`animate-accordion-down` / `animate-accordion-up` as literal utilities. Every animated element is
gated with `motion-reduce:animate-none` (and the chevron with `motion-reduce:transition-none`) so
reduced-motion users get an instant, non-animated toggle.

**Accessibility.** Radix supplies the header `button` with `aria-expanded` / `aria-controls`, the
content `region` wired by `id`, and the roving-focus keyboard model (Up/Down/Home/End across
triggers, Enter/Space to toggle). We only ensure the trigger renders inside `Accordion.Header` for
correct heading structure and that `disabled` items are inert. These a11y promises are guarded by
**observable tests** (trigger role + `aria-expanded` toggles, region reveals on open, keyboard
moves focus and toggles, disabled trigger does nothing), per the repo learning that a11y is proven
by outcomes, not by asserting scaffolding classes.

**Trade-offs.**
- *New dependency (`@radix-ui/react-accordion`)*: one more runtime dep on canopy, but it is the
  exact missing primitive - small, widely used, and consistent with the Radix family already
  vendored; hand-rolling roving focus + height animation would be more code to own and test.
  Security/architecture personas should weigh the new-dependency surface in review.
- *Radix height animation vs JS measurement*: the CSS-variable approach is simpler and
  dependency-free but ties the animation to Radix's `data-state`; accepted, since it matches the
  established named-keyframe motion idiom and needs no measurement code.
- *Branch layer*: `Accordion` owns interaction state (open sections, roving focus), so it is a
  Branch, not a Twig - consistent with the layer decision rule (state/portal -> Branch).

## Acceptance

- [ ] `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` ship from
      `@rogueoak/canopy/branches` (exported via `src/branches/index.ts`), built on
      `@radix-ui/react-accordion` (added to `packages/canopy/package.json` dependencies **and**
      externalized in `packages/canopy/tsup.config.ts`).
- [ ] Each part follows the 0005 recipe: full literal semantic-token utilities, `cn()` merge with
      caller `className` winning, `forwardRef` + `React.ComponentRef` typing + native prop spread,
      **no `dark:` on the common path**, approved token vocabulary only.
- [ ] `type="single"` opens one section at a time; `collapsible` lets the open one close on
      re-click; `type="multiple"` keeps several open; controlled (`value`/`onValueChange`) and
      uncontrolled (`defaultValue`) both work.
- [ ] The trigger chevron rotates 180 degrees on open via `data-[state=open]:rotate-180`; the
      content animates open/closed with `animate-accordion-down` / `animate-accordion-up`, gated by
      `motion-reduce:animate-none`.
- [ ] `accordion-down` / `accordion-up` `@keyframes` and `--animate-accordion-*` entries exist in
      the Roots preset (`packages/roots/preset-motion.css`); the component references them as
      literal utilities (no inline keyframes).
- [ ] a11y + keyboard: header `button` with `aria-expanded`/`aria-controls`, content `region`;
      Up/Down/Home/End move focus between triggers and Enter/Space toggles; a `disabled` item's
      trigger is inert.
- [ ] Storybook catalog entry `apps/storybook/src/Accordion.stories.tsx` with Playground, Single,
      Multiple, Collapsible, DisabledItem, DefaultOpen, and LongContent stories, importing from
      `@rogueoak/canopy/branches`; the Storybook build is green in light **and** dark.
- [ ] Tests (`Accordion.test.tsx`) cover: role render, click expands + toggles `aria-expanded`,
      single closes previous, collapsible closes open on re-click, multiple keeps several open,
      controlled + uncontrolled, keyboard focus + toggle, disabled inert, `className` merge (caller
      wins) per part, `ref` forwarding per part.
- [ ] `pnpm install`, `pnpm build`, `pnpm test`, and `pnpm lint` all pass from the repo root; text
      and source are ASCII-only.
- [ ] Canopy `README.md` component list includes Accordion; `overview/features.md` (new inline
      multi-section disclosure capability) and `overview/architecture.md` (new
      `@radix-ui/react-accordion` dependency + the two new Roots motion keyframes) updated on
      completion.
