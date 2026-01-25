---
name: clerk
description: Clerk skill. Setup, custom UI, database sync, testing, B2B multi-tenant. Use when working with Clerk features.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Clerk

Always reference https://clerk.com/docs for API and code samples.

Route to the right skill using decision trees below.

## Decision Tree

```
Task?
├─ Add auth → setup/
├─ Custom sign-in/up UI → customizing-auth-ui/
├─ Sync users to DB → syncing-users/
├─ E2E testing → testing-auth/
├─ Multi-tenant/B2B → managing-orgs/
└─ Next.js patterns → nextjs-patterns/
```

## By Framework

```
Framework?
├─ Next.js → nextjs-patterns
```

## By ORM

```
ORM?
├─ Prisma → syncing-users/templates/prisma/
├─ Drizzle → syncing-users/templates/drizzle/
└─ Supabase → syncing-users/templates/supabase/
```

## By Test Framework

```
Test framework?
├─ Playwright → testing-auth/templates/playwright/
└─ Cypress → testing-auth/templates/cypress/
```

## B2B / Organizations

```
Use case?
├─ B2B SaaS → managing-orgs/ (full org setup)
├─ Team workspaces → managing-orgs/templates/org-switcher.tsx
├─ Role-based access → managing-orgs/templates/rbac-check.tsx
└─ Member invitations → managing-orgs/templates/invite-form.tsx
```

## Next.js Patterns

```
Pattern?
├─ Server vs Client → nextjs-patterns/references/server-vs-client.md
├─ Middleware → nextjs-patterns/references/middleware-strategies.md
├─ Server Actions → nextjs-patterns/references/server-actions.md
├─ API routes → nextjs-patterns/references/api-routes.md
└─ Caching → nextjs-patterns/references/caching-auth.md
```

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Clerk Dashboard](https://dashboard.clerk.com)
