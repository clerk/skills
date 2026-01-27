---
name: managing-orgs
description: B2B multi-tenant apps with Clerk Organizations, RBAC, team workspaces.
license: MIT
metadata:
  author: clerk
  version: "1.1.0"
---

# Managing Organizations (B2B)

**Prerequisite**: Basic auth setup (`setup/`) - ClerkProvider, sign-in/up pages, middleware.

## Enable Organizations

Dashboard → Organizations → Settings → Enable → Configure roles.

## Templates

| Template | Use Case |
|----------|----------|
| `templates/org-switcher.tsx` | Org switching UI |
| `templates/member-list.tsx` | Manage members |
| `templates/invite-form.tsx` | Invite members |
| `templates/rbac-check.tsx` | Role-based checks |
| `templates/middleware-org.ts` | Require org |
| `templates/sign-in-page.tsx` | Sign-in page |
| `templates/sign-up-page.tsx` | Sign-up page |

## Key Hooks

```tsx
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
const { organization, membership } = useOrganization();
const { setActive, userMemberships } = useOrganizationList();
```

## Default Roles

`org:admin` (full access) | `org:member` (limited)

## Common Pitfalls

- **Create sign-in/sign-up pages** - `redirectToSignIn()` expects `/sign-in` to exist
- **Enable Organizations in Dashboard first**
- **Check `isLoaded` and `organization`** before accessing org data
- **Use role keys** - `org:admin` not `Admin`
- **Use `has()` for RBAC** - not string comparison
- **Check auth before org context** in middleware

## See Also

`syncing-users/` | `nextjs-patterns/`

## Docs

[Organizations](https://clerk.com/docs/organizations/overview) | [Custom Roles](https://clerk.com/docs/organizations/roles-permissions)
