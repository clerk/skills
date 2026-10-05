# Middleware

## Setup

```ts
// src/middleware.ts
import { clerkMiddleware } from '@clerk/astro/server'

export const onRequest = clerkMiddleware()
```

The middleware populates `Astro.locals.auth()` (and `context.locals.auth()` in API routes) for every SSR request. It does not decide which routes need auth. Each page and API route checks for itself:

```astro
---
// src/pages/dashboard.astro
const { userId } = Astro.locals.auth()
if (!userId) return Astro.redirect('/sign-in')
---

<h1>Dashboard</h1>
```

```ts
// src/pages/api/data.ts
import type { APIRoute } from 'astro'

export const GET: APIRoute = ({ locals }) => {
  const { userId } = locals.auth()
  if (!userId) return new Response('Unauthorized', { status: 401 })

  return Response.json({ userId })
}
```

Organization and permission checks live in the page or route too. See `references/ssr-pages.md` and `references/api-routes.md`.

`createRouteMatcher` was removed in `@clerk/astro` 4.0 (deprecated in 3.x). Don't add it. Existing uses must move to page and API-route checks before upgrading. Middleware matches on URL paths, which can diverge from how Astro routes requests and leave protected resources reachable. See the [Astro `clerkMiddleware()` reference](https://clerk.com/docs/reference/astro/clerk-middleware).

## With Custom Handler

Use a handler for non-auth logic such as headers or locale redirects:

```ts
export const onRequest = clerkMiddleware((auth, context, next) => {
  // non-auth logic here
  return next()
})
```

## clerkMiddleware Signature

```ts
clerkMiddleware(handler?, options?)

// handler: (auth, context, next) => Response | Promise<Response>
// auth: () => AuthObject  (call it to get { userId, orgId, ... })
// context: Astro APIContext
// next: () => Promise<Response>
```

## CRITICAL

- Middleware is skipped for pages with `export const prerender = true`
- `auth()` is a function — call it to get the auth object: `auth().userId` not `auth.userId`
- A handler must return `next()` so the request continues
