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

## Mental Model

Orgs are permission containers: `Users → Memberships → Roles → Permissions`

- User joins org via invitation or direct add
- Membership holds the user's role in that org
- Roles grant permissions (use `has()` to check)
- `<Protect>` component for declarative RBAC

## Minimal Pattern

```typescript
// Client-side role check (from official docs)
const { isLoaded, has } = useAuth()
if (!isLoaded) return null
if (!has({ role: 'org:admin' })) {
  return <p>Admin access required</p>
}

// Server-side role check
const { has } = await auth()
if (!has({ role: 'org:admin' })) {
  return new Response('Forbidden', { status: 403 })
}

// Custom permission check (for granular control)
// e.g., org:invoices:create, org:settings:manage
if (!has({ permission: 'org:settings:manage' })) {
  return <p>Permission denied</p>
}
```

## Workflow

1. Enable Organizations in Clerk Dashboard first
2. WebFetch the appropriate URL from decision tree above
3. Use `has({ role: 'org:admin' })` for permission checks
4. Guard hooks with `if (!isLoaded) return null`

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
