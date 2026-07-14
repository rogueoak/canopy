# 0016 - A static screenshot verifies layout, not motion

## Symptom

The Storybook motion page (spec 0034) shipped its first pass with two motion defects that passed a
build + a full-page screenshot: (1) the easing track (`360px`, `overflow:hidden`) clipped
`ease-spring-strong`'s overshoot - the dot's peak (~392px) was cut off by ~30px, hiding the exact
bounce the row exists to demonstrate; and (2) a "hover the track to play" affordance was a CSS
no-op (the `:hover` rule re-declared the same `animation-name`, which does not restart a CSS
animation). Both were caught by the designer + engineer review, not by the pre-PR verification.

## Root cause

The change was verified by a single static full-page screenshot taken after load. A settled
screenshot captures the animation's REST state, so a mid-flight clip (or an overshoot that never
fit) is invisible - the dot had already returned inside the track by capture time. And the hover
"replay" was never actually watched firing; re-declaring an identical `animation-name` on `:hover`
produces no restart, so the affordance looked plausible in code but did nothing.

## Fix

- Size an overshoot/spring stage for the PEAK, not the rest position: peak = travel x
  (max bezier y). Widened the track 360 -> 480px so the 392.5px peak clears with room.
- Verify motion at its EXTREMES: RAF-sampled the running animation to catch the max right edge, and
  additionally froze the dot at the computed peak and screenshotted that - not just a settled frame.
- Replaced the dead `:hover` with a real click-to-replay (remounts via the state key), and only
  claimed the affordance after watching it fire.

## Learning

When you verify MOTION, capture it IN FLIGHT, not at rest. A single settled screenshot proves
layout, not animation - it cannot see clipping, overshoot, or a mid-flight glitch. For any
spring/overshoot demo, size the container for the PEAK position (compute it, add clearance) and
prove the extreme is in-bounds by frame-sampling the live animation or freezing at the computed
peak. And never ship a motion affordance you have not watched trigger - a CSS `:hover` that
re-declares an identical `animation-name` is a no-op. Generalizes past this page to any motion demo
or animated component this design system builds.
