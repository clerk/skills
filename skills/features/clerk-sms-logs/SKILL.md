---
name: clerk-sms-logs
description: Debug Clerk-delivered SMS (phone verification codes, OTPs) using the sms.* Application Logs. Understand the delivery lifecycle — sms.accepted, sms.delivered, sms.failed, sms.undeliverable, sms.unconfirmed — read the normalized failure reason, and follow one message across events by its trace. Use when a user reports "I never got the code", a phone number won't verify, or SMS delivery to a country/carrier looks broken.
allowed-tools: Bash, WebFetch
license: MIT
metadata:
  author: clerk
  version: 1.1.0
compatibility: Query the logs via the Backend API (needs CLERK_SECRET_KEY, sk_*) or the Clerk CLI (clerk api), and read them in the Clerk Dashboard. Available on instances with the feature enabled. Covers Clerk-delivered SMS only (delivered_by_clerk); customer-managed SMS delivery is out of scope.
---

# SMS Logs

Answer one question: **what happened to this Clerk-delivered SMS?** The `sms.*`
Application Logs record the delivery lifecycle of every SMS Clerk sends on an
instance's behalf — phone verification codes, OTPs, password-reset codes — so
you can tell a stuck sign-up from a carrier rejection from a Clerk-side block
without guessing.

Read them two ways: in the **Clerk Dashboard → Application Logs** (filter to
the `sms.*` event types), or programmatically over the **Backend API**
(`GET /v1/logs`) — the same data, scriptable for a repeatable investigation.
They are delivery telemetry about end-user activity, not dashboard actions.

## Querying the logs

The Backend API `logs` endpoints take a secret key (`sk_*`). The simplest
caller is the **Clerk CLI**, which injects auth for you:

```bash
# SMS lifecycle events in the last 24h, newest first
SINCE=$(( ($(date +%s) - 86400) * 1000 ))
clerk api "/logs?type=sms.*&event_time_after=${SINCE}&limit=20"

# Just failures, same window
clerk api "/logs?type=sms.failed&event_time_after=${SINCE}&limit=20"

# One phone number's SMS history (exact-match payload filter)
# channel=sms keeps WhatsApp off the timeline — see the note below
clerk api "/logs?type=sms.*&payload_filter[phone_number]=%2B14155550100&payload_filter[channel]=sms&event_time_after=${SINCE}"

# Why a number's sends failed — concrete type unlocks reason/raw_error
clerk api "/logs?type=sms.failed&payload_filter[phone_number]=%2B14155550100&event_time_after=${SINCE}&payload_fields=phone_number,reason,raw_error,rejected_before_send"

# Every event for one message, by its trace
clerk api "/logs?type=sms.*&trace_id=<trace_id>&event_time_after=${SINCE}"
```

**Always bound the time range.** These logs are high-volume, so start with a
narrow `event_time_after` (and `event_time_before` when you know roughly when
the SMS was sent) and widen only if you come up empty — don't scan the whole
retention window to find one message. Keep `limit` modest (10–50) and page
with the returned cursor rather than raising it. The endpoint queries in
adaptive time windows, so a short or empty page inside your range is normal:
follow `starting_after` until the response reports no next page.

**WhatsApp rides the same `sms.*` family** (one pipeline; the `channel` payload
field is `sms` or `whatsapp`), so a phone-number timeline can mix both
transports. This skill covers SMS — add `payload_filter[channel]=sms` to scope
to it, or read the `channel` field to tell them apart.

Or call the Backend API directly:

```bash
SINCE=$(( ($(date +%s) - 86400) * 1000 ))
curl -s "https://api.clerk.com/v1/logs?type=sms.failed&event_time_after=${SINCE}&limit=20" \
  -H "Authorization: Bearer $CLERK_SECRET_KEY" \
  | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin), indent=2))"
```

Key query parameters (all optional except where a playbook step needs one):

| Param | Purpose |
|-------|---------|
| `type` | Event type: concrete (`sms.failed`) or trailing wildcard (`sms.*`). Required to use `payload_filter`. |
| `payload_filter[<field>]` | Exact match on a payload field, e.g. `payload_filter[user_id]=user_123`. URL-encode values (a `+` in an E.164 number becomes `%2B`). |
| `trace_id` | Correlate every event of one message. |
| `event_time_after` / `event_time_before` | Unix ms bounds. Set at least `event_time_after` on every query — see the note above. |
| `limit`, `starting_after`, `ending_before` | Cursor pagination. |

The list response omits the decoded payload by default; add `payload_fields`
(comma-separated leaf paths) to include specific fields, or fetch one row in
full with `GET /v1/logs/{event_time_ms}:{event_id}`.

**`reason`, `raw_error`, and `rejected_before_send` exist only on the failure
events**, so they are selectable (and filterable) only when `type` is the
concrete `sms.failed` or `sms.undeliverable`. Under the `sms.*` wildcard,
`payload_fields` and `payload_filter` are validated against the *intersection*
of all five schemas — the common fields (`phone_number`, `user_id`,
`phone_number_id`, `slug`, `verification_id`, `source_type`, `purpose`,
`channel`) — and asking for `reason` there is a 422. Use `sms.*` to see a
number's whole timeline; switch to `type=sms.failed` to read why it failed.
Discover the exact allowed fields for any type with
`GET /v1/logs/schemas?type=sms.failed` (or `?type=sms.*` for the intersection).

> These `logs` endpoints are newer and require the feature enabled on the
> instance; if a call 404s or returns nothing, confirm SMS logs are on for
> the instance before treating an empty result as "no such SMS".

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
| `sms.unconfirmed` | The provider explicitly reported an unknown/unconfirmed outcome. No delivery evidence either way. | No — a later `delivered`/`undeliverable` can still supersede it |

The mental model: `accepted → delivered` is the happy path. `failed` means it
never got out (or was refused at the door); `undeliverable` means it got out
but the carrier bounced it; `unconfirmed` means nobody knows.

## Debugging playbook

**"The user never received the code."** Find the message — query `sms.*`
filtered by the phone number or user id (`payload_filter[phone_number]` /
`payload_filter[user_id]`, plus `payload_filter[channel]=sms` to keep WhatsApp
out, per the section above). Then read the latest event for that message:

1. **No `sms.*` event at all** → the logs don't establish that a send was
   attempted. Rule out a gap in the query first: confirm SMS logs are enabled
   for the instance, that your time bounds cover the send, and that you paged
   the cursor to the end (these logs are best-effort — see Scope). Once the
   logs are trustworthy and still empty, the cause is usually upstream: the
   verification wasn't created, or the number was blocked before the SMS
   pipeline (check Protect / bot-detection events). It is not an SMS delivery
   problem.
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
5. **`sms.unconfirmed`** → no delivery signal exists *yet*. It isn't terminal:
   a later `sms.delivered` or `sms.undeliverable` can still supersede it, so
   re-query the trace before concluding. Don't infer success or failure; if a
   definitive event hasn't arrived and the user didn't get it, have them retry.

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
