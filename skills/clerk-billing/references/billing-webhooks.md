# Billing Webhooks

## Setup

Billing webhooks use the same `verifyWebhook(req)` pattern as all Clerk webhooks. Register the endpoint in Clerk Dashboard → Webhooks.

Subscribe to the billing events you care about. Clerk event names use dot-notation and camelCase, not Stripe's underscore format. Use Clerk names in `evt.type` checks.

The table below lists all billing events.

| Intent | Stripe event name | Clerk event name |
| --- | --- | --- |
| Subscription created | `customer.subscription.created` | `subscription.created` |
| Subscription updated | `customer.subscription.updated` | `subscription.updated` |
| Subscription active | (none) | `subscription.active` |
| Subscription past due | (none) | `subscription.pastDue` |
| Subscription item canceled | `customer.subscription.deleted` | `subscriptionItem.canceled` |
| Subscription item past due | `invoice.payment_failed` | `subscriptionItem.pastDue` |
| Subscription item updated | (none) | `subscriptionItem.updated` |
| Subscription item active | (none) | `subscriptionItem.active` |
| Subscription item upcoming renewal | (none) | `subscriptionItem.upcoming` |
| Subscription item ended | (none) | `subscriptionItem.ended` |
| Subscription item abandoned | (none) | `subscriptionItem.abandoned` |
| Subscription item expired | (none) | `subscriptionItem.expired` |
| Subscription item incomplete | (none) | `subscriptionItem.incomplete` |
| Free trial ending soon | (none) | `subscriptionItem.freeTrialEnding` |
| Payment attempt created | (none) | `paymentAttempt.created` |
| Payment attempt updated | (none) | `paymentAttempt.updated` |

> There is no `subscription.canceled` event. Cancellation fires at the item level as `subscriptionItem.canceled`.

## Payload Shape (important)

Clerk billing webhook payloads are nested. Common mistakes come from destructuring fields that live deeper than the top level. The canonical shape:

- `evt.data.id`: the subscription id on subscription events, the subscription item id on subscriptionItem events
- `evt.data.payer`: the subscribing entity, with `user_id?` and `organization_id?` (not `org_id`)
- `evt.data.status`: server-side status string (snake_case, e.g. `past_due`, even though event names are camelCase)
- `evt.data.items[]`: on subscription events only, the array of subscription items
- `evt.data.items[i].plan.slug`: the plan slug for a given item (plan is a nested object)
- `evt.data.subscription_id`: on subscriptionItem events, the parent subscription id. The event data IS the item, so key item rows on `evt.data.id` and store `subscription_id` to link each one to its subscription. `@clerk/backend`'s type doesn't declare the field yet, so widen the type to read it.

## Complete Billing Webhook Handler

```typescript
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  let evt
  try {
    evt = await verifyWebhook(req)
  } catch {
    return new Response('Verification failed', { status: 400 })
  }

  if (evt.type === 'subscription.created' || evt.type === 'subscription.active') {
    const { id, payer, items, status } = evt.data
    const entityId = payer.organization_id ?? payer.user_id
    const plan = items[0]?.plan?.slug
    await db.subscriptions.upsert({
      where: { subscriptionId: id },
      create: { subscriptionId: id, entityId, plan, status },
      update: { entityId, plan, status },
    })
  }

  if (evt.type === 'subscription.updated') {
    const { id, payer, items, status } = evt.data
    const entityId = payer.organization_id ?? payer.user_id
    const plan = items[0]?.plan?.slug
    await db.subscriptions.update({
      where: { subscriptionId: id },
      data: { entityId, plan, status },
    })
  }

  if (evt.type === 'subscription.pastDue') {
    const { id, status } = evt.data
    await db.subscriptions.update({
      where: { subscriptionId: id },
      data: { status },
    })
  }

  if (evt.type === 'subscriptionItem.canceled' || evt.type === 'subscriptionItem.pastDue') {
    // The payload carries subscription_id and updated_at, but @clerk/backend's type doesn't declare them yet
    const item = evt.data as typeof evt.data & { subscription_id?: string; updated_at: number }
    const change =
      evt.type === 'subscriptionItem.canceled'
        ? { status: 'canceled', canceledAt: item.updated_at }
        : { status: 'past_due', pastDueAt: item.updated_at }
    // A subscription can hold several items on the same plan over time, so key rows on the item id
    await db.subscriptionItems.upsert({
      where: { itemId: item.id },
      create: {
        itemId: item.id,
        subscriptionId: item.subscription_id,
        entityId: item.payer?.organization_id ?? item.payer?.user_id,
        plan: item.plan?.slug,
        ...change,
      },
      update: change,
    })
    // Notify user/org admin of the cancellation or payment failure
  }

  return new Response('OK', { status: 200 })
}
```

## Keep the Route Unprotected

Webhook deliveries carry no user session. Don't call `auth.protect()` for `/api/webhooks(.*)`, in middleware or in the handler; `verifyWebhook()` is the only check the route needs. See the `clerk-webhooks` skill.

## Event Payload Reference

Types come from `BillingSubscriptionWebhookEventJSON` and `BillingSubscriptionItemWebhookEventJSON` in `@clerk/backend`. Key fields:

### subscription.created / subscription.updated / subscription.active / subscription.pastDue

```typescript
{
	type: 'subscription.created',
	data: {
		object: 'commerce_subscription',
		id: string,                    // subscription id
		status: 'active' | 'past_due' | 'canceled' | 'ended' | 'abandoned' | 'incomplete' | 'expired' | 'upcoming',
		active_at?: number,
		canceled_at?: number,
		ended_at?: number,
		past_due_at?: number,
		created_at: number,
		updated_at: number,
		latest_payment_id: string,
		payer_id: string,
		payer: {
			object: 'commerce_payer',
			id: string,
			user_id?: string,           // set for B2C subscriptions
			organization_id?: string,   // set for B2B subscriptions
			email: string,
			first_name?: string,
			last_name?: string,
			organization_name?: string,
			// ...
		},
		payment_source_id: string,
		items: Array<{                  // subscription items, one active item per payer per Plan
			id: string,
			status: string,
			plan?: { id, name, slug, amount, period, ... },
			period_start: number,
			period_end: number | null,
			canceled_at?: number,
			past_due_at?: number,
			// ...
		}>,
	}
}
```

### subscriptionItem.canceled / subscriptionItem.pastDue / subscriptionItem.*

The event data IS the item itself, not the parent subscription. This is the payload Clerk sends:

```typescript
{
	type: 'subscriptionItem.canceled',
	data: {
		object: 'commerce_subscription_item',
		id: string,                    // subscription item id
		subscription_id?: string,      // parent subscription id
		status: string,
		is_free_trial: boolean,
		created_at: number,
		updated_at: number,
		period_start: number,
		period_end: number | null,
		interval: string,
		plan_id: string,
		plan: { id, slug, name, amount, currency, is_recurring, ... },
		payer?: { user_id?, organization_id?, email, ... },
		seats?: { quantity: number | null },
		// ...
	}
}
```

`@clerk/backend`'s `BillingSubscriptionItemWebhookEventJSON` doesn't declare `subscription_id` or `updated_at`, and it declares `canceled_at`, `past_due_at`, and `amount`, which this payload doesn't carry.

### paymentAttempt.created / paymentAttempt.updated

```typescript
{
	type: 'paymentAttempt.created',
	data: {
		object: 'commerce_payment_attempt',
		id: string,
		status: 'pending' | 'paid' | 'failed',
		charge_type: 'checkout' | 'recurring',
		failed_reason?: { code: string, decline_code: string },
		paid_at?: number,
		failed_at?: number,
		payer: { user_id?, organization_id?, ... },
		subscription_items: Array<{ /* same shape as subscriptionItem events */ }>,
		// ...
	}
}
```

## Key Rules

- The subscribing entity lives at `evt.data.payer`, with `user_id?` (B2C) or `organization_id?` (B2B)
- The subscription id is `evt.data.id` on subscription events and `evt.data.subscription_id` on subscriptionItem events
- Plan slug is nested: `evt.data.items[i].plan?.slug` on subscription events, `evt.data.plan?.slug` on item events
- Status values use snake_case (`past_due`, `active`, `canceled`), even though event names use camelCase (`subscription.pastDue`)
- Always return `200` quickly. Handle async work in a queue or background job.
- Use `upsert` in `subscription.created` handlers to tolerate webhook replays
- `CLERK_WEBHOOK_SIGNING_SECRET` must match the Signing Secret from the Clerk Dashboard endpoint

## Subscription Status Values

| Status       | Meaning                                           |
| ------------ | ------------------------------------------------- |
| `active`     | Subscription is active and paid                   |
| `past_due`   | Payment failed, grace period                      |
| `canceled`   | Subscription ended                                |
| `ended`      | Subscription reached the end of its term          |
| `abandoned`  | Checkout started but user never completed payment |
| `incomplete` | Checkout in progress                              |
| `expired`    | Subscription expired without renewal              |
| `upcoming`   | Scheduled subscription not yet active             |
