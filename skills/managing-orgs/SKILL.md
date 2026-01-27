---
name: managing-orgs
description: B2B multi-tenant apps with Clerk Organizations. Use for team workspaces, RBAC, member management.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# Organizations (B2B)

> **Prerequisite**: Complete `setup/` first. Enable Organizations in Dashboard.

## Decision Tree

| Task | Documentation |
|------|---------------|
| Setup | https://clerk.com/docs/organizations/overview |
| Custom roles | https://clerk.com/docs/organizations/roles-permissions |
| Invitations | https://clerk.com/docs/organizations/invitation-actions |
| Org switcher | https://clerk.com/docs/components/organization/organization-switcher |
| Verify membership | https://clerk.com/docs/organizations/verify-user-permissions |

## Key Hooks

```typescript
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
```

## Default Roles

`org:admin` (full access) | `org:member` (limited)

## Best Practices

- Enable Organizations in Dashboard first
- Create `/sign-in` and `/sign-up` pages before using `redirectToSignIn()`
- Use `has()` for permission checks, not string comparison
- Check auth before org context in middleware

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `role === 'Admin'` | Wrong format | `has({ role: 'org:admin' })` |
| Access `organization` before `isLoaded` | Undefined | Guard with `isLoaded` check |
| Skip Dashboard setup | Orgs won't work | Enable in Dashboard first |

## See Also

- [Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Roles & Permissions](https://clerk.com/docs/organizations/roles-permissions)
