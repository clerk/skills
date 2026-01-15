---
name: managing-orgs
description: Build B2B multi-tenant apps with Clerk Organizations. Use when implementing team workspaces, role-based access control, organization switching, member invitations, or multi-tenant SaaS.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Managing Organizations (B2B)

Build multi-tenant B2B applications with Clerk Organizations.

## Enable Organizations

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Organizations → Settings
2. Enable Organizations
3. Configure roles and permissions

## Templates

| Template | Use Case |
|----------|----------|
| `templates/org-switcher.tsx` | Organization switching UI |
| `templates/member-list.tsx` | List and manage members |
| `templates/invite-form.tsx` | Invite new members |
| `templates/rbac-check.tsx` | Role-based access checks |
| `templates/middleware-org.ts` | Require org in middleware |

## Key Hooks

```tsx
import { useOrganization, useOrganizationList } from '@clerk/nextjs';

const { organization, membership } = useOrganization();
const { setActive, userMemberships } = useOrganizationList();
```

## Default Roles

| Role | Key | Permissions |
|------|-----|-------------|
| Admin | `org:admin` | Full access |
| Member | `org:member` | Limited access |

## Documentation

- [Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Custom Roles](https://clerk.com/docs/organizations/roles-permissions)
