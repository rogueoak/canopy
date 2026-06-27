# 0007 — a story's `render` called a hook, and the red lint reached `main`

Source: caught while building npm publishing (spec 0023) — getting `main` green before the
first tag release surfaced a lint failure that was already sitting on `main`.

## Symptom

`pnpm lint` failed on `main` (independent of spec 0023): `SearchBar.stories.tsx:42` —
`react-hooks/rules-of-hooks`, "React Hook `React.useState` is called in function `render` that
is neither a React function component nor a custom React Hook function." CI for the SearchBar
work (spec 0021) had merged in a red state.

## Root cause

The `WithValue` story drove a controlled field by calling `React.useState` **directly inside the
story's `render` callback**. A `render` arrow is not a component (lowercase, not a hook), so the
Rules of Hooks lint rejects it — the hook only happens to work at runtime because Storybook calls
`render` like a component. Two gaps let it land: the story pattern (state belongs in a real
component, not a `render` body), and the merge gate (a red `pnpm lint` was not blocking).

## Fix

Extracted the stateful body into a top-level `ControlledSearchBar` component and made the story
`render: (args) => <ControlledSearchBar {...args} />`. The hook now lives in a capitalized
component, satisfying the rule with identical behavior.

## Learning

Rolled into `overview/learnings.md`: **a Storybook story that needs state must put it in a
top-level component, never a hook in the `render` callback** — `render: (args) => <Example
{...args} />`. And the process half: **`main` should not be able to go red** — CI (`build`,
`test`, `lint`, `format:check`) belongs as a required status check so a failing lint can't merge.
