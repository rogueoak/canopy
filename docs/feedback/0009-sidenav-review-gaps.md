# 0009 - SideNav review gaps: a split public surface and an untested a11y promise

Two majors surfaced in the persona review of SideNav (spec 0026, PR #31). Both are general
component-design / testing traps, not SideNav quirks.

## (a) A split public surface - `className` silently no-op'd on mobile

### Symptom

SideNav renders two structurally different forms (a desktop `<aside>` rail and a mobile Radix
drawer). The forwarded `ref`, `className`, and `{...props}` landed on the `<aside>` on desktop but
on the inner `<nav>` on mobile. So a caller's `className` (and a `ref` typed against the rail)
targeted **different conceptual elements** depending on viewport - and a consumer styling "the rail"
saw their class applied to the panel on desktop and to an unstyled inner wrapper on mobile. Nothing
errored; the class was just silently on the wrong element below the breakpoint.

### Root cause

When a component forks into multiple render shapes, the public surface (the element a caller's
`ref`/`className`/native props attach to) has to be chosen **per branch**, and the two branches drifted:
the styled panel is the `<aside>` on desktop but the `DialogPrimitive.Content` on mobile, yet the
props were wired to the `<nav>` in the mobile branch. The two forms didn't agree on which element is
"the rail."

### Fix

Route `ref` + `className` + `{...props}` to the **styled panel** in both forms - the `<aside>`
(desktop) and `DialogPrimitive.Content` (mobile, merging `className` into the drawer classes). The
inner `<nav aria-label>` becomes a static landmark wrapper in both forms (no ref/className/props).
Documented on `SideNavProps` that the forwarded ref is the rail panel (`<aside>` on desktop, the
drawer `div` on mobile, `null` while the drawer is closed).

### Learning

When a component renders more than one structural form, the public surface must land on the **same
conceptual element** in every form, or a caller's `className`/`ref` silently targets different things
across states. Pick the styled element as the surface in each branch and keep them in lockstep.

## (b) The headline a11y promise shipped untested

### Symptom

SideNav's collapsed-rail promise is "an icon-only item still surfaces its label, via a Tooltip on
hover/focus." The tests asserted only the **`sr-only`** half (the label stays in the accessible name
when collapsed) - the actual Tooltip behaviour (focus the collapsed item → the label appears in a
`role="tooltip"`) was never exercised. The component's marquee accessibility feature could have
regressed (a broken `TooltipProvider`, a dropped trigger) with every test still green.

### Root cause

The test validated the **scaffolding** (a hidden label node exists) rather than the **behaviour** the
scaffolding exists to enable (the label becomes perceivable on focus). A passing `sr-only` assertion
reads like coverage but proves nothing about the Tooltip.

### Fix

Add a test that renders collapsed, focuses a `SideNavItem`, and asserts
`await screen.findByRole('tooltip')` resolves with the label text - testing the real a11y outcome.

### Learning

Test the **actual accessibility behaviour**, not its scaffolding: assert the label becomes perceivable
(a `role="tooltip"` appears on focus), not merely that an `sr-only` node exists. A headline a11y
promise needs a test that would fail if the promise broke.
