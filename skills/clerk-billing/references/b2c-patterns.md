# B2C Billing Patterns

## Overview

B2C billing in Clerk attaches subscriptions to **individual users**. Each user gets their own Clerk subscription. Use `has({ plan })` on the user session.

> **Prerequisite: personal accounts must be allowed.** If Organizations are enabled, open [Dashboard → Organizations settings](https://dashboard.clerk.com/last-active?path=organizations-settings) and set **Membership options → "Membership optional"**. In "Membership required" mode personal accounts are disabled, `<PricingTable />` silently excludes any user without an active org (no error, no console warning). Check this first when a user reports "subscribe does nothing."

Plans for B2C must be created as **User Plans** (Dashboard → Billing → Plans → User Plans tab, or `clerk config patch` with `billing.plans`). A `pro` plan registered as an Organization Plan is a separate entity and won't appear in `<PricingTable />`. Plan type isn't changeable, recreate if misplaced.

> **Cache Components:** With `cacheComponents: true` (the `create-next-app` default), `next build` fails on request data read outside `<Suspense>`. The Next.js pages below follow the matching shapes: a page that gates its render with `redirect()` gets a `loading.tsx` next to it, a page that uses `auth()` to render data reads it in an async child inside `<Suspense>`, and catch-all `<UserProfile />` and `<OrganizationProfile />` pages render inside `<Suspense>`. See [Read auth data inside Suspense](https://clerk.com/docs/guides/development/rendering-modes#read-auth-data-inside-suspense) and [Prebuilt components on catch-all routes](https://clerk.com/docs/guides/development/rendering-modes#prebuilt-components-on-catch-all-routes).

## Core Pattern: User Plan Check

```typescript
// app/pro/page.tsx
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

```tsx
// app/pro/loading.tsx
export default function Loading() {
	return <p>Loading...</p>
}
```

## Tiered Feature Gating

Prefer `has({ feature })` over `has({ plan })` for capability gating: features can be reattached between plans without a code deploy.

```tsx
import { auth } from '@clerk/nextjs/server'
import { Suspense } from 'react'

async function GatedFeatures() {
	const { has } = await auth()

	const canAnalytics = has({ feature: 'analytics' })
	const canExport = has({ feature: 'export' })
	const canApi = has({ feature: 'api_access' })

	return (
		<>
			{canAnalytics && <AnalyticsDashboard />}
			{canExport && <ExportButton />}
			{canApi && <APIAccess />}
		</>
	)
}

export default function AppPage() {
	return (
		<div>
			<BasicFeature />
			<Suspense>
				<GatedFeatures />
			</Suspense>
		</div>
	)
}
```

## Redirect Pattern After Checkout

After checkout completes in Clerk's drawer, Clerk refreshes the session with updated plan data. Pass `newSubscriptionRedirectUrl` to `<PricingTable />` to navigate after the user confirms. For custom post-checkout logic:

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

```tsx
// app/billing/success/loading.tsx
export default function Loading() {
	return <p>Loading...</p>
}
```

## Account Billing Page

Use `<UserProfile />` for the user account billing UI. It renders the current plan, subscription status, payment methods, invoices, and the upgrade / cancellation flow with no custom code:

```tsx
// app/account/[[...account]]/page.tsx
import { UserProfile } from '@clerk/nextjs'
import { Suspense } from 'react'

export default function AccountPage() {
	return (
		<Suspense>
			<UserProfile />
		</Suspense>
	)
}
```

User Plans configured in Dashboard → Billing → Plans automatically appear inside `<UserProfile />` (in the **Plans** section). Cancellation and plan switching are handled in the same drawer. Only build a custom billing page when you need branded layouts or to embed `<PricingTable />` outside the UserProfile shell.

For richer subscription details in client components (status, renewal date, trial end), use the `useSubscription()` hook instead of reading JWT claims:

```tsx
'use client'
import { useSubscription } from '@clerk/nextjs/experimental'

export function BillingSummary() {
	const { data, isLoading } = useSubscription()
	if (isLoading || !data) return null
	return (
		<p>
			Status: {data.status}
			{data.nextPayment && ` (renews ${data.nextPayment.date.toLocaleDateString()})`}
		</p>
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

