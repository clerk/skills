---
name: clerk-billing
description: Clerk Billing for subscription management - integrate Stripe pricing
  tables, subscription plans, per-seat B2B billing, feature entitlements, and billing
  webhooks. Use for SaaS monetization, plan gating, checkout flows, trials, metered
  usage, invoicing, and subscription lifecycle management.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: 1.0.0
  inputs:
  - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    description: Clerk publishable key from dashboard
    required: true
  - name: CLERK_SECRET_KEY
    description: Clerk secret key for server-side operations
    required: true
  - name: CLERK_WEBHOOK_SECRET
    description: Webhook signing secret for billing events
    required: true
---

# Billing

> **Beta**: Clerk Billing is currently in Beta. APIs are experimental and may undergo breaking changes. Pin your SDK and clerk-js package versions.

> **Prerequisite**: Enable Billing in Clerk Dashboard → Billing → Connect Stripe. Clerk Billing requires an active Stripe account.
>
> **Version**: Clerk Billing is available in `@clerk/nextjs` v6+ (Core 3). The `has({ plan })` and `has({ feature })` checks are NOT available in Core 2.

## Quick Start

1. **Connect Stripe** in Clerk Dashboard → Billing
2. **Create plans** in Clerk Dashboard → Billing → Plans (maps to Stripe Products)
3. **Render `<PricingTable />`** on your pricing page
4. **Gate features** with `has({ plan })` or `has({ feature })` from `auth()`
5. **Handle billing webhooks** for subscription lifecycle events

## References

| Reference | Description |
|-----------|-------------|
| `references/billing-components.md` | `<PricingTable />` and subscription UI |
| `references/b2c-patterns.md` | B2C subscription billing patterns |
| `references/b2b-patterns.md` | B2B per-seat billing with organizations |
| `references/billing-webhooks.md` | Subscription lifecycle event handling |

## Documentation

- [Billing overview](https://clerk.com/docs/guides/billing/overview)
- [B2B SaaS billing](https://clerk.com/docs/guides/billing/for-b2b)
- [B2C SaaS billing](https://clerk.com/docs/guides/billing/for-b2c)
- [Billing webhooks](https://clerk.com/docs/guides/development/webhooks/billing)

## Features vs Plans: When to Use Which

**Use `has({ feature: 'slug' })` when gating a specific capability** — export, analytics, API access, audit logs.

**Use `has({ plan: 'slug' })` when gating a tier** — showing the pro dashboard, checking org subscription level, redirecting free users.

| Scenario | Correct check |
|----------|---------------|
| Gate the "Export CSV" button | `has({ feature: 'export' })` |
| Gate the "Analytics" section | `has({ feature: 'analytics' })` |
| Gate all of /dashboard/pro | `has({ plan: 'pro' })` |
| Check if org has team subscription | `has({ plan: 'team' })` |
| Gate SSO configuration | `has({ feature: 'sso' })` |

When a user says "gate the export feature" or "gate analytics" — always use `has({ feature })`. Only use `has({ plan })` when the gate is the plan tier itself, not a specific capability within it.

## Key Patterns

### 1. Render the Pricing Table

Show available plans to users with a single component:

```tsx
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
	return (
		<main>
			<h1>Choose a plan</h1>
			<PricingTable />
		</main>
	)
}
```

`<PricingTable />` automatically renders all plans configured in the Clerk Dashboard. It handles the Stripe Checkout redirect. No props needed for basic usage.

### 2. Check Feature Entitlements (Server-Side)

Gate by individual features — this is the preferred approach for specific capabilities:

```typescript
import { auth } from '@clerk/nextjs/server'

export default async function AnalyticsPage() {
	const { has } = await auth()

	const canViewAnalytics = has({ feature: 'analytics' })
	const canExport = has({ feature: 'export' })

	return (
		<div>
			{canViewAnalytics && <AnalyticsChart />}
			{canExport && <ExportButton />}
		</div>
	)
}
```

Features are configured in Clerk Dashboard → Billing → Features and assigned to plans. Use `has({ feature })` instead of `has({ plan })` when gating granular capabilities — check the feature, not the plan.

### 3. Check Feature Entitlements (Client-Side)

Use `useAuth()` for client-side feature gating. Combine with server-side checks for full coverage:

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export function FeatureGatedUI() {
	const { has, isLoaded } = useAuth()
	if (!isLoaded) return null

	const canExport = has?.({ feature: 'export' })
	const canAnalytics = has?.({ feature: 'analytics' })

	return (
		<div>
			{canAnalytics && <AnalyticsSection />}
			{canExport ? <ExportButton /> : <UpgradeToExport />}
		</div>
	)
}
```

Server Components use `auth()`, Client Components use `useAuth()`. Both support `has({ feature })` and `has({ plan })`.

### 4. Check Subscription Plan Server-Side

Gate access by subscription plan (use this for tier-level gates, not individual features):

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProDashboard() {
	const { has } = await auth()

	if (!has({ plan: 'pro' })) {
		redirect('/pricing')
	}

	return <ProFeatures />
}
```

### 5. Client-Side Plan Checks

Use `useAuth()` hook for client components:

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export function UpgradePrompt() {
	const { has } = useAuth()

	if (has?.({ plan: 'pro' })) {
		return null
	}

	return (
		<div>
			<p>Upgrade to Pro to access this feature</p>
			<a href="/pricing">View plans</a>
		</div>
	)
}
```

### 6. B2B Per-Seat Billing with Organizations

For B2B apps where organizations subscribe:

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

Clerk automatically handles per-seat billing at the organization level — each additional member added to an org increments the seat count in Stripe.

### 7. Display Subscription Status

Show the user's current plan in the dashboard:

```typescript
import { auth } from '@clerk/nextjs/server'

export default async function AccountPage() {
	const { sessionClaims } = await auth()

	const plan = sessionClaims?.metadata?.plan as string | undefined

	return (
		<div>
			<h2>Current Plan</h2>
			<p>{plan ? `You are on the ${plan} plan` : 'Free plan'}</p>
			{!plan && <a href="/pricing">Upgrade</a>}
		</div>
	)
}
```

### 8. Protect API Routes by Plan

Gate API routes using `auth()`:

```typescript
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
	const { has } = await auth()

	if (!has({ plan: 'pro' })) {
		return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
	}

	return NextResponse.json({ data: 'premium data' })
}
```

### 9. Handle Billing Webhooks

> **Clerk event names differ from Stripe event names.** Clerk billing webhooks use dot-notation and camelCase, not Stripe's underscore format.
>
> | Intent | Stripe event name | Clerk event name |
> |--------|------------------|-----------------|
> | Subscription created | `customer.subscription.created` | `subscription.created` |
> | Subscription updated | `customer.subscription.updated` | `subscription.updated` |
> | Subscription canceled | `customer.subscription.deleted` | `subscriptionItem.canceled` |
> | Payment failed / past due | `invoice.payment_failed` | `subscriptionItem.pastDue` |
> | Subscription active | — | `subscription.active` |
> | Subscription past due | — | `subscription.pastDue` |
> | Item created | — | `subscriptionItem.created` |
> | Upcoming renewal | — | `subscriptionItem.upcoming` |
> | Item active | — | `subscriptionItem.active` |
> | Item updated | — | `subscriptionItem.updated` |
> | Subscription ended | — | `subscriptionItem.ended` |
> | Subscription abandoned | — | `subscriptionItem.abandoned` |
> | Incomplete subscription | — | `subscriptionItem.incomplete` |
> | Free trial ending soon | — | `subscriptionItem.freeTrialEnding` |
> | Payment attempt created | — | `paymentAttempt.created` |
> | Payment attempt updated | — | `paymentAttempt.updated` |
>
> Always use Clerk's event names — never Stripe's — in `evt.type` checks.

Listen for subscription lifecycle events:

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
		const { user_id, org_id, plan, subscription_id } = evt.data
		const entityId = org_id ?? user_id
		await db.subscriptions.create({
			data: { entityId, plan, subscriptionId: subscription_id, status: 'active' },
		})
	}

	if (evt.type === 'subscription.updated') {
		const { user_id, org_id, plan, subscription_id } = evt.data
		const entityId = org_id ?? user_id
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { plan, entityId },
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
		const { user_id, org_id, subscription_id } = evt.data
		const entityId = org_id ?? user_id
		await db.subscriptions.update({
			where: { subscriptionId: subscription_id },
			data: { status: 'past_due' },
		})
	}

	return new Response('OK', { status: 200 })
}
```

Make the webhook route public in `proxy.ts` (Next.js <=15: `middleware.ts`):

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/api/webhooks(.*)'])

export default clerkMiddleware(async (auth, req) => {
	if (!isPublicRoute(req)) await auth.protect()
})
```

### 10. Upgrade / Downgrade Flow

Let users manage their subscription from inside the app:

```tsx
import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export default async function BillingPage() {
	const { has } = await auth()
	const isPro = has({ plan: 'pro' })

	return (
		<div>
			<h1>Billing</h1>
			{isPro ? (
				<div>
					<p>You are on the Pro plan</p>
					<PricingTable />
				</div>
			) : (
				<div>
					<p>Upgrade to access premium features</p>
					<PricingTable />
				</div>
			)}
		</div>
	)
}
```

`<PricingTable />` renders differently for subscribed users — it shows the current plan and allows upgrades or cancellations.

## Plan and Feature Naming

Plan slugs and feature slugs are defined in Clerk Dashboard → Billing. Common conventions:

| Tier | Plan Slug | Example Features |
|------|-----------|-----------------|
| Free | (no plan check needed) | basic features |
| Starter | `starter` | `analytics`, `api_access` |
| Pro | `pro` | `analytics`, `export`, `team` |
| Enterprise | `enterprise` | all features + `sso`, `audit_logs` |

Use lowercase slugs matching what you define in the dashboard.

## B2B vs B2C Billing

| Scenario | Who subscribes | Plan check |
|----------|---------------|------------|
| B2C SaaS | Individual user | `has({ plan: 'pro' })` on user session |
| B2B SaaS | Organization | `has({ plan: 'team' })` on org session |
| Per-seat | Organization | Clerk auto-increments seats per org member |

For B2B, ensure the user has an active org session. The `has()` check evaluates the active entity (user or org).

## Checkout Flows

Clerk handles Stripe Checkout automatically through `<PricingTable />`. Do NOT manually create Stripe checkout sessions.

```tsx
import { PricingTable } from '@clerk/nextjs'

export default function UpgradePage() {
	return (
		<div>
			<h1>Upgrade your plan</h1>
			<PricingTable />
		</div>
	)
}
```

To trigger checkout from a server action, redirect to the pricing page:

```typescript
'use server'
import { redirect } from 'next/navigation'

export async function upgradeAction() {
	redirect('/pricing')
}
```

`<PricingTable />` renders all plans from Dashboard, handles Stripe Checkout redirect, processes payment, and updates the session. No Stripe API calls needed.

## Debugging `has()` Failures

When `has({ plan: 'pro' })` returns false after checkout:

1. **Verify plan slug** — open Clerk Dashboard → Billing → Plans. The slug must match exactly (case-sensitive). Common mistake: using `'Pro'` instead of `'pro'`.
2. **Check Stripe connection** — Dashboard → Billing must show a connected Stripe account. Without it, no subscriptions are created.
3. **Refresh the session** — after Stripe Checkout completes, the session token needs to refresh to include the new plan. Call `await clerk.session?.reload()` or navigate to force a new session.
4. **Verify subscription exists** — Dashboard → Billing → Subscriptions. If the subscription is missing, the Stripe webhook may have failed.
5. **Check environment** — ensure `CLERK_SECRET_KEY` is set in production. `has()` on the server requires it.

Do NOT build a custom subscription tracking system. If `has()` fails, the issue is always configuration, not a missing feature.

## Billing Gates Permissions

When Billing is enabled, `has({ permission: 'org:posts:edit' })` returns `false` if the Feature associated with that permission is not included in the organization's active Plan — even if the user has the permission assigned via their role. This is by design: billing gates permissions at the feature level. Always ensure the required Feature is attached to the Plan in Dashboard → Billing → Plans → Features.

## Common Pitfalls

| Symptom | Cause | Solution |
|---------|-------|----------|
| `has({ plan })` always false | Plan slug mismatch or Billing not connected | Verify exact slug in Dashboard, connect Stripe |
| `has({ plan })` false after checkout | Session not refreshed | Reload session or navigate after checkout |
| `<PricingTable />` renders empty | No plans created | Create plans in Dashboard → Billing |
| Webhook 401 | Route protected by middleware | Add `/api/webhooks` to public routes |
| Stripe checkout fails | Stripe not connected | Connect Stripe in Dashboard → Billing |
| B2B plan check fails | No active org | Ensure user selected org before checking |
| Works locally, fails in prod | Missing env var | Add `CLERK_SECRET_KEY` to production |

## See Also

- `clerk-setup` - Initial Clerk install
- `clerk-orgs` - B2B organizations (required for per-seat billing)
- `clerk-webhooks` - Webhook signature verification and routing
- `clerk-custom-ui` - Theming `<PricingTable />` appearance
