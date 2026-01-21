---
name: nextjs-patterns
description: Advanced Next.js patterns with Clerk authentication. Use when working on middleware strategies, Server Actions auth, App Router patterns, caching with auth, or optimizing Clerk in Next.js.
license: MIT
metadata:
  author: clerk
  version: '1.1.0'
---

# Advanced Next.js Patterns with Clerk

Deep patterns for production Next.js applications with Clerk.

> For basic setup, see [`adding-auth`](https://github.com/clerk/skills/tree/main/skills/adding-auth) skill. This covers advanced patterns.

## Impact Levels

| Impact   | Rules                                                 | When                          |
| -------- | ----------------------------------------------------- | ----------------------------- |
| CRITICAL | `await auth()`, user-scoped cache keys                | Breaking bugs, security holes |
| HIGH     | Middleware setup, Server Actions auth, API protection | Common mistakes               |
| MEDIUM   | Caching patterns, org context, permission checks      | Optimization                  |
| LOW      | Reusable helpers, DRY patterns                        | Nice-to-have                  |

## References

| Reference                             | Impact   | Topic                           |
| ------------------------------------- | -------- | ------------------------------- |
| `references/server-vs-client.md`      | CRITICAL | `await auth()` vs hooks         |
| `references/middleware-strategies.md` | HIGH     | Public-first vs protected-first |
| `references/server-actions.md`        | HIGH     | Protect mutations               |
| `references/api-routes.md`            | HIGH     | 401 vs 403, route protection    |
| `references/caching-auth.md`          | MEDIUM   | User-scoped caching             |

## Quick Reference

### Server Components

The Next.js SDK provides server-side helpers, like [`auth()`](https://clerk.com/docs/reference/nextjs/app-router/auth) and [`currentUser()`](https://clerk.com/docs/reference/nextjs/app-router/current-user), to interact with the Clerk API on the server.

```tsx
import { auth, currentUser } from '@clerk/nextjs/server'
const { userId } = await auth() // ALWAYS await!
```

### Client Components

The Next.js SDK provides client-side hooks, like [`useAuth()`](https://clerk.com/docs/reference/hooks/use-auth) and [`useUser()`](https://clerk.com/docs/reference/hooks/use-user), to interact with the Clerk API on the client.

```tsx
'use client'

import { useAuth, useUser } from '@clerk/nextjs'
const { userId } = useAuth()
```

## Common Pitfalls

- **Must `await` the `auth()` helper in Server Components**.
- [**Include API routes in Middleware matcher**](https://clerk.com/docs/reference/nextjs/clerk-middleware#configure-clerk-middleware).
- **User-scoped cache keys**: Include `userId` in `unstable_cache` keys.
- **Protect Server Actions**: Always check `auth()` in mutations.
- **401 vs 403**: 401 = not authenticated, 403 = authenticated but forbidden (not authorized, or doesn't have the required permissions). Use the correct status code for the response.

## See Also

- `adding-auth/` - Basic auth setup (start here first)
- `managing-orgs/` - Organization patterns

## Documentation

- [Next.js SDK Reference](https://clerk.com/docs/reference/nextjs/overview)
