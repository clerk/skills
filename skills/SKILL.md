---
name: clerk
description: Clerk authentication skill. Setup, custom flows, webhooks, testing, B2B organizations. Use when working with Clerk.
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# Clerk

Reference https://clerk.com/docs for API and code samples.

## Decision Tree

```
Task?
├─ Add auth → setup/
├─ Custom sign-in/up → custom-flows/
├─ Sync users to DB → syncing-users/
├─ E2E testing → testing/
├─ Multi-tenant/B2B → managing-orgs/
└─ Next.js patterns → nextjs-patterns/
```

## By Framework

```
Framework?
├─ Next.js → nextjs-patterns/
└─ Other → setup/ (has framework detection)
```

## By Test Framework

```
Test framework?
├─ Playwright → testing/ → WebFetch playwright docs
└─ Cypress → testing/ → WebFetch cypress docs
```

## B2B / Organizations

```
Use case?
├─ Team workspaces → managing-orgs/
├─ Role-based access → managing-orgs/
└─ Member invitations → managing-orgs/
```

## Resources

- [Clerk Docs](https://clerk.com/docs)
- [Clerk Dashboard](https://dashboard.clerk.com)
