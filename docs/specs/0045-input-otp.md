# 0045 - input-otp

## Problem

Canopy has plain text fields (`Input` 0001, `FormField` twig) but no **one-time-passcode**
control: the segmented, one-character-per-box field that verification flows (email/SMS codes,
TOTP, 2FA challenges) ask for. Without it, every consumer who needs "enter the 6-digit code"
hand-rolls a row of single-character inputs and re-implements the fiddly parts each time -
focus advancing as you type, backspace stepping back, pasting a whole code across the boxes,
mobile one-time-code autofill, and the caret/active-box affordance. That is exactly the kind of
finicky, easy-to-get-wrong control the design system should own once. shadcn/ui closes this gap
with its `InputOTP` built on the `input-otp` package (a single hidden input driving rendered
slots); canopy has no equivalent, and Radix ships no OTP primitive, so there is nothing to
compose today.

This is for any auth or verification surface: sign-in code entry, 2FA setup, email/phone
confirmation. It sits alongside `Input` (0001) as a specialized field and pairs with `Label` /
`FormField` (twig) like the other form controls.

## Outcome

- A new canopy component family, `InputOTP`, exported from `@rogueoak/canopy/twigs`, that renders
  a segmented passcode field: a single accessible input whose value is drawn as **slots**, one
  character per box, grouped and optionally separated.
- **Parts**: `InputOTP` (the root that owns the hidden driving input and renders children via a
  render context), `InputOTPGroup` (a run of slots), `InputOTPSlot` (one character box, keyed by
  index) and `InputOTPSeparator` (a non-interactive divider between groups).
- **Entry behavior**: typing fills slots left to right and advances; `Backspace` clears and steps
  back; arrow keys move the active slot; **paste** distributes a whole code across the slots at
  once. `maxLength` sets the number of slots; a `pattern` restricts input to **numeric** or
  **alphanumeric** (a caller-supplied regex). Value is **controlled** (`value` / `onChange`) or
  **uncontrolled**; **`onComplete`** fires when every slot is filled.
- **Active-slot affordance**: the focused slot shows a **caret/ring** (a blinking caret plus a
  ring using the focus tokens) so the user sees where the next character lands, matching the
  focus-ring idiom of the other fields.
- **States**: `disabled` renders the field inert with the shared disabled tokens; `aria-invalid`
  applies the danger border/ring exactly as `Input` does, for visual parity.
- **Theming**: styled with the 0005 recipe (full literal semantic-token Tailwind utilities,
  `cn()` merge, `forwardRef` + native prop spread), so it themes light/dark through the token
  layer with **no `dark:` on the common path**.
- **A11y**: a single labelled input (pairs with `Label` / `FormField`), so screen readers and
  mobile `autocomplete="one-time-code"` autofill treat it as one field; slots are presentational.
- **Docs**: a Storybook catalog entry (playground, 6-digit numeric, 4-digit, separated groups,
  alphanumeric pattern, disabled, invalid, controlled/`onComplete`); canopy README component list
  and the `overview/` living docs updated on completion.

## Scope

### In
- `packages/canopy/src/twigs/InputOTP.tsx` (+ `InputOTP.test.tsx`) - the component family and its
  four parts, exported from `packages/canopy/src/twigs/index.ts`.
- Both **controlled** (`value` / `onChange`) and **uncontrolled** value modes; **`onComplete`**
  callback when all slots are filled; `maxLength` slot count; `pattern` (numeric default, or a
  caller regex for alphanumeric).
- **Paste** support (whole-code distribution) and per-key focus advance / backspace / arrow
  navigation, provided by the `input-otp` package's single driving input.
- Active-slot **caret/ring** affordance using the canopy focus tokens; `disabled` and
  `aria-invalid` states reusing the exact `Input` field tokens for parity.
- One new runtime dependency on `@rogueoak/canopy`: **`input-otp`** (the single-input OTP engine
  that renders slots via context) - added to `packages/canopy/package.json` dependencies **and**
  externalized in `packages/canopy/tsup.config.ts` `external: [...]` like the Radix deps, then
  `pnpm install` at the repo root.
- Storybook stories (playground, 6-digit numeric, 4-digit, separated groups, alphanumeric,
  disabled, invalid, controlled + `onComplete`) in `apps/storybook/src/InputOTP.stories.tsx`,
  imported from `@rogueoak/canopy/twigs`.
- Canopy `README.md` component list + `overview/features.md` and `overview/architecture.md`
  updates on completion.
- Tests: renders `maxLength` slots; typing fills and advances; `Backspace` clears and steps back;
  paste distributes a code; numeric `pattern` rejects letters; `onComplete` fires when full;
  controlled value renders; uncontrolled edits; `disabled` inert; `aria-invalid` danger styling;
  `className` merge (caller wins); ref forwarding.

### Out
- **Auto-submit / network verification** - `InputOTP` reports the value via `onComplete`; sending
  and verifying the code is the consumer's job.
- **Resend timers / "request new code" UI** - a countdown/resend affordance is a separate
  composition, not part of this field.
- **Masked / password OTP** (dot-obscured characters) - defer to a follow-up; v1 shows the typed
  characters.
- Changing `Input` (0001) or `FormField` (twig) - `InputOTP` is additive; those stay as they are.
- Introducing a second primitive family - v1 uses the `input-otp` package, which is the exact
  missing primitive (decision recorded below).

## Approach

**Primitive stack: the `input-otp` package + the 0005 recipe (shadcn's InputOTP model).** Radix
ships no OTP primitive, so canopy adds `input-otp`: a small, widely used library that renders a
**single** real `<input>` (correct for labelling and `one-time-code` autofill) and exposes, via a
render context, the per-slot state (character, `isActive`, `hasFakeCaret`) that the visible boxes
draw from. This is the same primitive shadcn/ui uses, so the part surface and behavior are
familiar. It is added as a runtime **dependency** of `@rogueoak/canopy` and **externalized** in
tsup exactly like the Radix deps, per the canopy externalization rule; `pnpm install` is run at
the root after. Chosen over hand-rolling N inputs to avoid re-implementing paste, focus advance,
and mobile autofill - the finicky logic the package exists to own. Because it renders one input,
the layer is a **Twig**: it composes slot Seeds via the package's context, no portal.

**Part surface (mirrors shadcn's InputOTP, canopy-styled).**
- `InputOTP` - the root wrapping the package's `OTPInput`; takes `maxLength`, `value` /
  `onChange`, `onComplete`, `pattern` (default numeric; pass an alphanumeric regex to widen),
  `disabled`, and standard field props. Renders `children` (the groups/slots) via the package's
  render function and forwards `ref` to the underlying input.
- `InputOTPGroup` - a flex run of slots (`flex items-center`), a styled `div` with `cn()` merge.
- `InputOTPSlot` - one character box, addressed by `index`; reads its slot state from the package
  context to render the character and, when active, a **caret/ring**. Styled with full literal
  tokens: `border-border` / `bg-surface` / `text-text`, focus/active ring via
  `ring-2 ring-ring ring-offset-2 ring-offset-ring-offset`, first/last radius rounding,
  `aria-invalid:` danger overrides and the shared `disabled:*` tokens. The fake caret is a thin
  bar animated with `animate-pulse` (gated `motion-reduce:animate-none`); no new keyframe.
- `InputOTPSeparator` - a presentational divider (`role="separator"`, e.g. a dash/dot) between
  groups; non-interactive.

**Styling & recipe.** FULL LITERAL semantic-token utility strings (so Tailwind v4's scanner emits
each - no dynamic class names for slot index or state), `cn()` merge with caller `className`
winning, `forwardRef` on every styled part with a native prop spread, `React.ComponentRef` (not
`React.ElementRef`), and **no `dark:` on the common path** - identical to 0005. Field states
(`disabled`, `aria-invalid`) reuse the exact token classes `Input` uses so an invalid/disabled
`InputOTP` reads identically to an invalid/disabled `Input`.

**Accessibility.** The single underlying input carries the accessible name (via `Label` /
`FormField` / `aria-label`) and `inputmode="numeric"` + `autocomplete="one-time-code"` for numeric
codes so mobile keyboards and OS autofill behave. The visible slots are presentational; the active
slot's caret/ring is a visual cue only. Guard the a11y and interaction promises with **observable
tests** (slots rendered, typing/backspace/paste change the value, numeric pattern rejects letters,
`onComplete` fires, disabled is inert), per the repo learning that a11y is guarded by outcomes,
not scaffolding, and that interactive components need keyboard + controlled/uncontrolled tests.

**Motion.** Only the fake caret pulses, via `animate-pulse` gated behind `motion-reduce:animate-none`;
no other animation and no new keyframe.

**Trade-offs.**
- *`input-otp` package vs hand-rolled N inputs*: the package owns paste distribution, focus
  advance, and mobile autofill against one real input - correct semantics that a DIY row of inputs
  gets wrong; the cost is one more runtime dependency. Accepted; matches shadcn and is the exact
  missing primitive.
- *New dependency*: one more runtime dep on canopy (externalized in tsup, not bundled). It is
  small and widely used, but it is a **new primitive family outside Radix** -
  **security/architecture personas should weigh the new-dependency surface in review**.
- *Numeric default vs open pattern*: defaulting `pattern` to numeric fits the common OTP case and
  drives the right mobile keyboard; alphanumeric is opt-in via a caller regex (documented in a
  story) so the surface stays small.

## Acceptance

- [ ] `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, and `InputOTPSeparator` ship from
      `@rogueoak/canopy/twigs` (exported via `twigs/index.ts`), built on the **`input-otp`**
      package (added to `packages/canopy/package.json` dependencies **and** externalized in
      `packages/canopy/tsup.config.ts`); recipe obeyed - full literal token classes, `cn()` merge,
      `forwardRef` + native prop spread, `React.ComponentRef`, semantic tokens only, **no `dark:`
      on the common path**.
- [ ] `maxLength` renders that many slots; typing fills left-to-right and advances the active
      slot; `Backspace` clears and steps back; arrow keys move the active slot.
- [ ] **Paste** distributes a whole code across the slots; the numeric `pattern` (default) rejects
      non-digits and an alphanumeric regex admits letters.
- [ ] The active slot shows a **caret/ring** using the focus tokens; the caret pulse is gated with
      `motion-reduce:animate-none`.
- [ ] Value works **controlled** (`value` / `onChange`) and **uncontrolled**; **`onComplete`**
      fires exactly when every slot is filled.
- [ ] `disabled` renders the field inert with the shared disabled tokens; `aria-invalid` applies
      the danger border/ring exactly as `Input` does; the underlying single input carries the
      accessible name and `autocomplete="one-time-code"` for numeric codes.
- [ ] Storybook catalog entry with playground, 6-digit numeric, 4-digit, separated groups,
      alphanumeric, disabled, invalid, and controlled/`onComplete` stories; renders light + dark;
      `pnpm storybook` build is green.
- [ ] Tests cover: renders `maxLength` slots; typing fills/advances; `Backspace` clears/steps
      back; paste distributes; numeric pattern rejects letters; `onComplete` fires when full;
      controlled renders and uncontrolled edits; `disabled` inert; `aria-invalid` styling;
      `className` merge (caller wins); ref forwarding. `pnpm test` / `lint` / `build` pass from the
      root.
- [ ] Canopy `README.md` component list includes InputOTP; `overview/features.md` (new OTP
      capability) and `overview/architecture.md` (new `input-otp` dependency in the canopy
      dependency footprint) updated on completion.
