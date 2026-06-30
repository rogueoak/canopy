# 0027 - icons package - build plan

Source spec: `docs/specs/0027-icons.md`. Build in worktree `.worktrees/0027-icons`
(branch `0027-icons`). Test before commit.

## Decisions locked at build time

- Package name `@rogueoak/icons`; single `.` export.
- Standard glyphs: Lucide (`react-icons/lu`). Social marks: Simple Icons (`react-icons/si`).
- Name collision: brand `X` (Twitter/X) keeps the name `X`; Lucide's close glyph is `Close`.
- `react-icons ^5` is a runtime **dependency**; `react ^19` is a **peer**. No roots/Tailwind dep.

## Steps

1. **Scaffold `packages/icons/`** mirroring `packages/canopy` conventions:
   - `package.json` - name, type module, sideEffects false, `files: [dist]`, exports `.`
     (types + import), `publishConfig.access public`, `repository`/`homepage`/`bugs`,
     scripts (`build`/`test`/`lint`/`prepublishOnly`), `react-icons` dep, `react` peer,
     dev deps (testing-library, types, tsup, vitest, jsdom, react/react-dom).
   - `tsconfig.json` (extends base, noEmit, include src), `vitest.config.ts`,
     `vitest.setup.ts`, `tsup.config.ts` (entry `src/index.ts`, ESM, dts, clean,
     external react/react-dom/react-icons).
2. **`src/registry.ts`** - the curated map: semantic name -> `react-icons` component, drawn
   from `lu` (standard) and `si` (social). Single source of truth the catalog + tests read.
3. **`src/icons.ts`** - re-export every registry entry as an individual named export
   (tree-shakeable).
4. **`src/Icon.tsx`** - the size wrapper: `IconProvider` (alias of react-icons `IconContext`
   provider) + `Icon` component applying default size + `currentColor`, merging `className`.
   Re-export `IconType`/props.
5. **`src/index.ts`** - re-export icons + wrapper + types.
6. **Tests** (`src/*.test.tsx`):
   - registry/exports: every registry name is exported and renders an `<svg>`; catalog and
     exports can't drift.
   - Icon wrapper: applies default size, `className` overrides, decorative `aria-hidden` by
     default, `title` -> accessible name.
7. **README.md** (npm page): install, the curated set / how names map, size wrapper, sizing
   + a11y, the `X`/`Close` note.
8. **Storybook**: add `@rogueoak/icons` workspace dep to `apps/storybook`; add
   `Icons.stories.tsx` - a catalog grid of every icon with its name + a usage story.
9. **Root README**: add `@rogueoak/icons` to the packages table; reconcile the Canopy model
   note (Icon shipped as its own package).
10. **Verify**: from repo root `pnpm install`, `pnpm build`, `pnpm test`, `pnpm lint`,
    `pnpm --filter @rogueoak/storybook build`; `pnpm --filter @rogueoak/icons pack --dry-run`
    (README + dist present).
11. **Reflect**: update `overview/features.md` + `overview/architecture.md`.
12. Commit, PR, persona review (engineer, architect for new package boundary/dep, security for
    new dep), address, merge.
13. **Publish**: manual first publish via pnpm (`pnpm --filter @rogueoak/icons publish
    --access public`) - developer then configures GHA trusted publisher.
