---
name: managing-orgs
description: B2B multi-tenant apps with Clerk Organizations. Use for team workspaces, RBAC, member management.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.1.0"
---

# Organizations (B2B)

> **Prerequisite**: Complete `setup/` first. Enable Organizations in Dashboard.

## Decision Tree

| Task | Documentation |
|------|---------------|
| Setup | https://clerk.com/docs/guides/organizations/overview |
| Custom roles | https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions |
| Invitations | https://clerk.com/docs/guides/organizations/add-members/invitations |
| Org switcher | https://clerk.com/docs/reference/components/organization/organization-switcher |
| Verify membership | https://clerk.com/docs/guides/organizations/control-access/check-access |

## Key Hooks

```typescript
import { useAuth, useOrganization, useOrganizationList } from '@clerk/nextjs';

// useAuth: isSignedIn, has(), isLoaded
// useOrganization: organization, membership, isLoaded
```

## Built-in Components

Use `<Protect>` for declarative RBAC:

```tsx
import { Protect } from '@clerk/nextjs';

<Protect role="org:admin" fallback={<Unauthorized />}>
  <AdminPanel />
</Protect>
```

## Default Roles

`org:admin` (full access) | `org:member` (limited)

## Best Practices

- Enable Organizations in Dashboard first
- Create `/sign-in` and `/sign-up` pages before `redirectToSignIn()`
- Use `has()` for permission checks, not string comparison
- Always guard with `if (!isLoaded) return null`

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `role === 'Admin'` | Wrong format | `has({ role: 'org:admin' })` |
| Access `organization` before `isLoaded` | Undefined | `if (!isLoaded) return null` |
| Skip Dashboard setup | Orgs won't work | Enable in Dashboard first |

## See Also

- [Organizations Overview](https://clerk.com/docs/guides/organizations/overview)
- [Roles & Permissions](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)
