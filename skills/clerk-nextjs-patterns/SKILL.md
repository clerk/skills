---
name: clerk-nextjs-patterns
description: Advanced Next.js patterns - middleware, Server Actions, caching with
  Clerk.
license: MIT
allowed-tools: WebFetch
compatibility: Requires NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. For manual JWT verification (standalone API servers without Clerk middleware), additionally requires CLERK_JWT_KEY or CLERK_PEM_PUBLIC_KEY.
metadata:
  author: clerk
  version: 2.2.0
---

# Next.js Patterns

> **Version**: Check `package.json` for the SDK version — see `clerk` skill for the version table. Core 2 differences are noted inline with `> **Core 2 ONLY (skip if current SDK):**` callouts.

For basic setup, see `clerk-setup` skill.

> **Route protection:** call `await auth.protect()` in each page, Route Handler, and Server Function. Keep `clerkMiddleware()` bare. `createRouteMatcher` is deprecated in `@clerk/nextjs` 7 and will be removed in the next major version. Don't add it. If a project already uses it, leave it working and point the user to the [migration guide](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher).

## What Do You Need?

| Task | Reference |
|------|-----------|
| Server vs client auth (`auth()` vs hooks) | references/server-vs-client.md |
| Protect routes (check in each page, handler, and Server Function) | references/middleware-strategies.md |
| Protect Server Actions | references/server-actions.md |
| API route auth (401 vs 403) | references/api-routes.md |
| Cache auth data (user-scoped caching) | references/caching-auth.md |
| Fix `next build` errors under Cache Components | [Cache Components](#cache-components) |

## References

| Reference | Description |
|-----------|-------------|
| `references/server-vs-client.md` | `await auth()` vs hooks |
| `references/middleware-strategies.md` | `auth.protect()` in each resource, bare `clerkMiddleware()` in `proxy.ts` (Next.js <=15: `middleware.ts`) |
| `references/server-actions.md` | Protect mutations |
| `references/api-routes.md` | 401 vs 403 |
| `references/caching-auth.md` | User-scoped caching with `'use cache'` |

## Mental Model

Server vs Client = different auth APIs:
- **Server**: `await auth()` from `@clerk/nextjs/server` (async!)
- **Client**: `useAuth()` hook from `@clerk/nextjs` (sync)

Never mix them. Server Components use server imports, Client Components use hooks.

Key properties from `auth()`:
- `isAuthenticated` — boolean, replaces the `!!userId` pattern
- `sessionStatus` — `'active'` | `'pending'`, for detecting incomplete session tasks
- `userId`, `orgId`, `orgSlug`, `has()`, `protect()` — unchanged

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` and `sessionStatus` are not available. Check `!!userId` instead.

## Minimal Pattern

```tsx
// Server Component
import { auth } from '@clerk/nextjs/server'
import { Suspense } from 'react'

async function Greeting() {
  const { isAuthenticated, userId } = await auth()  // MUST await!
  if (!isAuthenticated) return <p>Not signed in</p>
  return <p>Hello {userId}</p>
}

export default function Page() {
  return (
    <Suspense>
      <Greeting />
    </Suspense>
  )
}
```

`auth()` reads the request, so it runs in an async child inside `<Suspense>`, not in the page itself. See [Cache Components](#cache-components).

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` is not available. Use `if (!userId)` instead.

### Conditional Rendering with `<Show>`

`<Show>` renders its children based on auth state. It covers both authentication checks and authorization (feature, plan, role, permission) in one component. In a Server Component, it reads the session from the request on the server, so wrap it in `<Suspense>`. In a Client Component, it reads client-side auth state and needs no boundary.

**Authentication check:**

```tsx
import { Show } from '@clerk/nextjs'
import { Suspense } from 'react'

<Suspense>
  <Show when="signed-in" fallback={<p>Please sign in</p>}>
    <Dashboard />
  </Show>
</Suspense>
```

**Authorization checks (B2B)** (wrap in `<Suspense>` the same way when rendered in a Server Component):

```tsx
// Feature-based (preferred — features can move between plans without redeploy)
<Show when={{ feature: 'analytics' }} fallback={<UpgradePrompt />}>
  <AnalyticsDashboard />
</Show>

// Permission-based (preferred over role-based for granular access)
<Show when={{ permission: 'org:invoices:create' }}>
  <NewInvoiceButton />
</Show>

// Plan-based (tier-level gating)
<Show when={{ plan: 'pro' }}>
  <ProFeatures />
</Show>

// Role-based (use sparingly — prefer permission)
<Show when={{ role: 'org:admin' }}>
  <AdminPanel />
</Show>
```

**Callback for complex logic:**

```tsx
<Show when={(has) => has({ role: 'org:admin' }) || has({ role: 'org:billing_manager' })}>
  <BillingActions />
</Show>
```

> **Core 2 ONLY (skip if current SDK):** `<Show>` does not exist. For authentication, use `<SignedIn>` and `<SignedOut>`. For authorization (role / permission), use `<Protect>` with the same prop names (`role`, `permission`, `condition`). Feature- and plan-based variants require Core 3. See `clerk-custom-ui` skill, `core-3/show-component.md` for the full migration table.

## Cache Components

New Next.js apps set `cacheComponents: true` in `next.config` (the `create-next-app` default since Next.js 16.4). With it, `next build` fails on request data read outside a `<Suspense>` boundary: `Next.js encountered uncached or runtime data during prerendering`. See [Cache Components](https://clerk.com/docs/guides/development/rendering-modes#cache-components) in Clerk's rendering modes guide.

- Wrap `<Show>` rendered in a Server Component, and any Server Component that calls `auth()` or `currentUser()`, in `<Suspense>`, as close to the auth-dependent UI as possible. Keep `<ClerkProvider>` and static layout outside the boundary so Next.js can prerender them.
- In a layout header, put one `<Suspense>` inside `<header>` around both the `signed-out` and `signed-in` `<Show>` blocks.
- A page that calls `auth()` or `currentUser()` to render data: move the read into an async child inside `<Suspense>` and keep the default-export page synchronous.
- A page that gates its whole render with `auth.protect()`, `redirectToSignIn()`, or `redirect()`: leave the page as is and add a `loading.tsx` next to it. See [Read auth data inside Suspense](https://clerk.com/docs/guides/development/rendering-modes#read-auth-data-inside-suspense).
- Wrap catch-all `<SignIn />`, `<SignUp />`, `<UserProfile />`, and `<OrganizationProfile />` pages in `<Suspense>`. They read the URL with `usePathname()`, even in a Client Component. See [Prebuilt components on catch-all routes](https://clerk.com/docs/guides/development/rendering-modes#prebuilt-components-on-catch-all-routes).
- Never call `auth()` inside `'use cache'`. Read the ID outside and pass it in. See `references/caching-auth.md` and [Cache data per user with `'use cache'`](https://clerk.com/docs/guides/development/rendering-modes#cache-data-per-user-with-use-cache).

Use `next build --debug-prerender` to list every failing route. A plain `next build` stops at the first.

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `undefined` userId in Server Component | Missing `await` | `await auth()` not `auth()` |
| Auth not working on API routes | Missing matcher | Add `'/(api|trpc)(.*)'` to `proxy.ts` (Next.js <=15: `middleware.ts`) |
| `next build` fails with "uncached or runtime data during prerendering" | `auth()`, `currentUser()`, or server `<Show>` outside `<Suspense>` | Wrap the auth-dependent UI in `<Suspense>` (see [Cache Components](#cache-components)) |
| Cache returns wrong user's data | `userId` not part of the cache key | Pass `userId` into the `'use cache'` function as an argument |
| Mutations bypass auth | Unprotected Server Action | Check `auth()` at start of action |
| Protected page returns 200, not 307, while signed out | The redirect happened after streaming started (e.g. under a `loading.tsx`) | Confirm the body redirects to sign-in and has no protected data. Keep the check in the page |
| Wrong HTTP error code | Confused 401/403 | 401 = not signed in, 403 = no permission |

## Session Tokens & Custom JWTs

### getToken() for external APIs

Pass a custom JWT to third-party services (Hasura, Supabase, etc.) using JWT templates defined in the Clerk dashboard.

**Server-side (Server Component or Route Handler)**:

```tsx
import { auth } from '@clerk/nextjs/server'

export async function ExternalData() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'hasura' })
  if (!token) return <p>Not authenticated</p>

  const res = await fetch('https://api.example.com/graphql', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  return <pre>{JSON.stringify(data)}</pre>
}
```

Render `<ExternalData />` inside `<Suspense>`.

**Client-side (Client Component)**:

```typescript
'use client'
import { useAuth } from '@clerk/nextjs'

export function DataFetcher() {
  const { getToken } = useAuth()

  async function fetchData() {
    const token = await getToken({ template: 'supabase' })
    if (!token) return

    const res = await fetch('https://api.example.com/data', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.json()
  }

  return <button onClick={fetchData}>Fetch</button>
}
```

`getToken()` returns `null` when the user is not authenticated — always null-check before use.

### useSession() for session data

Access session metadata in client components:

```typescript
'use client'
import { useSession } from '@clerk/nextjs'

export function SessionInfo() {
  const { session } = useSession()
  if (!session) return null

  return (
    <p>
      Session {session.id} — last active: {session.lastActiveAt.toISOString()}
    </p>
  )
}
```

### Manual JWT verification (no Clerk middleware)

For standalone API servers that receive Clerk session tokens from the `Authorization` header or the `__session` cookie (same-origin).

**Using `@clerk/backend` `verifyToken`** (recommended):

```typescript
import { verifyToken } from '@clerk/backend'

const token = req.headers.authorization?.replace('Bearer ', '')
if (!token) return res.status(401).json({ error: 'No token' })

try {
  const claims = await verifyToken(token, {
    jwtKey: process.env.CLERK_JWT_KEY,
  })
  // claims.sub = userId
} catch {
  return res.status(401).json({ error: 'Invalid token' })
}
```

**Using `jsonwebtoken`** (when you can't use `@clerk/backend`):

```typescript
import jwt from 'jsonwebtoken'

const publicKey = process.env.CLERK_PEM_PUBLIC_KEY!.replace(/\\n/g, '\n')
const token = req.headers.authorization?.replace('Bearer ', '')
if (!token) return res.status(401).json({ error: 'No token' })

try {
  const claims = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload
  // Manually check exp and nbf (jsonwebtoken does this automatically, but verify azp if needed)
  // claims.sub = userId
} catch {
  return res.status(401).json({ error: 'Invalid or expired token' })
}
```

Token sources:
- **Same-origin requests**: `__session` cookie (Clerk sets this automatically)
- **Cross-origin / mobile / API-to-API**: `Authorization: Bearer <token>` header

> **CRITICAL**: Always check `exp` and `nbf` claims. `verifyToken` from `@clerk/backend` handles this automatically; with raw `jsonwebtoken`, set `ignoreExpiration: false` (default) and ensure `clockTolerance` is minimal.

## See Also

- `clerk-setup` - Initial Clerk install
- `clerk-orgs` - B2B patterns (active org, role/permission gating)
- `clerk-billing` - Plan and feature entitlements with `has()`
- `clerk-webhooks` - Sync user/org events to your database
- `clerk-custom-ui` - Theming and customization for built-in components

## Docs

[Next.js SDK](https://clerk.com/docs/reference/nextjs/overview)
