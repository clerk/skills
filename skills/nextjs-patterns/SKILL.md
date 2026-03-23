---
name: clerk-nextjs-patterns
description: Advanced Next.js patterns - middleware, Server Actions, caching with Clerk.
license: MIT
allowed-tools: WebFetch
inputs:
  - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    description: Clerk publishable key from dashboard
    required: true
  - name: CLERK_SECRET_KEY
    description: Clerk secret key for server-side operations
    required: true
references:
  - references/server-vs-client.md
  - references/middleware-strategies.md
  - references/server-actions.md
  - references/api-routes.md
  - references/caching-auth.md
metadata:
  author: clerk
  version: "2.2.0"
---

# Next.js Patterns

> **Version**: Check `package.json` for the SDK version — see `clerk` skill for the version table. Core 2 differences are noted inline with `> **Core 2 ONLY (skip if current SDK):**` callouts.

For basic setup, see `setup/`.

## What Do You Need?

| Task | Reference |
|------|-----------|
| Server vs client auth (`auth()` vs hooks) | references/server-vs-client.md |
| Configure middleware (public-first vs protected-first) | references/middleware-strategies.md |
| Protect Server Actions | references/server-actions.md |
| API route auth (401 vs 403) | references/api-routes.md |
| Cache auth data (user-scoped caching) | references/caching-auth.md |

## Impact Levels

- **CRITICAL** - Breaking bugs, security holes
- **HIGH** - Common mistakes
- **MEDIUM** - Optimization

## References

| Reference | Impact |
|-----------|--------|
| `references/server-vs-client.md` | CRITICAL - `await auth()` vs hooks |
| `references/middleware-strategies.md` | HIGH - Public-first vs protected-first, `proxy.ts` (Next.js <=15: `middleware.ts`) |
| `references/server-actions.md` | HIGH - Protect mutations |
| `references/api-routes.md` | HIGH - 401 vs 403 |
| `references/caching-auth.md` | MEDIUM - User-scoped caching |

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

```typescript
// Server Component
import { auth } from '@clerk/nextjs/server'

export default async function Page() {
  const { isAuthenticated, userId } = await auth()  // MUST await!
  if (!isAuthenticated) return <p>Not signed in</p>
  return <p>Hello {userId}</p>
}
```

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` is not available. Use `if (!userId)` instead.

### Conditional Rendering with `<Show>`

For client-side conditional rendering based on auth state:

```tsx
import { Show } from '@clerk/nextjs'

<Show when="signed-in" fallback={<p>Please sign in</p>}>
  <Dashboard />
</Show>
```

> **Core 2 ONLY (skip if current SDK):** Use `<SignedIn>` and `<SignedOut>` components instead of `<Show>`. See `custom-ui/core-3/show-component.md` for the full migration table.

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `undefined` userId in Server Component | Missing `await` | `await auth()` not `auth()` |
| Auth not working on API routes | Missing matcher | Add `'/(api|trpc)(.*)'` to `proxy.ts` (Next.js <=15: `middleware.ts`) |
| Cache returns wrong user's data | Missing userId in key | Include `userId` in `unstable_cache` key |
| Mutations bypass auth | Unprotected Server Action | Check `auth()` at start of action |
| Wrong HTTP error code | Confused 401/403 | 401 = not signed in, 403 = no permission |

## See Also

- `setup/`
- `orgs/`

## Docs

[Next.js SDK](https://clerk.com/docs/reference/nextjs/overview)
