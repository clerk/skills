---
name: managing-orgs
description: B2B multi-tenant apps with Clerk Organizations. Use for org-based routing, URL sync with org slug, RBAC, team workspaces, member management. Triggers on "organization", "B2B", "multi-tenant", "team workspace", "org slug", "URL sync".
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.2.0"
---

# Organizations (B2B)

**Workflow**: WebFetch the relevant doc URL below, then implement following the code examples from the docs.

> **Prerequisite**: Enable Organizations in Clerk Dashboard first.

## Decision Tree

| Task | Documentation |
|------|---------------|
| Overview | https://clerk.com/docs/guides/organizations/overview |
| Org slugs in URLs | https://clerk.com/docs/guides/organizations/org-slugs-in-urls |
| Roles & permissions | https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions |
| Check access | https://clerk.com/docs/guides/organizations/control-access/check-access |
| Invitations | https://clerk.com/docs/guides/organizations/add-members/invitations |
| OrganizationSwitcher | https://clerk.com/docs/reference/components/organization/organization-switcher |

## Critical Patterns

### Get orgSlug from auth()

```typescript
import { auth } from '@clerk/nextjs/server'

const { orgId, orgSlug } = await auth()
```

### Dynamic route with org slug

```
app/orgs/[slug]/page.tsx
```

### Role check with has()

```typescript
const { has } = await auth()
if (!has({ role: 'org:admin' })) { /* forbidden */ }
```

## Default Roles

`org:admin` (full access) | `org:member` (limited)

## Symptom-Based Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| `orgSlug` undefined | Not from auth() | `const { orgSlug } = await auth()` |
| Role check fails | String comparison | Use `has({ role: 'org:admin' })` |
| Org not found | Dashboard not enabled | Enable Organizations in Dashboard |

## See Also

- [Organizations Overview](https://clerk.com/docs/guides/organizations/overview)
- [Org Slugs in URLs](https://clerk.com/docs/guides/organizations/org-slugs-in-urls)
