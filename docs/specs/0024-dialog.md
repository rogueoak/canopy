# 0024 — Dialog (the Branches recipe)

## Problem

The Twigs layer (molecules) is live — FormField, SearchBar, Card (specs 0020-0022). The next
atomic tier is **Branches (organisms)**: larger assemblies that compose **Seeds _and_ Twigs**
into a self-contained piece of UI. Per the README's layer model
(`Roots → Seeds → Twigs → Branches → Boughs`), Branches ship on a new
`@rogueoak/canopy/branches` subpath, parallel to `./seeds` and `./twigs`.

**Dialog** is the right vehicle to open the layer. It is the canonical organism — a modal that
owns focus management, scroll lock, and an overlay scrim, and that **composes lower layers** (a
Button to trigger/close, a FormField or Card inside its body). It is also the **third portalled
surface** (after Select 0013 and Tooltip 0014), so it reinforces — rather than invents — the
established raised-surface pattern (`surface-raised` + `border`, item fills on `muted-raised`),
and it consumes the **pre-provisioned `color-overlay` token** (light `stone-900` / dark
`stone-950`, authored in 0004 "used at reduced opacity behind modals") — so the first Branch
adds **no new token**, mirroring how the interaction-state tokens were ready before Button.

This spec is deliberately the **heavy one of the Branches group** (as 0020 was for Twigs): it
carries the shared infra — the `./branches` subpath export, its tsup entry, the
`src/branches/index.ts` barrel, the Storybook **Branches** section — **plus** Dialog. The
sibling nav specs (0025 TopNav, 0026 SideNav) reference the recipe established here and stay
small — one independently shippable component each, per the protocol's "one spec = one feature =
one PR" rule.

Audience: rogueoak app teams building modals/confirmations, and us (locking the Branches recipe).

## Outcome

When done:

- `@rogueoak/canopy/branches` exists and exports an accessible, themed `Dialog` family.
- The **Branches composition recipe** is proven end-to-end: a stateful, portalled compound
  (root + parts) that **composes Seeds and Twigs**, owns behaviour/a11y through Radix, styled
  with semantic tokens only (no new token, no per-component theme code) — light/dark "just works"
  via the token layer.
- The distribution seam extends cleanly: `./branches` is a new tsup entry + export subpath; the
  consumer's existing `@source '@rogueoak/canopy'` already covers the new files (no styling-seam
  change).
- Dialog is a focus-trapping, escape/overlay-dismissible modal: a scrim on `color-overlay`, a
  portalled content card on the raised-surface pattern, with `aria-modal` + labelled/described
  wiring, and **reduced-motion-safe** enter/exit transitions.
- Storybook gains a real **Branches** section; Dialog has stories (basic, with a FormField body,
  destructive confirmation, controlled · both themes) and tests (open/close paths, focus trap,
  ARIA wiring, ref forwarding).

## Scope

### In

- **Dialog** — built on **`@radix-ui/react-dialog`**, exposing the shadcn-shaped surface area:
  - `Dialog` — the stateful root (owns `open` / `onOpenChange`; controlled or uncontrolled via
    `defaultOpen`).
  - `DialogTrigger` — opens the dialog; `asChild` to wrap a Button Seed.
  - `DialogContent` — portalled (`DialogPrimitive.Portal`) content card on `bg-surface-raised` +
    `border` + the primitive `shadow-lg`, centred, `max-w-lg` default, with a built-in close
    affordance (an `X` icon button, `aria-label="Close"`, on the `muted-raised` hover fill). Owns
    focus trap, return-focus, scroll lock, and `Esc`-to-close (Radix).
  - `DialogOverlay` — the scrim, `bg-overlay/80` (the pre-provisioned `color-overlay` token at
    reduced opacity), covering the viewport; clicking it closes (Radix default; can be disabled by
    the consumer via `onPointerDownOutside`).
  - `DialogHeader` / `DialogFooter` — layout slots (a stacked header region; a right-aligned,
    horizontally-stacked footer for action Buttons).
  - `DialogTitle` — the accessible title (`DialogPrimitive.Title`), `text-h3` role; wired as
    `aria-labelledby`.
  - `DialogDescription` — muted supporting copy (`DialogPrimitive.Description`, `text-body-sm`
    `text-text-muted`); wired as `aria-describedby`.
  - `DialogClose` — closes the dialog; `asChild` to wrap a Button (e.g. a "Cancel" in the footer).
- **Branches-layer infra (lives here):** `src/branches/index.ts` barrel; tsup `branches/index`
  entry + `./branches` export subpath in `package.json`; `@radix-ui/react-dialog` added to
  `dependencies` **and** tsup `external`; a Storybook **Branches** section.
- **Accessibility** — `role="dialog"` + `aria-modal`, focus moves into the dialog on open and
  returns to the trigger on close, focus is trapped while open, `Esc` closes, the title/description
  drive `aria-labelledby` / `aria-describedby`. (All Radix-provided; this spec wires and verifies
  them.)
- **Reduced motion** — the open/close fade + zoom transitions are gated with
  `motion-reduce:transition-none` / `motion-reduce:animate-none`, so a reduced-motion user gets an
  instant show/hide.
- **Stories** — basic (trigger → titled/described dialog), a **form** dialog (a FormField Twig in
  the body, Cancel/Save footer Buttons), a **destructive confirmation** (danger Button), and a
  **controlled** example — all in light and dark.
- **Tests** — opens from the trigger; closes via the close button, `Esc`, and overlay click;
  focus moves in on open and returns to the trigger on close; `aria-modal` + `aria-labelledby` /
  `aria-describedby` are wired; ref forwards to the content element.

### Out

- **Non-modal / drawer / sheet variants** (side-anchored, `aria-modal=false`) — Dialog is the
  centred modal; a `Drawer`/`Sheet` Branch (and any reuse by SideNav's mobile menu) is a later
  spec.
- **AlertDialog** (the role-`alertdialog`, no-overlay-dismiss confirmation primitive) — a sibling
  later; the destructive *story* here is a regular Dialog, not the `alertdialog` role.
- **Imperative/promise-based `confirm()` helper** — declarative compound only; a hook/helper can
  come later.
- **TopNav / SideNav** → their own specs (0025 / 0026), each referencing this recipe.

## Approach

- **Stateful portalled compound + Radix** is the Branches recipe's behavioural core. Where a Twig
  coordinates atoms through a small context (FormField), a Branch additionally **owns interaction
  state and a portal** — Radix Dialog supplies the state machine (open/close), the focus trap,
  return-focus, scroll lock, and the ARIA contract, so the component is composition + token
  styling, not hand-rolled focus management.
- **Composes Seeds and Twigs, adds no token.** The trigger/close/footer are Button Seeds
  (`asChild`); the body composes whatever the consumer passes, including Twigs (a FormField, a
  Card). The scrim uses the **existing** `color-overlay` token at reduced opacity; the content
  reuses the **existing** raised-surface tokens (`surface-raised` + `border`, close-button hover
  on `muted-raised`). No new token, no `dark:` on the common path.
- **Portals theme for free.** Because `.dark` lives on `<html>`, the portalled content + overlay
  (mounted under `<body>`) inherit the theme — the same property proven by Select and Tooltip; the
  common-path semantic utilities just work.
- **Same Seeds/Twigs rules** — `cn()` merge, **full-literal** class strings (the Tailwind-scanner
  constraint), `forwardRef` + native prop spread on every styled part, `React.ComponentRef` (not
  `ElementRef`) for Radix refs.
- **Testing** — Vitest + Testing Library + `user-event` assert the *behaviour* the organism
  guarantees (open/close paths, focus movement, ARIA), not the class strings.

### Decision (locked) — distribution subpath
Branches ship as a **new `./branches` subpath** (`@rogueoak/canopy/branches`), parallel to
`./seeds` and `./twigs`, not folded into `./twigs`. A new tsup entry (`branches/index`) emits
`dist/branches/index.js` + `.d.ts`; `package.json` `exports` adds the `./branches` map. The
layer boundary is **one-way**: branches import twigs and seeds, never the reverse. The
consumer's existing `@source '@rogueoak/canopy'` already covers the new files, so no styling-seam
change.

### Decision (locked) — overlay token, not a new one
The scrim uses the **pre-provisioned** `color-overlay` semantic token (`bg-overlay`) at reduced
opacity — it was authored in 0004 explicitly "used at reduced opacity behind modals." So the first
Branch adds **no token**, keeping "a Branch is themed by the layers it composes / the tokens
already provisioned." If a future portalled Branch needs a true elevation **shadow** token (the
open half of feedback 0006), that is a Roots spec, not this one — Dialog uses the primitive
`shadow-lg` like the other portalled surfaces.

## Acceptance

- [ ] `@rogueoak/canopy/branches` subpath exists (tsup entry + `exports` map) and exports the
      `Dialog` family; semantic tokens only, light **and** dark, no per-component theme code.
- [ ] Dialog opens from its trigger and closes via the close button, `Esc`, **and** overlay click;
      focus moves into the dialog on open and **returns to the trigger** on close; focus is trapped
      while open.
- [ ] `role="dialog"` + `aria-modal`, with `aria-labelledby` (DialogTitle) and `aria-describedby`
      (DialogDescription) wired; the overlay scrim uses `color-overlay`.
- [ ] The content is portalled and reads correctly in **both** themes (raised-surface pattern);
      enter/exit motion is **reduced-motion-safe**.
- [ ] Dialog composes a **Twig** in its body (a FormField story) and Button Seeds for
      trigger/close/footer — proving Branches compose lower layers.
- [ ] Storybook **Branches** section exists; Dialog stories cover basic, form-body, destructive
      confirmation, and controlled — in both themes.
- [ ] Tests (open/close paths + focus movement + ARIA wiring + ref forwarding) pass; `pnpm build`,
      `pnpm test`, `pnpm lint`, `pnpm format:check` green.
- [ ] README + `docs/overview/` updated (Branches layer + subpath); developer sign-off on Dialog
      in Storybook.
