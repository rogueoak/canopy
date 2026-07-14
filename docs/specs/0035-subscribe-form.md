# 0035 - SubscribeForm (a presentational subscribe Branch)

## Problem

Two sibling apps - `matthewmaynes` and `rogueoak` - each carry a near-identical
`SubscribeForm` React component (an email-capture box with an optional Name field, a
submitting/success/error state machine, a honeypot, and a success card). The two copies have
drifted only in app-specific ways: a different `source` analytics union, different PostHog event
names, different heading/success copy, and an iOS anti-zoom `text-base` fix that only one of them
carries. The shared UI - the layout, the progressive-disclosure Name reveal, the state machine,
the a11y wiring - is duplicated and maintained twice.

Canopy is the natural home for that shared UI. This spec ships **SubscribeForm** as a Canopy
**Branch** (`@rogueoak/canopy/branches`) so both apps consume one component and keep only their
own transport, analytics, and copy.

Audience: the two apps above (and any future site that wants a themed subscribe box), and us
(extending the Branches layer with a form organism).

## Outcome

When done:

- `@rogueoak/canopy/branches` exports an accessible, themed `SubscribeForm`.
- The component is **presentational + stateful**: it owns the layout, the submit/success/error
  state machine, the animated optional-Name reveal, the honeypot field, and the a11y wiring - but
  it does **no** network I/O and knows **nothing** about PostHog or any specific endpoint. The
  consumer supplies the submit via `onSubscribe` and (optionally) analytics via `onEvent`.
- Both apps replace their local `SubscribeForm` with a thin wrapper around the Canopy component,
  deleting the duplicated UI and keeping only their transport/analytics/copy.
- Storybook gains a `Branches/SubscribeForm` section; the component has tests (idle -> submit ->
  success, error path, the Name reveal, the analytics phases, ref forwarding).

## Scope

### In

- **SubscribeForm** (`@rogueoak/canopy/branches`) - one stateful component that:
  - Renders an email `Input` (required) and an **optional Name** `Input` that stays collapsed
    until the email is focused, then animates open (horizontal grow at `sm+`, vertical below),
    `motion-reduce`-safe, and is out of the tab order + a11y tree while collapsed.
  - Owns a `Status` state machine (`idle | submitting | success | error`). On submit it collects
    `{ email, name, company }` (the last being the honeypot), calls `onSubscribe(values)`, and
    reflects the result: on resolve it renders a **success `Card`** (a confirmation badge with an
    inline check glyph + a copy slot); on reject it renders an inline `role="alert"` message using
    the rejected error's `.message`.
  - Fires **analytics phases** through an optional `onEvent(phase, props)` callback - `phase` is
    `'submitted' | 'succeeded' | 'failed'`, `props` carries `{ source, has_name }` (PII-free; a
    boolean, never the name) plus, for `failed`, a `reason` taken from the rejected error's
    `.reason` (default `'error'`). The consumer maps phases to its own event names and gating.
  - Inherits the **iOS anti-zoom** behaviour from the `Input` Seed, which defaults to
    `text-base md:text-sm` (16px on mobile, 14px from `md` up) since feedback 0017 / #48 - so
    SubscribeForm adds no per-field font override.
  - Takes copy as props so each app keeps its exact wording: `title` / `description` (the box
    heading, rendered when `heading` is true), and `successBadge` / `successMessage` (the success
    card's badge label + body, `ReactNode`), all with sensible defaults. Plus `source: string`,
    `alwaysShowName?`, `heading?`, and `className`.
- **Icon-free**: the success check is a **hand-rolled inline `currentColor` SVG** (the
  Dialog-close / Breadcrumb-chevron precedent), because Canopy must not depend on
  `@rogueoak/icons`.
- Barrel export in `src/branches/index.ts`; a `Branches/SubscribeForm` Storybook section; tests.

### Out

- **Network / transport** - no `fetch`, no endpoint knowledge; the consumer's `onSubscribe` owns
  it (Constant Contact, list ids, the honeypot drop decision, the test-domain short-circuit all
  stay in each app's server code).
- **Analytics SDK** - no PostHog dependency; the consumer wires `onEvent` to its own analytics.
- **The server `subscribe.ts` core** (OAuth, sign_up_form, CRM/unsubscribed path) - stays in each
  app; it is app-specific and holds secrets-adjacent logic.
- **Multi-step / double-opt-in / inline validation** beyond the native `type="email"` + required.

## Approach

- **Presentational Branch.** It is a Branch (not a Twig) because it owns real interaction state
  (the submit state machine + the reveal) and composes lower layers (`Card` Twig, `FormField`
  Twig, `Button` + `Input` Seeds). It is the first Branch that is *transport-agnostic by
  injection*: the app owns I/O, Canopy owns UI + state + a11y. This keeps Canopy free of any
  consumer coupling - the key lesson this spec banks (see learnings).
- **Composes Seeds and Twigs, adds no token.** Email/Name are `FormField` + `Input`; the submit is
  a `Button`; the success surface is a `Card` + `CardContent`. The confirmation badge and error
  text use existing semantic tokens (`success`, `danger`, `text`, `text-muted`) - no new token, no
  `dark:` on the common path.
- **Same Branches rules** - `cn()` merge, **full-literal** class strings, `forwardRef` + native
  prop spread, semantic tokens only. The `<section>` is the ref/className/native-prop surface.
- **onSubscribe contract.** `onSubscribe(values: { email: string; name: string; company: string })
  => Promise<void>`; it resolves on success and **rejects to signal failure**. Canopy displays the
  rejected error's `.message` (falling back to a default) and forwards its `.reason` to
  `onEvent('failed', ...)`, so an app that throws `Object.assign(new Error(msg), { reason:
  'http_500' })` keeps both the user-facing message and the analytics fidelity it has today.
- **Testing** - Vitest + Testing Library + `user-event` assert the behaviour (reveal on focus,
  submit calls `onSubscribe` with the collected values, success card renders, error alert renders
  the rejected message, all three `onEvent` phases fire, ref forwards), not class strings.

### Decision (locked) - presentational, not transport-owning
Considered a variant where Canopy owns the `fetch` to a configurable `action` URL. Rejected:
baking an endpoint + body shape + honeypot semantics into a design-system component couples it to
one app's server contract. Injecting `onSubscribe`/`onEvent` keeps Canopy a pure UI library and
lets each app keep its own transport, list handling, and analytics unchanged.

### Decision (locked) - honeypot stays rendered by Canopy
Canopy renders the hidden `company` honeypot (it is a form-UI concern) and reports its value in
the `onSubscribe` payload; the app forwards it and makes the server-side drop decision. This keeps
the anti-bot affordance a reusable part of the component while leaving the policy to the app.

## Acceptance

- [ ] `@rogueoak/canopy/branches` exports `SubscribeForm` (+ its props type); semantic tokens
      only, light **and** dark, no per-component theme code, no `@rogueoak/icons` dependency.
- [ ] The optional Name field is collapsed initially, reveals (animated, `motion-reduce`-safe) on
      email focus, and is out of the tab order + a11y tree while collapsed; `alwaysShowName` starts
      it revealed.
- [ ] Submitting calls `onSubscribe` once with `{ email, name, company }`; a resolve renders the
      success `Card`; a reject renders an inline `role="alert"` with the rejected error's message.
- [ ] `onEvent` fires `submitted` before the call, then `succeeded` or `failed` - each with
      `{ source, has_name }` (and `failed` a `reason`); `has_name` is a boolean, never the name.
- [ ] Copy props (`title`/`description`/`successBadge`/`successMessage`) and `heading` let a
      consumer reproduce each app's exact wording; the inputs inherit the `Input` Seed's
      16px-on-mobile default (feedback 0017), so iOS never focus-zooms.
- [ ] Storybook `Branches/SubscribeForm` section: idle, revealed-Name, success, and error stories,
      in both themes; tests pass; `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check` green.
- [ ] README + `docs/overview/` updated (SubscribeForm Branch + the inject-transport/analytics
      pattern); both consumer apps updated to the Canopy component on `@rogueoak/canopy@^0.11.0`.
