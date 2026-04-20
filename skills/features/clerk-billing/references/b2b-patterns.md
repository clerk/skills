# B2B Billing Patterns

## Overview

B2B billing in Clerk attaches subscriptions to **organizations**, not individual users. Each org gets its own Clerk subscription (backed by Stripe for payment processing only — Clerk Plans and pricing are not synced to Stripe Billing). Clerk manages per-seat pricing internally.

> **Create the plan in the Organization Plans tab.** [Dashboard → Billing → Plans](https://dashboard.clerk.com/last-active?path=billing/plans) has two tabs; slugs are scoped per tab. A `team` plan created under *User Plans* will not appear in `<PricingTable for="organization" />`, and vice versa. Plans cannot be moved between tabs — recreate if misplaced.

## Core Pattern: Org-Level Plan Check

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function TeamDashboard() {
	const { orgId, has } = await auth()

	if (!orgId) {
		redirect('/sign-in')
	}

	if (!has({ plan: 'team' })) {
		redirect('/billing')
	}

	return <TeamFeatures />
}
```

**Always check `orgId` first.** If the user has no active org, `has({ plan })` evaluates against the user's personal subscription (which may not exist).

## Per-Seat Billing

For per-seat Plans, Clerk manages seat pricing internally at the organization level. Stripe is used only as the payment processor — it does not track Clerk seats as separate Stripe subscription items.

The key invariants:
- There is only one `active` SubscriptionItem per payer per Plan. **Do not derive seat count from `items.length`.**
- Adding or removing organization members does not create new SubscriptionItems; Clerk updates the org's single active item's quantity internally.
- Subscription and plan data are managed in Clerk, not synced to Stripe Billing (Clerk Billing and Stripe Billing are different products).

No custom seat-counting code is needed — let Clerk own the seat state and read the active Plan via `has({ plan: 'team' })`.

## Org Billing Page

```tsx
import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function OrgBillingPage() {
	const { orgId, has, orgRole } = await auth()

	if (!orgId) redirect('/select-org')

	const isAdmin = orgRole === 'org:admin'

	return (
		<div>
			<h1>Team Billing</h1>
			{isAdmin ? (
				<PricingTable for="organization" />
			) : (
				<p>Contact your org admin to manage billing.</p>
			)}
		</div>
	)
}
```

Only admins should manage billing. Use `orgRole` from `auth()` to gate the billing UI. Pass `for="organization"` to render org-level plans — without it, `<PricingTable />` defaults to `for="user"` and shows personal plans.

## Webhook: Org Subscription Events

```typescript
if (evt.type === 'subscription.created') {
	const { id, payer, items, status } = evt.data
	if (payer.organization_id) {
		const plan = items[0]?.plan?.slug
		await db.orgSubscriptions.upsert({
			where: { orgId: payer.organization_id },
			create: {
				orgId: payer.organization_id,
				plan,
				subscriptionId: id,
				status,
			},
			update: { plan, subscriptionId: id, status },
		})
	}
}

if (evt.type === 'subscription.updated') {
	const { id, payer, items, status } = evt.data
	if (payer.organization_id) {
		const plan = items[0]?.plan?.slug
		await db.orgSubscriptions.update({
			where: { orgId: payer.organization_id },
			data: { plan, status },
		})
	}
}
```

Use `payer.organization_id` (nested under `payer`, not a top-level `org_id`) when the subscription belongs to an organization. Do NOT use `items.length` as a seat count — Clerk manages seats internally and there is only one active SubscriptionItem per payer per Plan.

## Plan Naming for B2B

Recommended slugs:

| Plan | Slug | Seats |
|------|------|-------|
| Startup | `starter` | 5 seats |
| Team | `team` | 10 seats |
| Business | `business` | 25 seats |
| Enterprise | `enterprise` | unlimited |

Define these in Clerk Dashboard → Billing → Plans.

## Common Mistake: Checking Plan Without Active Org

```typescript
// WRONG, user has no active org, has() checks user subscription
const { has } = await auth()
if (!has({ plan: 'team' })) redirect('/billing')

// CORRECT, check orgId first
const { orgId, has } = await auth()
if (!orgId) redirect('/sign-in')
if (!has({ plan: 'team' })) redirect('/billing')
```
