# 0013 - Combobox was specced into the wrong tier (Seed vs Branch)

## Symptom

Spec 0030 and its build placed `Combobox` in the **Seeds** tier
(`packages/canopy/src/seeds/Combobox.tsx`), next to `Select`. The architect persona flagged it
on review as a tier/layer violation: the component `import`s the `Badge` **Seed**, and a Seed
importing another Seed breaks the documented one-way layering ("twigs import seeds, never the
reverse"). It also owns real interaction state (open / search / selection, controlled vs
uncontrolled, toggle, chip removal, key handling) and renders through a portal.

## Root cause

The spec anchored on the wrong sibling. `Combobox` looks like `Select` (a field that opens a
list), so it was filed beside it in Seeds. But `Select` is a Seed for a specific reason: Radix
owns **all** of its state (zero `useState`) and it composes **no** other component. `Combobox`
is the opposite - it hand-rolls interaction state, portals its content, and composes the `Badge`
Seed for its chips. The tier is decided by **interaction class, not by surface resemblance**:
`architecture.md` already says a **Branch** "owns interaction state and/or a portal" (that is why
`Dialog` is a Branch), and Breadcrumb (feedback-era note) established that "the layer split is by
interaction class, not domain." Combobox is Branch-shaped and should have been specced there.

## Fix

Moved the component to the **Branches** tier: `packages/canopy/src/branches/Combobox.tsx`
(+ test), exported from `branches/index.ts` on the `./branches` subpath beside `Dialog`, and the
`Badge` import now correctly crosses tiers downward (`../seeds/Badge`) - a Branch composing a Seed
is allowed. Storybook retitled `Branches/Combobox`; README moved it into the Branches list. Also
trimmed the over-exposed part exports (the root owns composition via `options`), so the public
surface is `Combobox` + `ComboboxOption` + the prop-type unions.

## Learning

**Decide a component's tier by its interaction class, not by which existing component it visually
resembles.** If it owns interaction state and/or a portal, or it composes another Seed/Twig, it
belongs *above* the Seed tier (Branch, or Twig if purely compositional and stateless) - regardless
of whether it "looks like" a Seed such as Select. Check the tier at **spec time**, against the
`architecture.md` definitions, so the layer question is settled before the build rather than in
review. This generalizes past Combobox and feeds `overview/learnings.md`.
