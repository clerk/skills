# B2C Billing Patterns

## Overview

B2C billing in Clerk attaches subscriptions to **individual users**. Each user gets their own Stripe subscription. Use `has({ plan })` on the user session.

## Core Pattern: User Plan Check

```typescript
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function ProDashboard() {
	const { userId, has } = await auth()

	if (!userId) {
		redirect('/sign-in')
	}

	if (!has({ plan: 'pro' })) {
		redirect('/pricing')
	}

	return <ProContent />
}
```

## Full Pricing Page Setup

```tsx
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
	return (
		<main className="max-w-4xl mx-auto py-12">
			<h1>Choose your plan</h1>
			<PricingTable />
		</main>
	)
}
```

`<PricingTable />` is a Server Component. It fetches plan data from Clerk and renders Stripe Checkout buttons. No props required for basic usage.

## Tiered Feature Gating

```typescript
import { auth } from '@clerk/nextjs/server'

export default async function AppPage() {
	const { has } = await auth()

	const isPro = has({ plan: 'pro' })
	const isStarter = has({ plan: 'starter' })

	return (
		<div>
			<BasicFeature />
			{(isStarter || isPro) && <AnalyticsDashboard />}
			{isPro && <ExportButton />}
			{isPro && <APIAccess />}
		</div>
	)
}
```

## Redirect Pattern After Checkout

After Stripe checkout completes, Clerk refreshes the session with updated plan data. The `<PricingTable />` handles the redirect URL. For custom post-checkout logic:

```typescript
// app/billing/success/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function BillingSuccessPage() {
	const { has } = await auth()

	if (!has({ plan: 'pro' })) {
		return <p>Waiting for subscription to activate...</p>
	}

	redirect('/dashboard')
}
```

## Account Billing Page

Show current plan with the option to upgrade:

```tsx
import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'

export default async function AccountBillingPage() {
	const { has, sessionClaims } = await auth()

	const currentPlan = sessionClaims?.metadata?.plan as string | undefined
	const isPro = has({ plan: 'pro' })
	const isStarter = has({ plan: 'starter' })

	return (
		<div>
			<section>
				<h2>Current Plan</h2>
				{isPro && <p>Pro — $29/month</p>}
				{isStarter && <p>Starter — $9/month</p>}
				{!isPro && !isStarter && <p>Free</p>}
			</section>
			<section>
				<h2>Change Plan</h2>
				<PricingTable />
			</section>
		</div>
	)
}
```

## Client-Side Feature Gating

For interactive components that need plan checks:

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

export function ExportButton() {
	const { has } = useAuth()

	if (!has?.({ plan: 'pro' })) {
		return (
			<button disabled title="Pro plan required">
				Export (Pro)
			</button>
		)
	}

	return <button onClick={handleExport}>Export</button>
}
```

Note: `has` may be `undefined` on initial render. Use optional chaining `has?.()`.

## Free Plan Fallback

Users with no subscription are on the free plan. Do NOT check for a plan called `free` — simply check that the paid plan check fails:

```typescript
const isPro = has({ plan: 'pro' })
const isFree = !isPro

if (isFree) {
	return <UpgradePrompt />
}
```

There is no `has({ plan: 'free' })` — `has()` only returns true for paid plans.
