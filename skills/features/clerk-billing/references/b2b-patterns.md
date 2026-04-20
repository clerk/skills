# B2B Billing Patterns

## Overview

B2B billing in Clerk attaches subscriptions to **organizations**, not individual users. Each org gets its own Clerk subscription (backed by Stripe for payment processing only — Clerk Plans and pricing are not synced to Stripe Billing). Plans can carry a **seat limit** (membership cap) which Clerk enforces on member invites.

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

## Seat-Limit Plans

Clerk Billing's B2B model is **seat-limit plans**, not Stripe-style per-seat metered billing. Each organization plan has a fixed price and an optional membership cap; Clerk enforces the cap at invite/join time. To charge larger orgs more, create tiered plans (e.g. `starter` capped at 5, `team` at 10, `enterprise` unlimited) with increasing fixed prices.

Key invariants:
- **Fixed price per plan**, not auto-scaling per member. Adding members does not increment the org's billing amount on the active plan.
- **One `active` SubscriptionItem per payer per Plan.** Do not derive seat count from `items.length`.
- **Seat limit is a Plan property.** Set it when creating the plan in Dashboard → Billing → Plans (Organization Plans tab); it cannot be changed later.
- When an org exceeds or changes to a plan with a lower limit, existing members stay but new invites are blocked until the org is under cap. See [Plans with seat limits](https://clerk.com/docs/guides/billing/seat-limit-plans) for the exact admin behavior.

No custom seat-counting code is needed. Read the active plan with `has({ plan: 'team' })` and let Clerk enforce membership limits.

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

Use `payer.organization_id` (nested under `payer`, not a top-level `org_id`) when the subscription belongs to an organization. Do NOT use `items.length` as a seat count — seat limits are set at the plan level and there is only one active SubscriptionItem per payer per Plan.

## Plan Naming for B2B

Tier plans by seat cap so bigger orgs pay more:

| Plan | Slug | Seat cap |
|------|------|-------|
| Startup | `starter` | 5 |
| Team | `team` | 10 |
| Business | `business` | 25 |
| Enterprise | `enterprise` | unlimited (requires B2B Authentication add-on) |

Define these in Clerk Dashboard → Billing → Plans → **Organization Plans** tab, toggle **Seat-based** on when creating. Seat caps above 20 and "unlimited" require the B2B Authentication add-on.

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
