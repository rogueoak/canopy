# 0053 - AlertDialog

## Problem

Canopy has a `Dialog` (0024) for general modal content, but no **AlertDialog**: the
confirmation modal you interrupt a user with before a **destructive or otherwise irreversible**
action ("Delete this project?", "Discard unsaved changes?"). The two look alike but differ where
it matters. A `Dialog` is dismissable by design - click the scrim, press `Esc`, hit the `X` - so
a stray click makes it go away, which is exactly wrong for a confirm-before-delete prompt. An
alert dialog must be **blocking**: no click-outside dismiss, no `Esc`-to-cancel by default, an
explicit Cancel and a deliberate destructive Action, and the tighter `role="alertdialog"`
semantics so assistive tech announces it as an interruption that expects a response.

Radix ships these differences as a separate primitive, `@radix-ui/react-alert-dialog` (distinct
`role`, no `X`, no interact-outside close), and shadcn treats AlertDialog as a component sibling
to Dialog rather than a variant of it. Canopy should mirror that: today a consumer wanting a
delete confirmation either mis-uses `Dialog` (getting a dismissable modal where they need a
blocking one, plus hand-wiring a danger button) or hand-rolls the alert semantics - the kind of
thing the design system exists to own once. This is for any app surface that gates a risky
action: delete/remove/discard/leave-page/revoke prompts across dashboards and settings screens.
It belongs in canopy as the confirmation sibling to `Dialog` (0024) and `ResponsiveDialog`
(0031), reusing the same overlay scrim, raised-surface card, and dialog motion tokens, and
composing the existing `Button` (0005, `destructive` variant) for the Action.

## Outcome

- A new canopy Branch family, `AlertDialog`, exported from `@rogueoak/canopy/branches`, built on
  `@radix-ui/react-alert-dialog`, with parts mirroring the shadcn/Radix surface: `AlertDialog`
  (stateful root, controlled via `open`/`onOpenChange` or uncontrolled via `defaultOpen`),
  `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`,
  `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, and `AlertDialogCancel`.
- **Blocking by default**: the content advertises `role="alertdialog"`, traps focus, locks
  scroll, and returns focus on close (all Radix). It does **not** dismiss on click-outside or on
  `Esc` - the only way out is `AlertDialogAction` or `AlertDialogCancel`. There is no `X` close
  affordance (unlike `DialogContent`).
- **Action styled as danger**: `AlertDialogAction` renders as a destructive `Button` (the 0005
  `destructive` variant tokens: `bg-danger text-danger-foreground hover:bg-danger-hover
  active:bg-danger-active`); `AlertDialogCancel` renders as a neutral/outline button. Focus lands
  on Cancel by default so the safe choice is the default action.
- **A11y**: `role="alertdialog"`, `aria-modal`, title wired as `aria-labelledby` and description
  as `aria-describedby` (Radix); full keyboard operation - `Tab`/`Shift+Tab` cycle within the
  trap, `Enter`/`Space` activate the focused button. Guarded by observable tests.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**; the portalled overlay + card theme correctly the
  same way `DialogContent` does (portal under `<body>`, `.dark` on `<html>`).
- **Motion**: reuses the existing `animate-dialog-overlay-in/out` and `animate-dialog-content-in/out`
  keyframes from the Roots preset, gated with `motion-reduce:animate-none` - no new keyframe.
- **Docs**: a Storybook catalog entry (Playground, destructive-confirm, controlled, long-content)
  and canopy `README.md` + `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/branches/AlertDialog.tsx` (+ `AlertDialog.test.tsx`) - the component
  family and its parts, exported from `packages/canopy/src/branches/index.ts` (the Branch
  barrel).
- Parts: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`,
  `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`,
  `AlertDialogCancel`, plus the matching `*Props` type exports.
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-alert-dialog`**, added to
  `packages/canopy/package.json` dependencies **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (matching the other `@radix-ui/*` deps),
  with `pnpm install` run at the repo root after.
- Blocking behaviour: `role="alertdialog"`, focus trap, scroll lock, return-focus; **no**
  click-outside dismiss and **no** `Esc`-to-close by default; no `X` affordance.
- `AlertDialogAction` styled as the `destructive` Button; `AlertDialogCancel` as a neutral
  button; both close the dialog when clicked (Radix `Action`/`Cancel`).
- Reuse of the existing dialog overlay scrim (`bg-overlay/80`), raised-surface card
  (`bg-surface-raised` + `border border-border` + `rounded-lg` + `shadow-lg` + `p-6`), and the
  `animate-dialog-*` motion utilities - no new token, no new keyframe.
- Storybook story in `apps/storybook/src/AlertDialog.stories.tsx`. Stories: **Playground**;
  **DestructiveConfirm** (delete-style prompt with danger Action + Cancel); **Controlled**
  (open state driven by `open`/`onOpenChange`); **LongContent** (scrollable body / long
  description) - each rendering correctly in light and dark via the toolbar.
- Tests (Vitest + Testing Library): opens on trigger click; content exposes `role="alertdialog"`;
  title/description are wired (accessible name/description present); clicking outside the card
  does **not** close it; pressing `Esc` does **not** close it; `AlertDialogAction` and
  `AlertDialogCancel` each close it and fire their `onClick`; focus is trapped and moves to Cancel
  by default; controlled (`open`/`onOpenChange`) **and** uncontrolled (`defaultOpen`) both work;
  caller `className` merges (caller wins); `ref` forwards on the styled wrappers.
- Updates on completion: canopy `README.md` component list, `docs/overview/features.md` (new
  confirmation-modal capability), and `docs/overview/architecture.md` (new
  `@radix-ui/react-alert-dialog` primitive in the canopy dependency footprint).

### Out
- **Replacing or changing `Dialog` (0024) or `ResponsiveDialog` (0031)** - AlertDialog is
  additive and sits beside them; their public APIs are untouched.
- **A responsive drawer/sheet variant** of the alert (a `ResponsiveAlertDialog`) - defer to a
  follow-up if wanted, matching how 0031 followed 0024.
- **A convenience `confirm()`-style imperative helper / promise-returning hook** - v1 ships the
  declarative part family only; an imperative wrapper is a clean later spec.
- **Opt-in dismissal props** (e.g. an `Esc`-to-cancel escape hatch) - v1 is blocking by default;
  callers who want dismissal should use `Dialog`. Any opt-in override is deferred.
- Changing any unrelated component; no new design tokens or keyframes.

## Approach

**Primitive stack: `@radix-ui/react-alert-dialog` + the 0005 recipe.** Canopy is built entirely
on Radix primitives, and `Dialog` (0024) already establishes the Branch pattern (portal + Radix
state machine + raised-surface card). AlertDialog is the confirmation sibling and uses Radix's
**dedicated** alert-dialog primitive rather than re-configuring `Dialog`, because Radix bakes the
differences in: `AlertDialog.Content` emits `role="alertdialog"` (not `dialog`), ships no `X`,
and by default does not close on pointer-down-outside or `Esc`. Building on the purpose-made
primitive keeps the blocking contract correct without us hand-suppressing dismissal on `Dialog`.
The new dependency is added to `packages/canopy/package.json` and **externalized** in
`packages/canopy/tsup.config.ts` alongside the other `@radix-ui/*` externals, per the canopy
externalization rule.

**Part surface (mirrors shadcn/Radix AlertDialog, canopy-styled).**
- `AlertDialog` = `AlertDialogPrimitive.Root` - the stateful root (`open`/`onOpenChange`,
  `defaultOpen`).
- `AlertDialogTrigger` = the primitive `Trigger`; `asChild` to wrap a `Button` Seed.
- `AlertDialogContent` - a `forwardRef` wrapper that renders `AlertDialogPrimitive.Portal` over an
  internal overlay (`AlertDialogPrimitive.Overlay` with `fixed inset-0 z-50 bg-overlay/80` +
  `data-[state]` fade), then the centred `AlertDialogPrimitive.Content` card on the shared
  raised-surface tokens (`fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2
  -translate-y-1/2 gap-4 rounded-lg border border-border bg-surface-raised p-6 text-text
  shadow-lg` + the `animate-dialog-content-in/out` utilities, `motion-reduce:animate-none`). The
  overlay is module-internal (not exported), matching `DialogContent`'s baked-in scrim, to avoid a
  double-scrim footgun. No `X` close button.
- `AlertDialogHeader` / `AlertDialogFooter` - layout slots reusing the Dialog idiom
  (`flex flex-col gap-1.5 text-left` header; `flex flex-col-reverse gap-2 sm:flex-row
  sm:justify-end` footer). The header needs no `pr-6` since there is no corner `X`.
- `AlertDialogTitle` = the primitive `Title` in the `text-h3` role (wired `aria-labelledby`).
- `AlertDialogDescription` = the primitive `Description`, `text-text-muted text-body-sm` (wired
  `aria-describedby`).
- `AlertDialogAction` = the primitive `Action`, styled with the `buttonVariants({ variant:
  'destructive' })` token string (full literal, so Tailwind v4's scanner emits it) - the danger
  Button look, since the alert's affirmative choice is the risky one. Accepts `className` merged
  via `cn()` so a caller can override to a non-danger action when appropriate.
- `AlertDialogCancel` = the primitive `Cancel`, styled with the neutral/outline `buttonVariants`
  string; it is the default-focused control (Radix focuses `Cancel` on open), so the safe path is
  the default.

**Styling & recipe.** FULL LITERAL semantic-token utility strings (no dynamic class construction),
`cn()` merge with caller `className` winning, `forwardRef` on every styled wrapper with a native
prop spread, `React.ComponentRef<typeof ...>` for ref types (not the deprecated
`React.ElementRef`), and displayNames off the primitive. **Semantic tokens only** and **no `dark:`
on the common path** - light/dark flips through the token layer (0004) and the portalled surfaces
theme correctly because `.dark` lives on `<html>`. Action/Cancel reuse `buttonVariants` from
`Button` (0005) rather than re-authoring button styling; Branches importing a Seed is the allowed
direction (Branches -> Twigs -> Seeds), never upward.

**Accessibility.** Radix supplies `role="alertdialog"`, `aria-modal`, the focus trap,
return-focus, scroll lock, and the `aria-labelledby`/`aria-describedby` wiring from Title/
Description; the blocking contract (no interact-outside close, no `Esc` close) is the primitive's
default and is left intact. We guard these with **observable** tests (role present, name/
description exposed, outside-click and `Esc` do not close, Action/Cancel close and fire), per the
repo learning that a11y is proved by outcomes, not by asserting class names.

**Motion.** Reuses the existing `animate-dialog-overlay-in/out` and `animate-dialog-content-in/out`
keyframes shipped from the Roots preset (the same ones `Dialog` uses), gated with
`motion-reduce:animate-none` so reduced-motion users get an instant show/hide. No new keyframe is
added.

**Trade-offs / decisions.**
- *Separate primitive vs re-configuring Dialog*: using `@radix-ui/react-alert-dialog` costs one
  more runtime dependency but yields the correct `alertdialog` role and blocking default for free;
  suppressing dismissal on `Dialog` by hand would be more code and easier to get subtly wrong.
  Accepted.
- *New dependency*: `@radix-ui/react-alert-dialog` is small, first-party Radix, and matches the
  existing primitive family - but it is still new dependency surface. Security and architecture
  personas should weigh it in review (it is a sibling to the already-vendored
  `@radix-ui/react-dialog`, so the marginal footprint is minimal).
- *Danger Action by default*: styling `AlertDialogAction` as `destructive` fits the dominant
  delete/discard use case and is overridable via `className`; a rarely-needed non-destructive
  confirm is the caller's opt-out, keeping the common case one prop-free.

## Acceptance

- [ ] `AlertDialog` and its parts (`AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`,
      `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`,
      `AlertDialogAction`, `AlertDialogCancel`) ship from `@rogueoak/canopy/branches`, exported via
      `packages/canopy/src/branches/index.ts` with their `*Props` types.
- [ ] Built on `@radix-ui/react-alert-dialog`, added to `packages/canopy/package.json` dependencies
      **and** externalized in `packages/canopy/tsup.config.ts`; `pnpm install` run at the root.
- [ ] Recipe obeyed: full literal semantic-token utility classes, `cn()` merge (caller wins),
      `forwardRef` + native prop spread, `React.ComponentRef` ref types, **no `dark:` on the common
      path**, no new token or keyframe.
- [ ] Content exposes `role="alertdialog"` with `aria-modal`; Title is the accessible name and
      Description the accessible description; focus is trapped and lands on Cancel by default.
- [ ] Blocking by default: clicking the overlay/outside does **not** close it, and `Esc` does
      **not** close it; there is no `X` close affordance.
- [ ] `AlertDialogAction` renders with the `destructive` Button tokens and `AlertDialogCancel` with
      the neutral tokens; each closes the dialog and fires its `onClick`.
- [ ] Keyboard: `Tab`/`Shift+Tab` cycle within the trap; `Enter`/`Space` activate the focused
      button.
- [ ] Controlled (`open`/`onOpenChange`) **and** uncontrolled (`defaultOpen`) both work.
- [ ] Overlay + card theme correctly in light **and** dark; motion uses `animate-dialog-*`, gated
      with `motion-reduce:animate-none`.
- [ ] Storybook catalog entry (`apps/storybook/src/AlertDialog.stories.tsx`) with Playground,
      DestructiveConfirm, Controlled, and LongContent stories; `pnpm storybook` build is green in
      both themes.
- [ ] Tests cover: opens on trigger; `role="alertdialog"`; title/description wired; outside-click
      does not close; `Esc` does not close; Action closes + fires; Cancel closes + fires; focus
      trapped / default on Cancel; controlled and uncontrolled; `className` merge (caller wins);
      `ref` forwards. `pnpm test`, `pnpm lint`, and `pnpm build` pass from the root.
- [ ] Canopy `README.md` component list includes AlertDialog; `docs/overview/features.md`
      (confirmation-modal capability) and `docs/overview/architecture.md` (new
      `@radix-ui/react-alert-dialog` primitive in the canopy dependency footprint) updated on
      completion.
