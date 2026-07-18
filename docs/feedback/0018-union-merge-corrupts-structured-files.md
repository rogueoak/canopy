# 0018 - `union` merge driver corrupts barrels and manifests

## Symptom

During the 1.0.0 build-out, dozens of parallel branches each added components and so each edited the
three tier barrels (`src/seeds/index.ts`, `src/twigs/index.ts`, `src/branches/index.ts`) and
`package.json`. Merges that relied on a `union` merge driver produced files that looked plausible in
a diff but were **broken**: a barrel came out missing an `export {` opener (so a whole export block
was orphaned and the file failed to parse), and `package.json` came out with **duplicate keys**. The
break only surfaced at build time (a parse error), not in the merge itself.

## Root cause

The `union` strategy resolves a conflict by keeping **both** sides' lines. That is safe for prose but
wrong for **multi-line structured blocks**: when both branches add exports under a shared
`export { ... } from './X'` shape, `union` keeps both bodies but collapses the shared opening line to
a single copy, so one body loses its `export {` opener and the braces no longer balance. On JSON it
keeps both branches' added keys verbatim, duplicating any key both branches touched. Neither is a
syntactic merge - `union` has no idea the lines belong to a structured grammar.

## Fix

- Remove any `union` (or other auto-both-sides) merge driver from structured files - TS barrels, JSON
  manifests, lockfiles - in `.gitattributes`. These conflicts must be resolved **explicitly**.
- When resolving a barrel/manifest conflict by hand: take both sides' entries, but keep exactly one
  `export { ` opener per block and exactly one JSON key each.
- After any merge that touched a barrel or a `package.json`, run the build once. A dropped
  `export {` or a duplicate key fails the parse immediately - do not trust a clean-looking diff.

## Learning

**Never let git auto-merge a structured file by keeping both sides.** A barrel and a manifest have a
grammar `union` cannot see, so it silently produces syntactically broken output that a diff read
misses. Resolve barrel/manifest conflicts explicitly and gate on a real build (a parse) right after,
so the corruption fails loudly instead of shipping.
