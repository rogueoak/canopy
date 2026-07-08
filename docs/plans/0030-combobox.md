# 0030 - Combobox (build plan)

Source spec: [0030-combobox.md](../specs/0030-combobox.md).

## Steps

1. **Dependencies** - add to `packages/canopy/package.json` runtime `dependencies`:
   `@radix-ui/react-popover` (the missing portalled popover primitive) and `cmdk` (the
   filterable listbox). Externalize both in the tsup build like the other Radix deps (the build
   config globs `@radix-ui/*` / peers; confirm `cmdk` is externalized too). `pnpm install` at
   root; the pnpm 11 build-approval note in `learnings.md` may apply if either ships a build
   script.
2. **Component** - `packages/canopy/src/seeds/Combobox.tsx`. `forwardRef` parts on the 0005/0013
   recipe (semantic-token FULL-LITERAL class strings, `cn()` merge, native prop spread, no
   `dark:` on the common path):
   - `Combobox` - stateful root. Owns open state + selection; props: `options` (`{label,value,
     disabled?}[]`) or `ComboboxItem` children, `value`/`onValueChange`, `multiple`,
     `placeholder`, `disabled`, `aria-invalid` passthrough. `multiple` discriminates value type
     (`string` vs `string[]`). Wraps Radix `Popover.Root` + cmdk `Command`.
   - `ComboboxTrigger` - the field button (`Popover.Trigger`), styled to match `SelectTrigger`
     /`Input` exactly (`h-10 w-full ... border-border bg-surface text-text`, focus-visible ring,
     `disabled:*` token pair, `aria-invalid:` danger overrides, trailing chevron). Single mode:
     selected label or muted placeholder. Multiple mode: inline wrapping `Badge` chips + search
     input after the last chip. Min-height grows with wrapped rows.
   - `ComboboxContent` - `Popover.Content` wrapper (`surface-raised` + `border` + `shadow-md`,
     matched to `SelectContent`), portalled, width-synced to the trigger
     (`w-[--radix-popover-trigger-width]`), houses the cmdk parts.
   - `ComboboxInput` (`Command.Input`), `ComboboxList` (`Command.List`), `ComboboxItem`
     (`Command.Item`, leading check when selected, toggles selection; stays open in multiple
     mode), `ComboboxEmpty` (`Command.Empty`, the no-results slot).
   - Multi-select chips: each rendered as `Badge` with a labelled remove `button`
     (`aria-label="Remove {label}"`); `Backspace` in an empty input removes the last chip.
3. **Barrel** - export all parts + prop types from `packages/canopy/src/seeds/index.ts`.
4. **Tests** - `packages/canopy/src/seeds/Combobox.test.tsx` (Vitest + Testing Library +
   user-event):
   - opens the popover on trigger click; typing filters the list; empty filter shows the empty
     state.
   - single-select: pick sets the trigger label and closes.
   - multiple: pick renders a `Badge` chip, popover stays open; re-pick de-selects and removes the
     chip; selected item shows a check.
   - chip remove button is present + labelled; clicking it removes the chip; `Backspace` in empty
     input removes the last chip.
   - `disabled` renders the field inert; `aria-invalid` applies the danger classes.
   - roles: `combobox`/`listbox`/`option`, `aria-expanded`, `aria-multiselectable` in multi mode.
   - `cn()` merge + ref forwarding on the styled parts.
5. **Stories** - `apps/storybook/src/Combobox.stories.tsx` under `Seeds/Combobox`: SingleSelect,
   MultiSelectWithBadges, Disabled, Invalid, LongList, EmptyState - all theme-agnostic. Note in
   the multi story that filtering is client-side (async is a follow-up).
6. **Docs** - canopy `README.md` component list adds Combobox; `docs/overview/features.md` (new
   Seed capability, single+multi, badges) and `architecture.md` (new primitives
   `@radix-ui/react-popover` + `cmdk` in the canopy dependency footprint; first cmdk usage) - done
   on completion per the reflection step.
7. **Verify** - `pnpm --filter @rogueoak/canopy test`, then root `pnpm build`, `pnpm lint`,
   `pnpm format:check`. Grep built Storybook CSS for a combobox utility to confirm the Tailwind
   `@source` seam picks up the new file.

## Verification

- Canopy test suite green (new Combobox tests included), all acceptance items in the spec covered.
- `pnpm build` + `pnpm lint` + `pnpm format:check` clean from the root.
- Storybook `Seeds/Combobox` renders single + multi (with badges) in both light and dark themes.
