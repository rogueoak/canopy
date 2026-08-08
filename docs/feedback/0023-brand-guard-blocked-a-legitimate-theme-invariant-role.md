# 0023 - A heuristic guard must not be a shippability bar

## Symptom

A consumer brand (Famlistry) wanted its status fills to read the same in dark as in
light: a deep `danger` / `success` / `warning` / `info` fill with light text, rather
than Canopy's default pale-fill-with-dark-text in dark. Every one of those pairs
passes WCAG AA comfortably in both themes. `buildBrand()` refused to build it:

```
Brand "ink" is not shippable - each dark override must differ from its light value ...
dark override identical to light (copy-paste?): color-info, color-info-foreground
```

The only way through was to pick a *different* step than the one the designer
wanted (600 -> 700, foreground 50 -> 100) purely to make the values unequal, which
changed the design to satisfy a check rather than to satisfy a person.

## Root cause

`checkBrandCss` computes `identicalDark` to catch a real and common slip: pasting
the light semantic file in as the dark one, which renders a light palette in dark
mode. That is a good *smell detector*. But `buildBrand()` treated it as a hard
failure alongside the AA failures, which conflated two different kinds of claim:

- **AA** is a correctness property. It is objectively checkable and a break is
  always a defect.
- **"dark differs from light"** is a heuristic proxy for intent. A role that reads
  the same in both themes is usually a mistake and sometimes a decision, and the
  guard cannot tell which.

Making the heuristic fatal meant the pipeline enforced a house style as if it were
an accessibility standard, and the brand author had no way to say "I meant that."
The hardcoded `THEME_INVARIANT_ROLES` allowlist was the tell: the rule already had
a known-legitimate exception, baked in for one role rather than expressed as a
capability.

## Fix

Demote `identicalDark` from a build failure to a reported warning:

- `buildBrand()` fails only on AA breaks (and flat-hex dark overrides), and returns
  `warnings.identicalDark` so callers can surface it.
- The `roots-brand` CLI prints the note, so a genuine copy-paste slip is still loud.
- Canopy's OWN core tokens keep the strict rule in `tokens.test.ts`. There, a
  theme-invariant role really would be a slip, and the allowlist is the right shape
  for a single palette that the design system controls end to end.

## Learning

Separate **correctness gates** from **smell detectors**, and give them different
severities. A correctness gate encodes a property that is objectively wrong when
violated (contrast, type errors, a broken invariant) and belongs in the build's
failure path. A smell detector encodes a pattern that is *usually* a mistake
(duplicated values, an unused export, a suspicious constant) and belongs in the
warning path, because the tool cannot distinguish "you slipped" from "I meant it."

Fusing the two makes the strict thing feel arbitrary and teaches people to route
around the guard - here, by nudging a colour step until the check went quiet, which
degrades the design *and* leaves the real smell undetected next time. The signal
that you have fused them: a hardcoded allowlist of exceptions. An exception list on
a rule is evidence that the rule is heuristic, and a heuristic that ships with
known-good exceptions should warn, not block. Generalises, so it feeds
`overview/learnings.md`.
