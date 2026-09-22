# SMS Logs: event, payload, and reason reference

The complete, stable contract for the `sms.*` Application Logs. Read
[../SKILL.md](../SKILL.md) first for the lifecycle model and debugging
playbook.

## Events

| Event type | Severity | Meaning |
|------------|----------|---------|
| `sms.accepted` | info | The delivery provider accepted the handoff. Delivery not yet confirmed. |
| `sms.delivered` | success | The carrier confirmed delivery to the handset. |
| `sms.failed` | warning | The send stopped before handoff, or the provider rejected it outright. |
| `sms.undeliverable` | warning | The carrier could not deliver the message after the provider accepted it. |
| `sms.unconfirmed` | info | The provider reported an unknown/unconfirmed delivery outcome. |

WhatsApp messages ride the same family (one pipeline); the `channel` payload
field distinguishes `sms` from `whatsapp`.

## Payload fields

Common to every `sms.*` event:

| Field | Always present | Notes |
|-------|----------------|-------|
| `phone_number` | yes | Destination, E.164. |
| `user_id` | no | Present when the SMS is tied to a user. |
| `phone_number_id` | no | The phone identification id, when known. |
| `slug` | no | Template slug (e.g. `verification_code`). |
| `verification_id` | no | Joins the SMS to its sign-in/sign-up verification. |
| `source_type` | no | The flow: `sign_in_attempt`, `sign_up_attempt`, `user`. |
| `purpose` | no | e.g. `verification`, `reset_password`. |
| `channel` | no | `sms` or `whatsapp`. |

Additional fields on the failure events (`sms.failed`, `sms.undeliverable`):

| Field | On | Notes |
|-------|----|-------|
| `reason` | both | Normalized failure reason (table below). The stable, filterable value. |
| `raw_error` | both | The provider's own diagnostic, **when one was reported**. Provider-specific and unstable — for eyeballing a single case, never for filtering. Absent for transport errors, provider callbacks with no code, and pre-send rejections. |
| `rejected_before_send` | `sms.failed` only | Present and `true` when Clerk stopped the send before contacting any provider. Absent on provider-side failures. See below. |

The payload never carries the message body, the verification code, or the
provider's name.

The failure-only fields (`reason`, `raw_error`, `rejected_before_send`) can be
selected or filtered **only under a concrete `type`** (`sms.failed` /
`sms.undeliverable`). Under the `sms.*` wildcard the request is validated
against the intersection of all five schemas — the common fields above — so
asking for `reason` there returns a 422.

Any of these fields is usable as an exact-match query filter —
`payload_filter[phone_number]`, `payload_filter[user_id]`, etc. — when the
request also sets a `type`. URL-encode values (the `+` of an E.164 number
becomes `%2B`). See the SKILL for the query examples.

## Failure reasons

`reason` is drawn from one fixed set. `country_not_supported` and
`monthly_limit_reached` only ever appear on a **pre-send rejection** — Clerk
stopped the send itself, so `sms.failed` also carries
`rejected_before_send: true` and there is no `raw_error`. `rate_limited` can be
either side: Clerk's own throttle (pre-send, `rejected_before_send: true`, no
`raw_error`) or a provider 429 (no `rejected_before_send`, and a `raw_error`
may be present). The `rejected_before_send` boolean disambiguates — see below.

| Reason | Side | Meaning |
|--------|------|---------|
| `invalid_phone_number` | provider | The destination number is invalid or not a mobile number. |
| `restricted_destination` | provider | The provider is not permitted to send to this region. |
| `sending_limit_reached` | provider | A provider-side sending/price limit was hit. |
| `destination_unreachable` | provider | The handset/carrier could not be reached. |
| `delivery_rejected` | provider | The carrier filtered or refused the message (e.g. recipient opted out). |
| `delivery_expired` | provider | The message expired before it could be delivered. |
| `service_error` | provider | The provider call itself failed. |
| `unknown` | provider | The provider reported a failure with no classifiable cause. |
| `country_not_supported` | Clerk (pre-send) | The destination country is blocked for this instance. |
| `monthly_limit_reached` | Clerk (pre-send) | The instance's monthly SMS limit is exhausted (development instances). |
| `rate_limited` | Clerk (pre-send) or provider | Clerk's per-number / prefix-growth throttle stopped the send (`rejected_before_send: true`), or a provider 429 refused it (no `rejected_before_send`). |

### `rejected_before_send` — why it matters

The `rate_limited` reason is the one place the two sides overlap in spirit, so
the boolean disambiguates the action to take:

- `rejected_before_send: true` → **Clerk** throttled or blocked the send; no
  SMS was ever attempted. The fix is your configuration (country allowlist,
  monthly limit, or expected throttling under a pumping attack). No `raw_error`
  accompanies it, by definition.
- absent → the send reached a **provider**, which then failed or refused it.
  A `raw_error` may be present with the provider's own words.

## Related, but not this family

`protect.sms.*` records Clerk Protect's anti-abuse decisions (a Clerk-side
block). It is a separate event family — a block surfaces there, never as
`sms.failed` — so a full picture of "why didn't this SMS go out?" sometimes
means checking both.
