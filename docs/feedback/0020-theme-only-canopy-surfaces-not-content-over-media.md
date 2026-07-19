# 0020 - Theme only Canopy surfaces, not content rendered over media

## Symptom

The Video skin (spec 0070) styled video.js caption/subtitle cue text with
`.vjs-text-track-display { color: var(--color-text-inverted) }`. In dark theme
`text-inverted` resolves to a near-black (stone-900), so captions rendered
**near-black over a dark video frame** - effectively illegible. Caught by the
designer persona on PR #95 (major).

## Root cause

The skin treated caption text like any other Canopy-surfaced text and reached
for a semantic role token. But captions do **not** render on a Canopy surface -
they float over the **video layer**, whose colour is arbitrary (any frame, any
brightness) and theme-independent. A role token (especially the *inverted* role)
assumes a known Canopy background behind the text; there is none here, so the
role's AA guarantee doesn't apply and the "flip with the theme" behaviour is
actively wrong - it makes cue text dark exactly when the video behind it is dark.

## Fix

Drop the override entirely and let video.js's own default cue styling stand
(white text on a translucent black box), which is legible over any frame in
either theme. The error display, by contrast, *does* cover the player area like
a Canopy surface, so it keeps `surface` + `text`.

## Learning

Not every text element a component renders should track the theme roles. A role
token is correct only for content on a **known Canopy surface**; content drawn
over **media or an otherwise arbitrary background** (video captions, an overlay
label on an image) needs a **theme-invariant, self-contained** treatment (its
own contrasting box), never a semantic role and *never* the inverted role - which
inverts to match a surface that isn't there. Generalises past this change, so it
feeds `overview/learnings.md`.
