# Billing Components

## PricingTable

The primary billing UI component. Renders subscription plans and initiates Stripe Checkout.

```tsx
import { PricingTable } from '@clerk/nextjs'

export default function PricingPage() {
	return <PricingTable />
}
```

**What it does:**
- Fetches plan data from Clerk Dashboard configuration
- Renders plan cards with features, pricing, and CTA buttons
- Handles Stripe Checkout redirect for new subscriptions
- Shows current plan for subscribed users with upgrade/downgrade options
- Handles cancellation flow

**Key behaviors:**
- Works as a Server Component (no `'use client'` needed)
- No Stripe publishable key needed in props — Clerk injects it
- Respects the active entity: user subscription for personal accounts, org subscription in org context

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `checkoutProps` | object | Override Stripe Checkout appearance options |

For most cases, use `<PricingTable />` with no props.

## has() — Plan and Feature Checks

`has()` is returned by `auth()` (server) and `useAuth()` (client). It checks subscription plans and feature entitlements.

### Server usage

```typescript
import { auth } from '@clerk/nextjs/server'

const { has } = await auth()

has({ plan: 'pro' })        // true if user/org is on 'pro' plan
has({ feature: 'export' })  // true if user/org has 'export' feature entitlement
```

### Client usage

```tsx
'use client'
import { useAuth } from '@clerk/nextjs'

const { has } = useAuth()
has?.({ plan: 'pro' })       // optional chaining — may be undefined before hydration
has?.({ feature: 'export' })
```

### Combining with role checks

```typescript
const { has, orgRole } = await auth()

const canManageBilling = has({ plan: 'pro' }) && orgRole === 'org:admin'
```

### What `has()` checks

`has()` checks the **active session claims**. Plans and features are embedded in the Clerk session token after a subscription is active. The check does NOT make a network request.

If a user subscribes and then `has()` returns false, the session token needs to refresh. This happens automatically on the next page load or after calling `clerk.session.reload()` on the client.

## Show Component (Billing-aware)

```tsx
import { Show } from '@clerk/nextjs'

<Show when={{ plan: 'pro' }}>
	<ProFeatures />
</Show>

<Show when={{ feature: 'analytics' }}>
	<AnalyticsDashboard />
</Show>
```

`<Show>` accepts `plan` and `feature` props in addition to `role` and `permission`. Renders children only if the condition is met.

## Import Reference

```typescript
import { PricingTable } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { useAuth } from '@clerk/nextjs'
import { Show } from '@clerk/nextjs'
```

All billing components and utilities are in `@clerk/nextjs` (v6+). No separate billing package needed.
