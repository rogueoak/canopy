# 0036 - Canopy 1.0.0 completion

Master plan to close the shadcn coverage gap and ship **Canopy 1.0.0**. Tracks 33 new
component specs (0036-0068), their build/review/merge, and the release. Each component is
one spec + one PR + persona review + merge, per the Spectra protocol. This doc is the
coordination spine; per-component detail lives in each numbered spec.

## Ground rules

- **Recipe**: every component follows the 0005 recipe (full literal token utility strings,
  `cn()` merge, `forwardRef` + native prop spread, semantic tokens only, no `dark:` on the
  common path, a11y guarded by tests). New Radix/3rd-party deps are runtime deps of
  `@rogueoak/canopy`, externalized in tsup.
- **Merges serialize**: additive components build in parallel worktrees, but PRs merge
  one-at-a-time, each rebased on latest `main` before merge, to keep barrel/`package.json`/
  README/`overview` edits conflict-free.
- **Refactor components** (Command, Drawer, Sheet, NavigationMenu) modify existing
  components; they run last in their group and never in parallel with each other.
- **Green gate**: `pnpm test`, `pnpm lint`, `pnpm build` pass in the worktree before every PR.

## Roster (dependency-ordered)

| # | Component | Layer | New dep | Depends on / Refactors |
|---|---|---|---|---|
| 0037 | Progress | Seed | @radix-ui/react-progress | - |
| 0038 | Slider | Seed | @radix-ui/react-slider | - |
| 0039 | Toggle | Seed | @radix-ui/react-toggle | - |
| 0040 | Alert | Twig | - | - |
| 0041 | Empty | Twig | - | - |
| 0042 | Item | Twig | - | - |
| 0043 | ButtonGroup | Twig | - | - |
| 0044 | InputGroup | Twig | - | - |
| 0045 | InputOTP | Twig | input-otp | - |
| 0046 | Collapsible | Twig | @radix-ui/react-collapsible | - |
| 0047 | Pagination | Twig | - | - |
| 0048 | FieldSet | Twig | - | FormField (0020) sibling |
| 0049 | ToggleGroup | Twig | @radix-ui/react-toggle-group | **Toggle (0039)** |
| 0050 | ScrollArea | Branch | @radix-ui/react-scroll-area | - |
| 0051 | Tabs | Branch | @radix-ui/react-tabs | - |
| 0052 | Accordion | Branch | @radix-ui/react-accordion | - |
| 0053 | AlertDialog | Branch | @radix-ui/react-alert-dialog | Dialog (0024) sibling |
| 0054 | DropdownMenu | Branch | @radix-ui/react-dropdown-menu | - |
| 0055 | ContextMenu | Branch | @radix-ui/react-context-menu | - |
| 0056 | Menubar | Branch | @radix-ui/react-menubar | - |
| 0057 | HoverCard | Branch | @radix-ui/react-hover-card | - |
| 0058 | Toast | Branch | @radix-ui/react-toast | - |
| 0059 | Table | Branch | - | - |
| 0060 | Calendar | Branch | react-day-picker, date-fns | - |
| 0061 | Carousel | Branch | embla-carousel-react | - |
| 0062 | Chart | Branch | recharts | - |
| 0063 | Resizable | Branch | react-resizable-panels | - |
| 0064 | DataTable | Branch | @tanstack/react-table | **Table (0059)** |
| 0065 | DatePicker | Branch | - (Calendar + popover) | **Calendar (0060)** |
| 0066 | Command | Branch | (cmdk, present) | **Refactors Combobox (0030)** |
| 0067 | Drawer | Branch | vaul | **Refactors SideNav (0026), ResponsiveDialog (0031)** |
| 0068 | Sheet | Branch | (radix-dialog, present) | **Refactors Dialog (0024) consumers** |
| 0069 | NavigationMenu | Branch | @radix-ui/react-navigation-menu | **Refactors TopNav (0025)** |

> Numbering note: assigned in build order. 0036 is this plan.

## Build waves

- **Wave A - Seeds + independent Twigs** (parallel): 0037-0048.
- **Wave B - ToggleGroup** (after Toggle merged): 0049.
- **Wave C - independent Branches** (parallel): 0050-0062.
- **Wave D - dependent Branches** (after their deps merged): 0063 (Table), 0064? -> 0064 DataTable, 0065 DatePicker.
- **Wave E - refactor Branches** (serial, last): 0066 Command, 0067 Drawer, 0068 Sheet, 0069 NavigationMenu.

## Per-component pipeline

1. Spec written (0037-0069) and approved.
2. `git worktree add .worktrees/<slug> -b <slug>` off latest `main`.
3. Build agent: component + test + stories + barrel export + dep + README + overview edits.
4. `pnpm test && pnpm lint && pnpm build` green in worktree.
5. Commit, push, open PR (`gh pr create`).
6. Persona review (engineer, tester, architect, designer as facets apply; security when a new
   dep lands) posts inline PR comments.
7. Address every major/blocker; capture lessons in `docs/feedback/`; re-test; push.
8. Rebase on `main`, resolve shared-file conflicts, merge PR, remove worktree.

## Release (after all merged)

1. `overview/` living docs updated (features, architecture, learnings, project).
2. Bump `@rogueoak/canopy` 0.0.0 -> 1.0.0; CHANGELOG.
3. README: remove "early development" note; mark shipped APIs live; update roadmap.
4. Tag `v1.0.0`; publish to npm (confirm with developer immediately before `npm publish`).

## Status

Legend: [ ] todo  [~] in progress  [x] merged

Specs: [ ] 0037-0069
Builds: [ ] Wave A  [ ] Wave B  [ ] Wave C  [ ] Wave D  [ ] Wave E
Release: [ ] docs  [ ] version+changelog  [ ] readme  [ ] publish
