# 0058 - Toast

## Problem

Canopy has modal surfaces - `Dialog` (0021) and `ResponsiveDialog` (0022) on
`@radix-ui/react-dialog`, and `Tooltip` on `@radix-ui/react-tooltip` - but no **transient
notification** primitive: a small, self-dismissing message that confirms an action ("Saved"),
reports a recoverable failure ("Could not save - retry"), or surfaces background news without
stealing focus or blocking the page. Today a consumer who needs "flash a success message after a
form submit" has to hand-roll a fixed-position region, an enqueue/dequeue queue, auto-dismiss
timers, swipe-to-dismiss, and the ARIA live-region wiring that screen readers need to announce
the message - exactly the cross-cutting concern the design system should own once.

shadcn ships a Toast built on `@radix-ui/react-toast` (its imperative queue plus a viewport and
the announced live region); canopy has the Radix stack and the 0005 recipe but not this piece.
This is for any app surface that performs an action and wants to confirm or report the result
without a modal: form saves, copy-to-clipboard, optimistic mutations, background sync. It is the
non-blocking sibling to the focus-trapping `Dialog` (0021) family and complements the inline,
in-flow `Alert` for messages that should appear, announce, and fade on their own.

## Outcome

- A new canopy component family, `Toast`, exported from `@rogueoak/canopy/branches`, built on
  `@radix-ui/react-toast`, with the shadcn-style part surface:
  - `ToastProvider` - the Radix provider that owns swipe direction and the default duration for
    all toasts beneath it.
  - `ToastViewport` - the fixed, corner-anchored region the toasts stack into (a real ARIA live
    region managed by Radix); rendered once near the app root.
  - `Toast` - a single notification with a `variant` of `default` / `success` / `danger`; slides
    in, auto-dismisses after its duration, and is swipe-dismissable.
  - `ToastTitle` / `ToastDescription` - the labelled title and supporting body, wired to the
    toast so assistive tech announces them.
  - `ToastAction` - an optional inline action button (e.g. "Undo"), with the `altText` Radix
    requires for the announced accessible action.
  - `ToastClose` - a labelled dismiss control (an "x") that closes the toast immediately.
- An **imperative API**: a `useToast` hook returning `toast(...)` (and a dismiss helper) that
  **enqueues** a toast from anywhere in the tree, plus a matching `Toaster` convenience that
  renders the provider + viewport and maps the queue to `Toast` instances, so the common case is
  `toast({ title, description, variant })` with no manual JSX.
- **States**: `default` (neutral surface), `success` (positive accent), `danger` (error accent);
  each themed only through semantic tokens. Toasts stack, newest first, and honor per-toast
  `duration` with hover/focus pausing (Radix behavior).
- **A11y**: the viewport is an `aria-live` region (`polite` for default/success, `assertive`-
  capable for `danger`) with `role="status"`/`role="alert"` semantics from Radix; `ToastAction`
  carries `altText`; `ToastClose` is a labelled `button`; `Escape` and swipe dismiss; nothing
  traps focus.
- **Theming**: styled with the 0005 recipe (full-literal semantic-token Tailwind utilities,
  `cn()` merge with caller-wins, `forwardRef` + native prop spread, `React.ComponentRef`), so it
  themes light/dark through the token layer with **no `dark:` on the common path**; the portalled
  viewport inherits `.dark` from `<html>` like `DialogContent`.
- **Motion**: reuses the existing fade/slide keyframes (`animate-fade-in/out` for opacity and the
  slide-in from the viewport edge), all gated with `motion-reduce:animate-none`.
- **Docs**: a Storybook catalog entry (Playground, the three variants, with-action, with-close,
  imperative `toast()` trigger, stacked, and reduced-motion) and canopy README + `overview/`
  living docs updated on completion.

## Scope

### In

- `packages/canopy/src/branches/Toast.tsx` (+ `Toast.test.tsx`) - the `Toast` component family
  (`ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`, `ToastDescription`, `ToastAction`,
  `ToastClose`), the `useToast` hook + `toast()` imperative enqueue API, and the `Toaster`
  convenience wrapper - exported from `packages/canopy/src/branches/index.ts`.
- `variant` `default` / `success` / `danger` via cva over full-literal semantic-token strings;
  swipe + auto-dismiss + hover-pause behavior inherited from `@radix-ui/react-toast`.
- One new runtime dependency on `@rogueoak/canopy`: **`@radix-ui/react-toast`**, added to
  `packages/canopy/package.json` `dependencies` **and** externalized in
  `packages/canopy/tsup.config.ts` `external: [...]` (alongside the other Radix deps), with
  `pnpm install` run at the repo root after.
- Storybook story at `apps/storybook/src/Toast.stories.tsx` importing from
  `@rogueoak/canopy/branches`, no per-story theme code (light/dark via toolbar).
- Stories: Playground, Variants (default/success/danger), WithAction (Undo), WithClose,
  Imperative (`useToast` + a button that fires `toast()`), Stacked (multiple queued), and
  ReducedMotion.
- Tests: renders and announces via a live region; each `variant` applies its token classes;
  `toast()` enqueues and the toast appears in the viewport; `ToastClose` dismisses (closed by
  observing removal, not a class); `ToastAction`'s `onClick` fires and its `altText` is present;
  auto-dismiss removes the toast after its duration (fake timers); `className` merge is
  caller-wins; `ref` forwards on the styled parts; keyboard/`Escape` dismiss.
- Canopy `README.md` component list, `overview/features.md` (new capability), and
  `overview/architecture.md` (new `@radix-ui/react-toast` primitive in the canopy dependency
  footprint) updated on completion.

### Out

- **Promise / async toasts** (`toast.promise(...)` with pending -> resolved/rejected states) -
  v1 ships the imperative enqueue and the three static variants; the promise helper is a clean
  follow-up.
- **Rich content slots** (custom icons per variant beyond a default, media, progress bars in the
  toast) - v1 is title + description + optional action/close; richer layouts wait.
- **Positioning presets** (multiple simultaneous corner viewports, per-toast placement) - v1
  renders a single caller-placed `ToastViewport`; multi-viewport orchestration is deferred.
- **Global singleton store outside React** (module-level `toast()` with no provider) - v1's queue
  lives under `ToastProvider`/`Toaster` via `useToast`; a provider-less singleton is a later call.
- Changing `Dialog` (0021), `ResponsiveDialog` (0022), `Tooltip`, or any other existing
  component - Toast is additive; do not touch unrelated components.

## Approach

**Primitive stack: Radix Toast (the shadcn-on-Radix toast).** Canopy is built entirely on Radix
primitives with the 0005 recipe; Toast follows suit. `@radix-ui/react-toast` provides exactly the
hard parts: the `Provider` (swipe direction + default duration), the portalled `Viewport` that is
a managed ARIA **live region** (so screen readers announce new toasts without us wiring
`aria-live` by hand), the `Root` with built-in **swipe-to-dismiss**, **auto-dismiss timers**, and
**hover/focus pause**, plus `Title`, `Description`, `Action` (with its required `altText` for the
announced action), and `Close`. It is added as a runtime **dependency** and externalized in tsup
like every other Radix dep, per the canopy externalization rule. This is a Branch (not a Seed or
Twig) because it owns interaction state and a portal - it matches the layer of `Dialog` (0021).

**Part surface (mirrors the shadcn toast, canopy-styled).**
- `ToastProvider` - thin wrapper over `Toast.Provider`; passes `swipeDirection` (default
  `right`) and a default `duration`.
- `ToastViewport` - `Toast.Viewport` styled as a fixed, corner-anchored, `z-50` stack
  (`fixed`, top/bottom-right by default, `gap`, `p-*`, a capped `max-w-*`); portalled under
  `<body>`, it inherits `.dark` from `<html>` (same note as `DialogContent` in 0021), so no
  per-portal theme wiring.
- `Toast` - `Toast.Root` with a cva mapping `variant` to full-literal token strings:
  `default` -> `bg-surface-raised text-text border-border`; `success` -> success accent
  (`border` + accent text/leading token); `danger` -> `bg-danger text-danger-foreground`
  (or the danger border/accent pair, resolved in build to match `Alert`), each with
  `rounded-md border shadow-md p-4`. Slide/fade motion via the reused keyframes below.
- `ToastTitle` (`text-label text-text`) / `ToastDescription` (`text-body-sm text-text-muted`) -
  labelled, wired to the root so the live region announces them together.
- `ToastAction` - `Toast.Action` styled like a compact `Button` affordance; **requires**
  `altText` (Radix) so the action is described when announced.
- `ToastClose` - `Toast.Close` as a labelled icon `button` (`aria-label` defaulting to
  `Close`, overridable), positioned top-right.

**Imperative API.** A small React context/reducer under `ToastProvider` holds the queue; the
`useToast` hook exposes `toast({ title, description, variant, action, duration })` (returns an id)
and `dismiss(id?)`. A `Toaster` convenience mounts `ToastProvider` + `ToastViewport` and maps the
queue to `Toast` instances, so the common path is `const { toast } = useToast(); toast({...})`
with no hand-written JSX. This mirrors shadcn's ergonomics while keeping the declarative parts
available for full control.

**Styling & recipe.** FULL LITERAL token utility strings (so Tailwind v4's scanner emits each -
no dynamic `bg-${variant}`), `cn()` merge with caller-wins, `forwardRef` on every styled wrapper
with a native prop spread, `React.ComponentRef` for ref types, semantic tokens only, and **no
`dark:` on the common path**. Raised surface (`bg-surface-raised`) for the default toast per the
raised-surface rule, since the viewport floats above the page. Focus rings use the shared
`focus-visible:ring-*` token set on `ToastAction`/`ToastClose`.

**Accessibility.** Radix's viewport is the live region and manages `role`/`aria-live`
(`status`/polite for default+success, and the assertive path available for `danger`); we do not
re-implement it. `ToastAction` carries `altText`; `ToastClose` is a real labelled `button`;
dismissal works via `Escape`, swipe, the close button, or auto-timeout; focus is never trapped.
Per the repo learning, a11y is guarded by **observable** tests (the toast is announced/rendered in
the live region, the action fires, the close button is labelled and removes the toast), not by
asserting scaffolding classes.

**Motion.** Reuse the existing fade/slide keyframes - `animate-fade-in` / `animate-fade-out` for
opacity, plus a slide from the viewport edge keyed off Radix's `data-state` / `data-swipe`
attributes - all gated with `motion-reduce:animate-none` so reduced-motion users get an instant,
static toast. No new keyframe is introduced inline; if a dedicated `toast-slide-in/out` is needed
it is added to the Roots preset (not inline), per the motion rule.

**Trade-offs.**
- *Radix Toast vs hand-rolled queue*: staying on Radix keeps one primitive family and gives the
  managed live region, swipe, and timers for free; the cost is adopting Radix's queue semantics
  for the imperative layer, which we wrap. Accepted for consistency and correctness.
- *New dep (`@radix-ui/react-toast`)*: one more runtime dep on canopy, small and from the same
  Radix family already all over the dependency footprint; vendoring the live-region + swipe logic
  would be far more code to own. **Security/architecture personas should weigh the new-dependency
  surface in review.**
- *`Toaster` convenience + declarative parts*: shipping both an imperative `toast()` and the raw
  parts is a slightly larger surface, but matches shadcn ergonomics and keeps full control
  available. Accepted.

## Acceptance

- [ ] `Toast` and its parts (`ToastProvider`, `ToastViewport`, `Toast`, `ToastTitle`,
      `ToastDescription`, `ToastAction`, `ToastClose`) plus `useToast`/`toast()` and the
      `Toaster` convenience ship from `@rogueoak/canopy/branches` (exported via
      `branches/index.ts`), built on `@radix-ui/react-toast`.
- [ ] `@radix-ui/react-toast` added to `packages/canopy/package.json` `dependencies` **and**
      externalized in `packages/canopy/tsup.config.ts`; `pnpm install` run at the repo root.
- [ ] Recipe obeyed: full-literal semantic-token classes, `cn()` caller-wins merge, `forwardRef`
      + native prop spread, `React.ComponentRef`, semantic tokens only, and **no `dark:` on the
      common path**; the portalled viewport themes light **and** dark via the token layer.
- [ ] `variant` `default` / `success` / `danger` each render their token classes; `default` uses
      `bg-surface-raised` (raised-surface rule).
- [ ] Imperative `toast({ title, description, variant })` enqueues and the toast appears in the
      viewport; `dismiss` removes it.
- [ ] A11y: the viewport is an announced live region; `ToastAction` carries `altText` and its
      `onClick` fires; `ToastClose` is a labelled `button` that dismisses; `Escape` and
      auto-timeout dismiss; no focus trap - all proven by observable tests (announced/removed,
      not class assertions).
- [ ] Motion reuses the fade/slide keyframes and is gated with `motion-reduce:animate-none`.
- [ ] Storybook catalog entry with Playground, Variants (default/success/danger), WithAction,
      WithClose, Imperative (`useToast` trigger), Stacked, and ReducedMotion stories;
      `pnpm storybook` build is green in both themes.
- [ ] Tests cover: renders + announces via live region; each variant's token classes;
      `toast()` enqueues + appears; `ToastClose` dismisses; `ToastAction` onClick + `altText`;
      auto-dismiss after duration (fake timers); `className` caller-wins merge; `ref` forwarding;
      keyboard/`Escape` dismiss.
- [ ] `pnpm install` / `pnpm build` / `pnpm test` / `pnpm lint` all pass from the repo root.
- [ ] Canopy `README.md` component list includes Toast; `overview/features.md` (new capability)
      and `overview/architecture.md` (new `@radix-ui/react-toast` primitive in the canopy
      dependency footprint) updated on completion.
