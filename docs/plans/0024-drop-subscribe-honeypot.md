# 0024 - Drop the SubscribeForm honeypot (Canopy 1.4.0 + consumers)

Source: feedback `0024-honeypot-autofill-false-negative.md`; owning spec `0035-subscribe-form.md`.

## Goal

Remove the `company` honeypot everywhere it can drop a real subscriber: from Canopy's
`SubscribeForm` (a breaking API change -> 1.4.0), and from every consuming app (subscribe path in
all four; contact path in matthewmaynes + rogueoak).

## Steps

### Canopy (this repo) - 1.4.0

1. `packages/canopy/src/branches/SubscribeForm.tsx` - drop `company` from `SubscribeValues`, from
   `handleSubmit` (no `data.get('company')`), from the `onSubscribe({ email, name })` call, from the
   prop/interface doc comments, and delete the hidden honeypot `<div>`.
2. `packages/canopy/src/branches/SubscribeForm.test.tsx` - assert `onSubscribe` is called with
   `{ email, name }` (drop `company: ''`).
3. `apps/storybook/src/SubscribeForm.stories.tsx` - drop "a honeypot" from the doc comment.
4. Docs: revise spec 0035 (reverse the locked honeypot decision), and update
   `docs/overview/{features,architecture,learnings}.md`; add feedback 0024; add this plan; add the
   `CHANGELOG.md` 1.4.0 entry.
5. Verify: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm format:check` green.
6. PR + persona review (engineer, architect, security - the public API + anti-abuse posture change),
   merge to `main`, then push tag `1.4.0` -> CI publishes roots/canopy/icons in lockstep.

### Consumers (after 1.4.0 is published)

For each: bump `@rogueoak/canopy` (and `roots`/`icons` where present) to `^1.4.0`, drop `company`
from the client `onSubscribe` wrapper, delete the server-side honeypot check, update tests, then
`install` + `build` + `test` + `lint`; commit + PR.

- **rogueoak** (npm, single pkg): subscribe `src/app/v1/subscribe/route.ts` + client
  `src/components/subscribe-form.tsx`; contact `src/components/contact-form.tsx` +
  `src/app/v1/contact/route.ts`; drop `isHoneypotFilled` from `src/lib/http-guards.ts` if unused.
- **matthewmaynes** (npm, single pkg): same shape as rogueoak (subscribe + contact + http-guards).
- **branchout** (pnpm ws): client `apps/web/components/SubscribeForm.tsx`; server
  `apps/control-plane/src/routes/subscribe.ts` (+ `subscribe.test.ts`); bump canopy in
  `apps/web` + `apps/admin`. No contact honeypot, no icons.
- **famlistry** (pnpm ws): client `apps/marketing/app/Waitlist.tsx`; server
  `apps/marketing/app/api/v1/subscribe/route.ts` (+ `subscribe-route.test.ts`); bump canopy + roots
  in `apps/marketing` + `apps/web` (+ `packages/theme` roots). No contact honeypot, no icons.

## Verification

- Canopy suite green; `SubscribeValues` no longer has `company`; no `company`/honeypot references
  remain in `SubscribeForm.tsx` or its story/test.
- Each consumer builds and its subscribe test suite passes with the honeypot check gone; a
  submission with a `company`-like value is no longer dropped.
