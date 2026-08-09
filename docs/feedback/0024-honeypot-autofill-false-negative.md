# 0024 - SubscribeForm honeypot causes autofill false-negatives

## Symptom

Real people who submit the subscribe form may never be subscribed, silently. `SubscribeForm`
(spec 0035) renders a hidden `company` honeypot input and forwards its value in the `onSubscribe`
payload; every consuming app's server (matthewmaynes, rogueoak, branchout, famlistry) treats a
non-empty `company` as a bot and **drops the submission**, returning a fake `200 { ok: true }` so
a bot learns nothing. The same silence means a wrongly-dropped human sees a success state but is
never added to the list, and no error is ever surfaced to anyone.

## Root cause

A hidden honeypot only works if the field stays empty for every genuine user. That assumption does
not hold: browser and password-manager autofill do not reliably respect `autocomplete="off"` or a
hidden (`display:none` / off-screen) field, and an organization/company autofill profile can fill a
`company` input the human never sees. Because the anti-bot action is a **silent drop**, the failure
is invisible - the cost of a false positive is an unrecoverable lost subscriber, and you never hear
about it. The rogueoak contact form's honeypot is deliberately off-screen (not `display:none`)
precisely because `display:none` fields are skipped by autofill - which makes that copy *more*
exposed to this bug, not less.

## Fix

Remove the honeypot entirely rather than try to harden it (there is no field-emptiness assumption
that survives every browser/agent). Preference: bias to capturing subscribers over rejecting spam,
since the other anti-abuse layers remain.

- **Canopy 1.4.0 (breaking):** `SubscribeForm` no longer renders the hidden `company` input;
  `SubscribeValues` drops `company` (payload is now `{ email, name }`). Removing a public interface
  field is breaking, so this ships as a minor (1.4.0), not a patch. Spec 0035's "honeypot stays
  rendered by Canopy" locked decision is revised in place. (Strict SemVer would make a post-1.0
  breaking removal a major (2.0.0); the developer deliberately kept 1.4.0 because all four
  consumers are updated in lockstep here and the runtime is fail-safe - an un-updated server sees
  `company` absent and simply stops dropping - so no consumer breaks in practice.)
- **Consumers:** bump to `@rogueoak/canopy@^1.4.0`, drop `company` from the client `onSubscribe`
  wrapper, and delete the server-side honeypot check (and, for matthewmaynes + rogueoak, the same
  honeypot on their hand-rolled contact forms). Remaining anti-abuse: per-IP rate limiting,
  body-size caps, and double-opt-in confirmation via Constant Contact.

## Learning

Weigh a spam control by its false-negative cost, not just its spam-catching. A hidden-field
honeypot that gates a **silent drop** is only safe if no autofill or agent ever fills it - which is
not guaranteed across browsers and password managers - and its failures are invisible, the most
expensive kind. Prefer anti-abuse that does not depend on a field staying empty for every real user
(rate limiting, body-size caps, double-opt-in). When a capture path matters more than perfect spam
rejection, bias to capturing. Generalized in `docs/overview/learnings.md`.
