# 0001 - README & Living Docs Baseline

## Problem

We commit to a principle: **always have working software and working docs.** The README is
canopy's front door - the quick start, the vision, the showcase. It must exist from day one
and stay truthful as the system grows, never claiming functionality that doesn't exist yet.

This spec establishes the README as a *living document* before any code lands, and records
the contract that **every subsequent spec updates the README** to match newly-working
software. README-first means the doc leads, and each build keeps it honest.

Audience: anyone landing on the repo - future rogueoak maintainers, app teams evaluating
canopy, and curious visitors.

## Outcome

When done:

- `README.md` at the repo root tells canopy's story accurately: what it is, the rogueoak →
  canopy → tree-themed layer model, the token/semantic approach, npm distribution, and a
  clear **status** of what is and isn't working yet.
- A status banner makes the development stage unmistakable (e.g. "🚧 early development - 
  nothing published to npm yet").
- The README is structured with sections that *fill in as software lands* - Quick start,
  Packages, Theming, Storybook - shown as clearly-labelled "coming soon" until real.
- The living-docs contract is recorded: every later spec's acceptance includes updating the
  README to reflect working reality.

## Scope

### In
- Root `README.md`: overview, the Canopy model + tree-themed naming story, the layer map
  table, token/semantic approach, distribution model, roadmap, status, license pointer.
- A short "Development" intent section (filled with real commands by 0002).
- The "working software + working docs" convention, recorded in the README and rolled into
  `overview/learnings.md` during reflection.
- Optional placeholder badges (build / Storybook) that activate once CI exists.

### Out
- Real install/usage commands that don't work yet - use clearly-labelled "planned" examples
  or omit until the skeleton (0002) lands.
- Deep per-component API docs - Storybook is the component reference once it exists.
- Screenshots/showcases of components - added once Seeds + Storybook exist.

## Approach

- Write an honest, polished README that *sells the vision* - an earthy, tree-themed design
  system for rogueoak and its products - without overclaiming. Forward-looking snippets are
  explicitly marked **(planned)**.
- Lead with the naming story and layer map (Roots → Seeds → Twigs → Branches → Boughs;
  Canopy = the whole), since that identity is real now even though components aren't.
- Bake in the living-docs contract so the README never drifts from working software. This
  mirrors Spectra's reflect step, aimed at the user-facing doc.
- Keep it editable: structure beats completeness here - later specs slot real content into
  the stubbed sections.

### Key decisions
- README-first ordering: docs lead, builds keep them truthful.
- Honesty over hype: no example claims functionality that doesn't exist.

## Acceptance

- [ ] `README.md` exists at repo root and describes canopy, rogueoak, the tree-themed atomic
      layer model, the token/semantic approach, and npm distribution.
- [ ] A status banner clearly states the early-development stage and that nothing is
      published yet.
- [ ] Sections are stubbed for Quick start / Packages / Theming / Storybook, labelled
      "coming soon / planned" where not yet real.
- [ ] The layer-map table and naming story are present and accurate.
- [ ] The living-docs convention ("every spec updates the README") is recorded in the README
      and in `overview/learnings.md`.
- [ ] No snippet claims functionality that doesn't exist; planned items are labelled.
