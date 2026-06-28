# Plan 0024 - Dialog + Branches-layer infra

Source: `docs/specs/0024-dialog.md`. Build in worktree `.worktrees/0024-dialog` on branch
`0024-dialog`. Test before commit. Personas (engineer · tester · architect · designer) review the PR.

## Steps

1. **Dependency** - add `@radix-ui/react-dialog` to `packages/canopy/package.json`
   `dependencies` (pick a `^` range consistent with the other Radix deps), and add it to
   `packages/canopy/tsup.config.ts` `external`. Run `pnpm install` from the repo root.

2. **Branches-layer infra** (mirrors how 0020 opened Twigs):
   - `packages/canopy/tsup.config.ts` - add `'branches/index': 'src/branches/index.ts'` entry.
   - `packages/canopy/package.json` - add the `./branches` `exports` map
     (`types: ./dist/branches/index.d.ts`, `import: ./dist/branches/index.js`), parallel to
     `./twigs`.
   - `packages/canopy/src/branches/index.ts` - barrel re-exporting the Dialog family + types.

3. **Dialog** - `packages/canopy/src/branches/Dialog.tsx`, on `@radix-ui/react-dialog`,
   following the portalled-Seed recipe (model on `Tooltip.tsx` + `Card.tsx`):
   - `Dialog` = `DialogPrimitive.Root`; `DialogTrigger` = `DialogPrimitive.Trigger`;
     `DialogClose` = `DialogPrimitive.Close`.
   - `DialogOverlay` - `forwardRef` over `DialogPrimitive.Overlay`; `fixed inset-0 z-50`,
     `bg-overlay/80` (the pre-provisioned `color-overlay` token), fade in/out gated with
     `motion-reduce:animate-none` (use the Radix `data-[state=open|closed]` animation hooks with
     full-literal classes).
   - `DialogContent` - `forwardRef` over `DialogPrimitive.Content`, wrapped in
     `DialogPrimitive.Portal` with the `DialogOverlay` as a sibling. Centred
     (`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50`), `w-full max-w-lg`,
     raised-surface card (`bg-surface-raised` + `border border-border` + `rounded-lg` + primitive
     `shadow-lg`), `p-6`, vertical `gap`. Enter/exit zoom+fade gated with
     `motion-reduce:animate-none`. Includes a built-in close button: a `DialogPrimitive.Close`
     with an inline `X` SVG (`currentColor`, `aria-hidden`), `aria-label="Close"`, positioned
     `absolute right-4 top-4`, hover on `muted-raised`, the shared focus-visible ring.
   - `DialogHeader` - `div`, `flex flex-col gap-1.5`, text-left.
   - `DialogFooter` - `div`, `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` (stacked on
     mobile, right-aligned row on `sm+`).
   - `DialogTitle` - `forwardRef` over `DialogPrimitive.Title`, `text-h3` role.
   - `DialogDescription` - `forwardRef` over `DialogPrimitive.Description`, `text-body-sm
     text-text-muted`.
   - Rules: **full-literal** Tailwind class strings (scanner constraint), `cn()` merge, native
     prop spread, `React.ComponentRef<typeof …>` for every Radix ref, a file-top doc comment in
     the house style, `displayName` on each part. NO `dark:` on the common path. Export prop types.

4. **Tests** - `packages/canopy/src/branches/Dialog.test.tsx` (Vitest + Testing Library +
   `user-event`), asserting behaviour not classes:
   - opens from the trigger (content appears, `role="dialog"`).
   - `aria-modal`, `aria-labelledby` → DialogTitle, `aria-describedby` → DialogDescription wired.
   - closes via the built-in close button, via `Esc`, and via overlay click.
   - focus moves into the dialog on open and **returns to the trigger** on close.
   - `cn()` merges a caller `className` over a default on `DialogContent`.
   - ref forwards to the content element.
   (jsdom note: Radix Dialog works under jsdom; if pointer-capture/scroll APIs are missing, stub
   them in the test as needed - check whether the existing test setup already polyfills them.)

5. **Stories** - `apps/storybook/src/Dialog.stories.tsx`, `title: 'Branches/Dialog'`, importing
   from `@rogueoak/canopy/branches`. No per-story theme code (the toolbar toggle drives both
   themes). Cover: Basic (trigger → titled/described dialog with a Close), FormBody (a FormField
   Twig in the body + Cancel/Save footer Buttons), DestructiveConfirmation (a `destructive`
   Button, danger framing), Controlled (open state in a top-level component, per the
   story-state learning - never a hook in the `render` arrow).

6. **Docs** (the reflection step - do in this PR):
   - `README.md` - flip the Branches checklist line to show Dialog live + the `/branches` subpath
     in the package table / import examples where Twigs are shown; keep forward items honest.
   - `docs/overview/features.md` - add a **Branches** section + a **Dialog (0024)** entry.
   - `docs/overview/architecture.md` - record the `./branches` subpath, the Branches recipe
     (stateful portalled compound composing Seeds + Twigs), the `@radix-ui/react-dialog` dep, and
     the reuse of `color-overlay` (no new token).
   - `docs/overview/learnings.md` - only if a genuine friction/lesson emerges during the build.

## Verification (before commit)

From the repo root: `pnpm build` (tsup emits `dist/branches/index.js` + `.d.ts`), `pnpm test`
(Dialog tests green), `pnpm lint`, `pnpm format:check`. Grep the built Storybook or canopy source
to confirm the `bg-overlay/80`, `bg-surface-raised`, and motion-reduce literals are present.
Confirm `@rogueoak/canopy/branches` resolves (the `exports` map + tsup entry agree).
