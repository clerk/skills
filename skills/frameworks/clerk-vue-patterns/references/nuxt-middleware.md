# Nuxt Middleware

Nuxt has two middleware types. Both work with Clerk:

| Type | Location | Runs On |
|------|----------|---------|
| Route middleware | `middleware/` | Client + server (SSR) |
| Server middleware | `server/middleware/` | Server only |

## Server Middleware (Recommended for Auth)

```ts
// server/middleware/clerk.ts
import { clerkMiddleware } from '@clerk/nuxt/server'

export default clerkMiddleware((event) => {
  const auth = event.context.auth()
  // auth: { userId, sessionId, orgId, ... }
})
```

This runs on every request before route handlers. Use it to log auth state or set custom headers.

## Route Middleware (Per-Route Guard)

```ts
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  const { isSignedIn } = useAuth()
  if (!isSignedIn.value) return navigateTo('/sign-in')
})
```

Apply to a page:

```vue
<script setup>
definePageMeta({ middleware: 'auth' })
</script>
```

Or apply globally in `nuxt.config.ts`:

```ts
router: {
  middleware: ['auth']
}
```

## Org-Gated Route Middleware

```ts
// middleware/require-org.ts
export default defineNuxtRouteMiddleware(() => {
  const { isSignedIn } = useAuth()
  const { organization } = useOrganization()

  if (!isSignedIn.value) return navigateTo('/sign-in')
  if (!organization.value) return navigateTo('/select-org')
})
```

## Server API Auth

```ts
// server/api/protected.get.ts
import { getAuth } from '@clerk/nuxt/server'

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event)
  if (!userId) throw createError({ statusCode: 401 })

  return { data: await fetchData(userId) }
})
```

## CRITICAL

- `middleware/` (route middleware) uses `useAuth()` composable — runs client-side and during SSR
- `server/middleware/` uses `event.context.auth()` — runs server-only
- Route middleware runs AFTER Nuxt hydration starts; server middleware runs BEFORE HTML is generated
- `getAuth(event)` is for Nitro event handlers — do NOT use composables in `server/` directory
