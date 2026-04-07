# B2B Billing Patterns

## Overview

B2B billing in Clerk attaches subscriptions to **organizations**, not individual users. Each org gets its own Stripe subscription. Clerk handles per-seat billing automatically.

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

Clerk automatically increments seat count when org members are added:

1. Org subscribes to a seat-based plan
2. Admin invites a member via `<OrganizationSwitcher />` or invitation API
3. When the invitation is accepted, Clerk calls Stripe to add a seat
4. Stripe bills the org for the updated seat count

No custom code needed. Clerk handles the Stripe subscription item update.

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
				<PricingTable />
			) : (
				<p>Contact your org admin to manage billing.</p>
			)}
		</div>
	)
}
```

Only admins should manage billing. Use `orgRole` from `auth()` to gate the billing UI.

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
				seats: items.length,
				status,
			},
			update: { plan, subscriptionId: id, seats: items.length, status },
		})
	}
}

if (evt.type === 'subscription.updated') {
	const { id, payer, items, status } = evt.data
	if (payer.organization_id) {
		const plan = items[0]?.plan?.slug
		await db.orgSubscriptions.update({
			where: { orgId: payer.organization_id },
			data: { plan, seats: items.length, status },
		})
	}
}
```

Use `payer.organization_id` (nested under `payer`, not a top-level `org_id`) when the subscription belongs to an organization. The seat count is derived from `items.length` because Clerk tracks per-seat billing as one subscription item per member.

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
