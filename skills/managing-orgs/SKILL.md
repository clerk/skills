---
name: managing-orgs
description: Build B2B multi-tenant apps with Clerk Organizations. Use when implementing team workspaces, role-based access control, organization switching, member invitations, or multi-tenant SaaS.
license: MIT
metadata:
  author: clerk
  version: '1.1.0'
---

# Managing Organizations (B2B)

Build multi-tenant B2B applications with [Clerk Organizations](https://clerk.com/docs/guides/organizations/overview).

## Prerequisites

This skill requires basic Clerk authentication to be set up first:

- The Clerk integration, such as [`<ClerkProvider>`](https://clerk.com/docs/reference/components/clerk-provider)
- Sign-in and sign-up pages (use templates below or the [`adding-auth`](https://github.com/clerk/skills/tree/main/skills/adding-auth) skill)
- Middleware protecting routes (Next.js apps)

## Enable Organizations

1. Navigate to the [Organizations](https://dashboard.clerk.com/last-active?path=organizations) page in the [Clerk Dashboard](https://dashboard.clerk.com) and enable Organizations.

## Templates

| Template                      | Use Case                                     |
| ----------------------------- | -------------------------------------------- |
| `templates/org-switcher.tsx`  | Organization switching UI                    |
| `templates/member-list.tsx`   | List and manage members                      |
| `templates/invite-form.tsx`   | Invite new members                           |
| `templates/rbac-check.tsx`    | Role-based access checks                     |
| `templates/middleware-org.ts` | Require org in middleware                    |
| `templates/sign-in-page.tsx`  | Sign-in page (required for redirectToSignIn) |
| `templates/sign-up-page.tsx`  | Sign-up page (required for redirectToSignUp) |

## Key Hooks

The [`useOrganization`](https://clerk.com/docs/reference/hooks/use-organization) and [`useOrganizationList`](https://clerk.com/docs/reference/hooks/use-organization-list) hooks are used to manage Organizations and members.

```tsx
const { organization, membership } = useOrganization()
const { setActive, userMemberships } = useOrganizationList()
```

## Default Roles

| Role   | Key          | Permissions    |
| ------ | ------------ | -------------- |
| Admin  | `org:admin`  | Full access    |
| Member | `org:member` | Limited access |

## Common Pitfalls

- **Organizations feature isn't enabled in the Clerk Dashboard**.
- **Check `isLoaded` and `organization` before accessing Org data**: Before accessing the Organization data, check if the Organization is loaded and if the Organization is present (set as the Active Organization).
- **Use Role keys, not names**: In your code, use `org:admin`, not `Admin`.
- **Use `has()` for RBAC**: In your code, use the `has()` helper instead of doing `orgRole` string comparison.
- **Check auth before Org context**: In your middleware, check if the user is authenticated before trying to access the Organization context.

## See Also

- `syncing-users/` - Sync organization data to DB
- `nextjs-patterns/` - Advanced middleware for orgs

## Documentation

- [Organizations overview](https://clerk.com/docs/guides/organizations/overview)
- [Roles and Permissions](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions)
