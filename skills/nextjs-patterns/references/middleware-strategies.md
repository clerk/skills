# Middleware Strategies

| Impact | Tags |
|--------|------|
| HIGH | middleware, routing, protection |

## Public-First Strategy

**Impact: HIGH** - Determines app-wide auth behavior

Protect specific routes, allow everything else. Best for marketing sites, blogs, public APIs.

**Incorrect (no route protection):**

```typescript
// middleware.ts - WRONG: No protection at all
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(); // Does nothing
```

**Correct (explicit protection):**

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/private(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

---

## Protected-First Strategy

**Impact: HIGH** - Internal apps where everything is private by default

Block everything, allow specific public routes. Best for internal tools, admin dashboards.

**Incorrect (missing public routes):**

```typescript
// WRONG: Sign-in page is blocked too
export default clerkMiddleware(async (auth, req) => {
  await auth.protect(); // Blocks /sign-in!
});
```

**Correct (explicit public routes):**

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

---

## When to Use Each

| Strategy | Use Case |
|----------|----------|
| Public-first | Marketing sites, blogs, public APIs |
| Protected-first | Internal tools, admin dashboards |

Reference: [Clerk Middleware Docs](https://clerk.com/docs/references/nextjs/clerk-middleware)
