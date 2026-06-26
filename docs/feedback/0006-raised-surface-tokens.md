# 0006 — Raised surfaces need their own hover + elevation tokens

Source: designer review of PR #13 (Select, spec 0013) — two related minors. Surfaced by the
first **portalled** Seed (a popover on `surface-raised`), the same way Button surfaced the
danger collision and Label surfaced the cn() drop: the first real consumer of a seam exposes a
token gap the Foundations stories can't.

## Symptom

On the Select dropdown (a `surface-raised` popover):

1. **Item focus inverts in dark.** The focused item uses `focus:bg-muted`, but in dark `muted`
   is `stone.900` while `surface-raised` is `stone.800` — so the "focus" fill is *darker* than
   the surface it sits on, reading as a recessed band instead of a raised highlight. In light it
   happens to work (`muted` stone.100 over white). One token, two opposite effects by theme.
2. **Elevation is near-invisible in dark.** The popover uses the primitive `shadow-md` (there is
   no semantic elevation token). On dark surfaces a drop shadow barely registers — elevation
   falls back entirely to the 1px border.

Neither blocks Select (it is usable), but both are **inherited by every future portalled Seed**
(Tooltip, Popover, Dropdown Menu, Combobox), so they should be fixed at the token layer before
those copy the pattern.

## Root cause

The semantic layer models ONE surface elevation for interaction (`muted` as the hover/active
fill) and has no elevation token. That holds on the base canvas but breaks on a *raised* surface,
where "one step up" must go the opposite lightness direction in dark, and where a shadow alone
isn't enough to convey lift.

## Fix (planned — a small Roots change before Batch 2 / Tooltip)

- Add a **raised hover/focus token** (e.g. `color-muted-raised` or `color-accent-subtle`) that is
  a step *toward the foreground* on a raised surface in BOTH themes (lighter than `surface-raised`
  in dark, subtly darker than it in light). Repoint `SelectItem`'s `focus:`/highlighted fill at it.
- Add a **semantic elevation token** (e.g. `--shadow-popover`) that can carry a stronger shadow
  (and/or a ring) tuned per theme, so dark popovers read as lifted. Repoint `SelectContent`.
- Then Tooltip (0014) and later portalled Seeds consume these from day one.

## Learning

Rolled into `overview/learnings.md`: **a "one step up" interaction fill is surface-relative** —
a token that lightens correctly on the base canvas can invert on a raised surface in the opposite
theme. Model raised-surface hover/elevation explicitly rather than reusing the base `muted`/
primitive-shadow, and fix it at the token layer the first time a portalled component needs it.
