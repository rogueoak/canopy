# 0031 - ResponsiveDialog (dialog on desktop, bottom sheet on mobile)

## Problem

`Dialog` (spec 0024) is a centred modal: a card fixed at `left-1/2 top-1/2` with a
`-translate(-50%, -50%)`. That is the right form on a wide viewport, but on a phone it is the
wrong one - a centred card is hard to reach one-handed, and a tall form pinned to the vertical
centre pushes its own content off the top and bottom edges as the on-screen keyboard opens. The
platform-native form on mobile is a **bottom sheet**: anchored to the bottom edge, sliding up into
thumb reach, growing upward and scrolling internally.

Consumers (the Branch Out data studio first) hit this the moment a Dialog is opened on a phone: the
edit form is effectively uninteractable. We want a single component that renders the **right form
per viewport** without the consumer branching by hand or duplicating the `role="dialog"` landmark.

The motion layer already ships the off-canvas drawer slide (`animate-drawer-*`, spec 0026); a
bottom sheet is the same idea on the Y axis, so the Roots preset gains a `bottom-sheet-*` sibling
rather than anything bespoke.

Audience: rogueoak app teams building modals that must work on phones; the data studio.

## Outcome

When done:

- `@rogueoak/canopy/branches` exports a `ResponsiveDialog` family that mirrors `Dialog`
  one-for-one, so a consumer swaps `Dialog*` -> `ResponsiveDialog*` with no other change.
- On viewports `>= 768px` it is **pixel-identical to `Dialog`** (it delegates to `DialogContent`).
- On viewports `< 768px` it renders a **bottom sheet**: full-width, bottom-anchored, capped at
  `85vh` and internally scrollable, rounded at the top, with a grab-handle affordance, sliding up
  via `animate-bottom-sheet-in`.
- The breakpoint is the design system's single mobile query (`max-width: 767px`, shared with
  SideNav) via a new exported `useMediaQuery` / `useIsMobile` hook; a `mobile` prop on the content
  overrides it for SSR/first paint or tests.
- Behaviour and a11y (focus trap, scroll lock, return focus, `Esc`, scrim dismiss, `aria-modal` /
  `aria-labelledby` / `aria-describedby`) are Radix's, shared by both forms - only geometry and
  motion differ.
- No new token. The sheet reuses `surface-raised` / `border` / `overlay/80` and the
  `bottom-sheet-*` motion utilities added to the Roots preset (composing the `--duration-*` /
  `--ease-*` tokens, like every other `animate-*`).

## Approach

- **Roots motion (`packages/roots/preset-motion.css`).** Add `@keyframes bottom-sheet-in/out`
  (`translateY(100%)` <-> `translateY(0)`) and the `--animate-bottom-sheet-in/out` theme vars,
  composing the existing duration/ease tokens exactly as `drawer-*` does. Folded into
  `dist/tailwind-preset.css` by the existing idempotent build step - every preset consumer gets the
  utilities for free.
- **Shared breakpoint hook (`src/lib/useMediaQuery.ts`).** Extract the `matchMedia` pattern SideNav
  inlined into an exported `useMediaQuery(query)` + `useIsMobile()` (+ `MOBILE_QUERY`). SSR returns
  `false`; an effect tracks `change`. Exported from the package root.
- **`ResponsiveDialog` (`src/branches/ResponsiveDialog.tsx`).** Root/Trigger/Close are the Radix
  primitives (identical to `Dialog`). Only `ResponsiveDialogContent` branches: `!mobile` delegates
  to canopy `DialogContent` verbatim (guaranteeing desktop parity and reusing its overlay + close);
  `mobile` renders a bottom-anchored `DialogPrimitive.Content` (grab handle + built-in `X`).
  Header/Footer/Title/Description are the `Dialog` slots re-used unchanged (the footer already
  stacks on mobile). `mobile?: boolean` on the content is the SSR/test override.
- **Barrel + tests.** Export the family from `src/branches/index.ts`; a parameterised test suite
  exercises both forms (open, a11y wiring, all three dismiss paths, ref) plus form-selection
  assertions.

## Out of scope

- Drag-to-dismiss / snap points on the sheet (a gesture layer; the sheet dismisses via scrim, `X`,
  and `Esc` like any dialog).
- A top/left/right sheet variant - only the bottom sheet is motivated here.
- `alertdialog` semantics (unchanged from 0024).
