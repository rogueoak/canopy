# 0017 - Form controls auto-zoom on iOS

Source: rogueoak.com subscribe form (rogueoak feedback 0002) - tapping a canopy `Input` on a phone
zoomed the page. The same latent bug is in every canopy consumer, so it is fixed at the source here.

## Symptom

On iOS Safari, focusing a canopy `Input`, `Textarea`, or `Select` trigger zoomed the whole page in -
a jarring shift the user then had to undo. Reproduced on rogueoak.com; applies to any consumer with
these controls on a phone.

## Root cause

iOS Safari auto-zooms to a focused form control whenever its computed `font-size` is below **16px**.
All three field controls used `text-sm` (14px) in their base class, so every one tripped the zoom.
A platform rule the component defaults did not account for - not a consumer bug, so a per-app
override (what rogueoak shipped first) is the wrong layer. The design system owns the default.

## Fix

Set the focusable field controls to `text-base md:text-sm`: **16px on mobile** (no iOS zoom) and
**14px from the `md` breakpoint up** (preserves the denser desktop typography). Applied to `Input`,
`Textarea`, and the `Select` trigger. The `SelectItem` / `SelectLabel` dropdown rows stay `text-sm` -
they are not focusable text fields, so they never zoom. `md` is a width breakpoint, not a touch test,
but that is the right proxy here: iOS auto-zoom is a small-viewport phone behavior, and phones sit
below `md`. Each control gains a test asserting `text-base md:text-sm` (and not bare `text-sm`).

## Learning

**Interactive form controls must default to font-size >= 16px on mobile.** A 16px minimum on
focusable fields is a design-system-level guarantee, not a per-app override - fix it once in the
component so every consumer inherits it. Use `text-base md:text-sm` when the desktop design wants a
denser 14px. Verify the computed size, not just the class.
