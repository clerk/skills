---
name: nextjs-patterns
description: Advanced Next.js patterns with Clerk authentication. Use when working on middleware strategies, Server Actions auth, App Router patterns, caching with auth, or optimizing Clerk in Next.js.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Advanced Next.js Patterns with Clerk

Deep patterns for production Next.js applications with Clerk.

> For basic setup, see `adding-auth` skill. This covers advanced patterns.

## References

| Reference | Topic |
|-----------|-------|
| `references/middleware-strategies.md` | Public-first vs protected-first |
| `references/server-vs-client.md` | auth() vs useAuth() |
| `references/server-actions.md` | Auth in Server Actions |
| `references/caching-auth.md` | unstable_cache with auth |
| `references/api-routes.md` | Protected API routes |

## Quick Reference

### Server Components
```tsx
import { auth, currentUser } from '@clerk/nextjs/server';
const { userId } = await auth();
```

### Client Components
```tsx
import { useAuth, useUser } from '@clerk/nextjs';
const { userId } = useAuth();
```

## Documentation

- [Next.js SDK Reference](https://clerk.com/docs/references/nextjs/overview)
