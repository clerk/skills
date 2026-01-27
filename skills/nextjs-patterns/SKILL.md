---
name: nextjs-patterns
description: Advanced Next.js patterns - middleware, Server Actions, caching with Clerk.
license: MIT
metadata:
  author: clerk
  version: "1.1.0"
---

# Next.js Patterns

For basic setup, see `setup/`.

## Impact Levels

- **CRITICAL** - Breaking bugs, security holes
- **HIGH** - Common mistakes
- **MEDIUM** - Optimization

## References

| Reference | Impact |
|-----------|--------|
| `references/server-vs-client.md` | CRITICAL - `await auth()` vs hooks |
| `references/middleware-strategies.md` | HIGH - Public-first vs protected-first |
| `references/server-actions.md` | HIGH - Protect mutations |
| `references/api-routes.md` | HIGH - 401 vs 403 |
| `references/caching-auth.md` | MEDIUM - User-scoped caching |

## Quick Reference

```tsx
// Server Components
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth(); // ALWAYS await!

// Client Components
import { useAuth } from '@clerk/nextjs';
const { userId } = useAuth();
```

## Common Pitfalls

- **Always `await auth()`** in Server Components
- **Include API routes in matcher** - `'/(api|trpc)(.*)'`
- **User-scoped cache keys** - include `userId` in `unstable_cache`
- **Protect Server Actions** - check `auth()` in mutations
- **401 vs 403** - 401 = unauthenticated, 403 = forbidden

## See Also

- `setup/`
- `managing-orgs/`

## Docs

[Next.js SDK](https://clerk.com/docs/references/nextjs/overview)
