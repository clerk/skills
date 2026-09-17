---
name: clerk-sms-logs
description: Debug Clerk-delivered SMS (phone verification codes, OTPs) using the sms.* Application Logs. Understand the delivery lifecycle — sms.accepted, sms.delivered, sms.failed, sms.undeliverable, sms.unconfirmed — read the normalized failure reason, and follow one message across events by its trace. Use when a user reports "I never got the code", a phone number won't verify, or SMS delivery to a country/carrier looks broken.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: 1.0.0
compatibility: SMS Application Logs are visible in the Clerk Dashboard for instances with the feature enabled. The events cover Clerk-delivered SMS only (delivered_by_clerk); customer-managed SMS delivery is out of scope.
---

# SMS Logs

Answer one question: **what happened to this Clerk-delivered SMS?** The `sms.*`
Application Logs record the delivery lifecycle of every SMS Clerk sends on an
instance's behalf — phone verification codes, OTPs, password-reset codes — so
you can tell a stuck sign-up from a carrier rejection from a Clerk-side block
without guessing.

Read these in the **Clerk Dashboard → Application Logs**, filtered to the
`sms.*` event types. They are delivery telemetry about end-user activity, not
dashboard actions.

## The five lifecycle events

One SMS moves through this family. Each event is emitted once, when the mapped
state first changes — so a fast delivery may skip straight to `sms.delivered`
without a visible intermediate.

| Event | Meaning | Terminal? |
|-------|---------|-----------|
| `sms.accepted` | The delivery provider accepted the handoff. **Not** proof it reached the phone. | No |
| `sms.delivered` | The carrier confirmed delivery to the handset. | Yes (success) |
| `sms.failed` | The send stopped before handoff, or the provider rejected it outright. Carries a `reason`. | Yes (failure) |
| `sms.undeliverable` | The carrier reported it could not deliver after the provider accepted it. Carries a `reason`. | Yes (failure) |
| `sms.unconfirmed` | The provider explicitly reported an unknown/unconfirmed outcome. No delivery evidence either way. | Yes (indeterminate) |

The mental model: `accepted → delivered` is the happy path. `failed` means it
never got out (or was refused at the door); `undeliverable` means it got out
but the carrier bounced it; `unconfirmed` means nobody knows.

## Debugging playbook

**"The user never received the code."** Filter Application Logs to `sms.*`
and find the message — search by the phone number or the user id (see
[references/events.md](references/events.md) for the payload fields you can
filter on). Then read the latest event for that message:

1. **No `sms.*` event at all** → the send was never attempted. This is usually
   upstream: the verification wasn't created, or the number was blocked before
   the SMS pipeline (check Protect / bot-detection events). It is not an SMS
   delivery problem.
2. **`sms.failed`** → read the `reason`. If `rejected_before_send` is present,
   Clerk stopped it (country block, monthly limit, rate limit) — the fix is on
   your configuration, not the carrier. Otherwise the provider refused it; see
   the reason table.
3. **`sms.accepted` but no `sms.delivered`** → it left Clerk and the carrier
   never confirmed. Give it a moment (delivery receipts lag), then treat a
   lasting gap as a carrier/handset issue for that number.
4. **`sms.undeliverable`** → the carrier bounced it after accepting. Read the
   `reason`; `destination_unreachable` / `invalid_phone_number` point at the
   number itself.
5. **`sms.unconfirmed`** → no delivery signal exists. Don't infer success or
   failure; if the user didn't get it, have them retry.

**"SMS to <country> is broken."** Look for `sms.failed` with
`reason = country_not_supported` (Clerk blocks the country) or
`restricted_destination` (the provider won't send there). A spike of
`reason = rate_limited` with `rejected_before_send` set is Clerk's own
per-number/prefix throttle — expected under a pumping attack, not an outage.

## Reading a failure

`sms.failed` and `sms.undeliverable` carry a normalized `reason` from a fixed
set (the filterable, stable contract) plus an optional `raw_error` (the
provider's own words, when it reported any — useful for a specific case, but
provider-specific and unstable, so never filter on it).

The full reason vocabulary and what each value means — including which reasons
only ever appear on Clerk-side pre-send rejections — is in
[references/events.md](references/events.md#failure-reasons).

## Correlating one message's lifecycle

Every event for a single SMS shares the same **trace**. When a message has
several events (e.g. `accepted` then `undeliverable`), they correlate under one
trace id even though their subjects may differ. Use the trace to assemble the
timeline for one message rather than reading events in isolation.

## Scope and guarantees

- **Clerk-delivered SMS only.** If you bring your own SMS provider
  (`delivered_by_clerk = false`), these events do not describe your sends.
- **Payloads never contain the message body, the verification code, or the
  provider's identity.** Debug from `reason`, timestamps, and the phone/user
  ids — not from message contents that aren't there.
- **Best-effort telemetry.** Like all Application Logs, delivery of these
  events is not guaranteed; a missing event is weak evidence. Don't build
  application logic that depends on every SMS event arriving — for delivery
  state your app must act on, use the verification's own status.
- `protect.sms.*` (Clerk Protect's anti-abuse blocks) is a **separate** family;
  a Clerk-side block shows up there, not as `sms.failed`.

Full event/reason/payload reference: [references/events.md](references/events.md).
