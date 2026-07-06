# 0029 - Breadcrumb (build plan)

Source spec: [0029-breadcrumb.md](../specs/0029-breadcrumb.md).

## Steps

1. **Component** - `packages/canopy/src/twigs/Breadcrumb.tsx`. Seven `forwardRef` parts following
   the Card/TopNav recipe (semantic tokens, `cn()`, full-literal classes, native prop spread):
   - `Breadcrumb` → `<nav aria-label="breadcrumb">` (label overridable via native props).
   - `BreadcrumbList` → `<ol>`, wrapping `flex items-center` row, gap, `text-body-sm text-text-muted`.
   - `BreadcrumbItem` → `<li>`, inline `flex items-center gap`.
   - `BreadcrumbLink` → `<a>` or `Slot` (`asChild`); `text-text-muted hover:text-text`, focus ring.
   - `BreadcrumbPage` → `<span role="link" aria-disabled="true" aria-current="page">`, `text-text`.
   - `BreadcrumbSeparator` → `<li role="presentation" aria-hidden="true">` + default chevron SVG
     (overridable `children`).
   - `BreadcrumbEllipsis` → `<span role="presentation" aria-hidden="true">` + dots SVG + `sr-only`
     "More".
2. **Barrel** - export all parts + prop types from `packages/canopy/src/twigs/index.ts`.
3. **Tests** - `Breadcrumb.test.tsx` (Vitest + Testing Library): nav landmark + label + `<ol>`;
   current page has `aria-current="page"` and is not a link; separator/ellipsis are `aria-hidden`
   and absent from the accessible name; `asChild` renders child anchor with link classes, no nested
   anchor; `cn()` merge; ref forwarding on each part.
4. **Stories** - `apps/storybook/src/Breadcrumb.stories.tsx` under `Twigs/Breadcrumb`: Basic,
   CustomSeparator, Collapsed (ellipsis), AsChildLink - all theme-agnostic.
5. **Docs** - README component list, `docs/overview/features.md` (new Twig section),
   `architecture.md` (note under the Twigs recipe that Breadcrumb is a structural, stateless
   compound - the second after Card - and why it's a Twig despite the `<nav>` landmark).
6. **Verify** - `pnpm --filter @rogueoak/canopy test`, `pnpm build`, `pnpm lint`, `pnpm
   format:check`. Grep built Storybook CSS for a breadcrumb utility to confirm the `@source` seam.

## Verification

- Canopy test suite green (new Breadcrumb tests included).
- `pnpm build` + `pnpm lint` + `pnpm format:check` clean.
- Storybook `Twigs/Breadcrumb` renders in both themes.
