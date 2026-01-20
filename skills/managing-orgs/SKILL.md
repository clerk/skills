---
name: managing-orgs
description: Build B2B multi-tenant apps with Clerk Organizations. Use when implementing team workspaces, role-based access control, organization switching, member invitations, or multi-tenant SaaS.
license: MIT
metadata:
  author: clerk
  version: "1.1.0"
---

# Managing Organizations (B2B)

Build multi-tenant B2B applications with Clerk Organizations.

## Prerequisites

This skill requires basic Clerk authentication to be set up first:
- ClerkProvider in layout.tsx
- Sign-in and sign-up pages (use templates below or `adding-auth` skill)
- Middleware protecting routes

If auth is not set up, use the `adding-auth` skill first or include the sign-in/sign-up templates from this skill.

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
| `templates/sign-in-page.tsx` | Sign-in page (required for redirectToSignIn) |
| `templates/sign-up-page.tsx` | Sign-up page (required for redirectToSignUp) |

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

## Common Pitfalls

- **Create sign-in/sign-up pages** - middleware uses `redirectToSignIn()` which expects `/sign-in` route to exist
- **Enable Organizations in Dashboard** first - Dashboard > Organizations > Settings
- **Check `isLoaded` and `organization`** before accessing org data
- **Use role keys not names** - `org:admin` not `Admin`
- **Use `has()` for RBAC** - not `orgRole` string comparison
- **Check auth before org context** in middleware

## See Also

- `syncing-users/` - Sync organization data to DB
- `nextjs-patterns/` - Advanced middleware for orgs

## Documentation

- [Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Custom Roles](https://clerk.com/docs/organizations/roles-permissions)
