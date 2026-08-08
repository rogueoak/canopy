# design-sync notes — @rogueoak/canopy

Repo-specific gotchas and decisions for syncing Canopy to claude.ai/design.
Read this first on every re-sync.

## Shape & invocation

- Shape: **storybook**. Stories live in `apps/storybook/src/*.stories.tsx` (NOT in
  the `packages/canopy` package). Storybook config: `apps/storybook/.storybook`.
- DS package: `@rogueoak/canopy` (global `window.RogueoakCanopy`). Monorepo (pnpm).
- Build DS first: `pnpm -F "@rogueoak/canopy..." build` (trailing `...` builds the
  `roots` tokens dep too). Reference storybook: `npx storybook build -c
  apps/storybook/.storybook -o .design-sync/sb-reference` from `apps/storybook`.
- Converter flags: `--entry packages/canopy/dist/index.js --node-modules
  apps/storybook/node_modules`. **node_modules is the storybook app's**, not the
  package's: it is the story-import resolution context and carries react, canopy,
  roots, recharts, input-otp, etc. (a plain `@rogueoak/canopy/twigs` bare specifier
  resolves through it via the workspace symlink).

## Components split across subpath exports — dts.mjs fork ([GENERAL])

- Canopy's ~60 public components are split across THREE subpath entries:
  `@rogueoak/canopy/seeds` (main `.` entry too), `/twigs`, `/branches`. Each
  declares its types ONLY through the modern `exports` map — no legacy per-subpath
  `types` field, no physical subpath `package.json`.
- The stock `exportedNames`/`jsdocFor` read a SINGLE entry `.d.ts` resolved from
  `pkg.types`/`publishConfig.types`, so they saw only the `seeds` entry (18/60
  components) and dropped the rest as `[TITLE_UNMAPPED]`.
- Fix: **`.design-sync/overrides/dts.mjs`** (thin fork, `cfg.libOverrides`) — re-exports
  the stock module and overrides only `exportedNames` + `jsdocFor` to UNION exports
  across every `.d.ts` entry in the `exports` map. Props already resolve project-wide
  (propsBodyFor scans the whole loaded tree), so nothing else needed. Needs the
  `.design-sync/node_modules -> ../.ds-sync/node_modules` symlink for ts-morph
  (recreate per clone).
- `extraEntries` lists the subpaths (`/seeds`, `/twigs`, `/branches`) so their
  components land on `window.RogueoakCanopy` too. (Bundle merge is via esbuild, which
  DOES resolve exports-map subpaths — only the export-gate scan can't, harmlessly.)
- Also added a top-level `"types": "./dist/index.d.ts"` to
  `packages/canopy/package.json` — standard compat field, gives the ts-morph project
  a valid entry for the seeds components. **PRODUCT CHANGE** — reported to the user.

## CSS is Tailwind v4 injected by Vite — css-fallback.mjs fork ([GENERAL])

- Storybook is React + Vite + Tailwind v4. Vite injects the compiled preview
  stylesheet (tokens + Tailwind utilities + @font-face + video skin) via a JS import,
  so `iframe.html` has NO `<link rel=stylesheet>`. The stock scrape found nothing and
  fell back to a self-styling stub → every preview unstyled.
- Fix: **`.design-sync/overrides/css-fallback.mjs`** (thin fork) — when no local
  `<link>` exists, fall back to the largest compiled `sb-reference/assets/*.css`
  (~131 KB). Returning `assets/` as srcDir also lets extractFonts copy the fonts.
- `cfg.cssEntry` can't be used here (bounded to the package dir; the compiled CSS
  lives under `.design-sync/`).

## titleMap

- `Chart` -> `ChartContainer`, `Resizable` -> `ResizablePanelGroup` (story title's
  last segment != the exported component name).
- `Foundations` -> null (token/color showcase, no component export).
- `Catalog` -> null: `Icons/Catalog` is a showcase of the SIBLING `@rogueoak/icons`
  package, not a canopy component. See icons note below.

## @rogueoak/icons deliberately NOT on the global

- Icons is a separate package. Adding it to `extraEntries` put its `Calendar` ICON on
  the global, which clobbered canopy's `Calendar` COMPONENT (ESM ambiguous star
  re-export -> undefined) — `[BUNDLE_EXPORT]` + empty Calendar render.
- Decision: keep `@rogueoak/icons` OFF `extraEntries` and exclude the `Icons/Catalog`
  showcase. Canopy component stories that USE icons still render fine (icons bundle
  from source into those previews). The design agent syncs canopy only; icons would be
  a separate design-system sync.

## FONT_MISSING — canopy token/@font-face name mismatch (accepted, faithful) ([GENERAL])

- `[FONT_MISSING] "Figtree", "Geist Mono"`: canopy's roots tokens set
  `--font-sans: Figtree, ...` / `--font-mono: 'Geist Mono', ...`, but the shipped
  `@font-face` families (from `@fontsource-variable/*`) are **`Figtree Variable`** /
  **`Geist Mono Variable`**. The bare names never match, so **canopy's own storybook
  renders with system fallback** — this is a latent DS bug, not a converter drop.
- Decision: ship faithfully (system fallback), which MATCHES the reference exactly, and
  report the mismatch to the user. NOT aliased — aliasing would render a font the real
  DS does not, and would require modifying the reference oracle. A one-line DS fix
  (rename token families to `'Figtree Variable'`/`'Geist Mono Variable'`, or add an
  alias @font-face) would enable the brand font everywhere; then a re-sync renders it.

## Presentation overrides (cardMode)

- Wide-in-grid -> `cardMode: "column"`: Accordion, Carousel, ChartContainer, DataTable,
  ResizablePanelGroup, Table, Tabs, TopNav, Alert, Empty, FieldSet, Item, Pagination.
- Overlay/portal -> `cardMode: "single"`: Toast, Video.
- **Video** also NEEDED single: the product card spun up ~6 video.js players each
  fetching the remote `vjs.zencdn.net/oceans.mp4`, so `page.goto` never fired `load`
  (15s timeout). Single (primaryStory `WithPoster`) renders one player. Video stories
  use REMOTE sources — a network-blocked shell will fail them.

## Storybook `layout: 'centered'` is NOT applied to previews ([GENERAL])

- Storybook `meta.parameters.layout: 'centered'` shrink-wraps + centers a story in the
  canvas, but the preview build bundles only DECORATORS, not parameters — so previews
  do NOT center. For content-sized triggers (buttons, dashed target boxes, nav strips)
  this only shifts POSITION = framing, ignore = match. For a component that is
  FULL-WIDTH by its own CSS it changes apparent WIDTH and reads as a real mismatch.
- Three components needed an owned centering-wrapper preview for this (all the same
  pattern — wrap each story in a `display:flex; justify-content:center` container with a
  `width:fit-content` inner so the component shrink-wraps + centers like storybook):
  - **Menubar** — full-width `flex h-10` bar spanned the preview.
  - **Calendar** — `justify-between` month header pushed the nav chevrons to the page edges.
  - **Carousel** — paging arrows are absolutely positioned OUTSIDE the box (`-left-12`/
    `-right-12`); left-aligned preview clipped the left arrow off-page.
  Watch for this on ANY content-sized component whose controls overflow its box, or any
  full-width component, whose stories use `layout: 'centered'`. Most components are
  content-sized and only shift POSITION (framing) — only fix when apparent WIDTH differs
  or controls are clipped. NOTE: `layout: 'fullscreen'` (SideNav, TopNav) is fine — those
  render full-bleed identically on both sides, no wrapper needed.

## Toast — Variants skipped, primaryStory is Playground

- Toast is `cardMode: "single"`. Its `Variants` story renders three `className="static"`
  toasts intending an inline row, but Radix routes the open `Toast.Root`s to the fixed
  `ToastViewport` (outside the `layout:centered` capture frame) — so it renders BLANK in
  storybook itself and is NOT statically renderable. It is `skip`ped (story id
  `branches-toast--variants`) and `primaryStory` is `Playground` (a held-open toast that
  renders faithfully on both sides). Other Toast stories (WithAction/WithClose/Imperative/
  Stacked) match — held-open toasts paint at a fixed page corner (position = framing).
- Closed-by-default overlays (AlertDialog, Drawer, Sheet, Dialog) render just their TRIGGER
  by default; both sides show the identical trigger = match. Open state is click-driven.

## Story caps (verified-by-upload tails)

- Several components have >6 stories; compare's default 6-cap left tails ungraded,
  verified-by-upload: Checkbox (7, "Sizes"), ButtonGroup (7), Input/Textarea/Slider (7),
  Combobox (8). All captured stories graded match; tails are low-risk size/minor variants.
  Raise `--max-stories` on a future sync if a tail needs individual verification.

## Re-sync risks (watch-list)

- **Toast** primaryStory `Variants` renders blank/collapsed in single mode (portal
  toasts need a trigger/open state). Needs a better primaryStory or an owned preview —
  UNRESOLVED as of first sync; being handled in grading.
- The `dts.mjs`/`css-fallback.mjs` forks are pinned to converter internals; a skill
  update may improve the stock modules without reaching the forks. Re-check them if
  discovery or CSS scraping regresses.
- `packages/canopy/package.json` `types` field is a product change this sync made;
  if reverted upstream, the seeds-entry dts resolution degrades (fork still discovers
  via the exports map, so components survive; seeds JSDoc/props may thin).
- Video previews depend on egress to `vjs.zencdn.net`.
- Grid-overflow `column`/`single` overrides are presentation-only (grades carry); a
  newly-added wide story under an already-`column` component is fine, but a new portal
  story under a non-single component can re-flag `[GRID_OVERFLOW] escape`.
