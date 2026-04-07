# Billing Webhooks

## Setup

Billing webhooks use the same `verifyWebhook(req)` pattern as all Clerk webhooks. Register the endpoint in Clerk Dashboard → Webhooks.

Subscribe to the billing events you care about. Full catalog:

Subscription events (4):
- `subscription.created`
- `subscription.updated`
- `subscription.active`
- `subscription.pastDue`

SubscriptionItem events (9):
- `subscriptionItem.updated`
- `subscriptionItem.active`
- `subscriptionItem.canceled`
- `subscriptionItem.upcoming`
- `subscriptionItem.ended`
- `subscriptionItem.abandoned`
- `subscriptionItem.incomplete`
- `subscriptionItem.pastDue`
- `subscriptionItem.freeTrialEnding`

Payment attempt events (2):
- `paymentAttempt.created`
- `paymentAttempt.updated`

> There is no `subscription.canceled` event. Cancellation fires at the item level as `subscriptionItem.canceled`. There is no `subscriptionItem.created` event either; new items surface via `subscription.created` or `subscription.updated`.

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

	if (evt.type === 'subscription.created') {
		const { user_id, org_id, plan, subscription_id, status } = evt.data
		const entityId = org_id ?? user_id
		await db.subscriptions.upsert({
			where: { entityId },
			create: { entityId, plan, subscriptionId: subscription_id, status },
			update: { plan, subscriptionId: subscription_id, status },
		})
	}

	if (evt.type === 'subscription.updated') {
		// Destructure `seats` so B2B per-seat changes (member add/remove)
		// stay in sync with your database.
		const { subscription_id, plan, status, seats } = evt.data
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { plan, status, seats },
		})
	}

	if (evt.type === 'subscriptionItem.canceled') {
		const { subscription_id } = evt.data
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { status: 'canceled' },
		})
	}

	if (evt.type === 'subscriptionItem.pastDue') {
		const { subscription_id, user_id, org_id } = evt.data
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { status: 'past_due' },
		})
		// Notify user/org admin
	}

	if (evt.type === 'subscription.active') {
		const { subscription_id } = evt.data
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { status: 'active' },
		})
	}

	return new Response('OK', { status: 200 })
}
```

## Make Route Public

In `proxy.ts` (Next.js <=15: `middleware.ts`):

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
	if (!isPublicRoute(req)) await auth.protect()
})
```

## Event Payload Reference

### subscription.created / subscription.updated

```typescript
{
	type: 'subscription.created',
	data: {
		subscription_id: string,
		user_id: string | null,
		org_id: string | null,
		plan: string,
		status: 'active' | 'trialing' | 'past_due' | 'canceled',
		seats: number | null,
		current_period_start: number,
		current_period_end: number,
	}
}
```

### subscriptionItem.canceled

```typescript
{
	type: 'subscriptionItem.canceled',
	data: {
		subscription_id: string,
		user_id: string | null,
		org_id: string | null,
		plan: string,
		canceled_at: number,
	}
}
```

### subscriptionItem.pastDue

```typescript
{
	type: 'subscriptionItem.pastDue',
	data: {
		subscription_id: string,
		user_id: string | null,
		org_id: string | null,
		amount: number,
		currency: string,
		failure_reason: string,
	}
}
```

## Key Rules

- `user_id` is set for B2C subscriptions, `org_id` for B2B
- Both may be present for personal accounts within an org
- Use `org_id ?? user_id` to get the subscribing entity
- Always return `200` quickly, handle async work in a queue or background job
- Use `upsert` in `subscription_created` to handle replay events safely
- `CLERK_WEBHOOK_SECRET` must match the secret from the Clerk Dashboard endpoint

## Subscription Status Values

| Status | Meaning |
|--------|---------|
| `active` | Subscription is active and paid |
| `trialing` | In free trial period |
| `past_due` | Payment failed, grace period |
| `canceled` | Subscription ended |
| `incomplete` | Checkout started but not completed |
