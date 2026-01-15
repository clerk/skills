---
name: managing-orgs
description: Build B2B multi-tenant apps with Clerk Organizations. Use when implementing team workspaces, role-based access control, organization switching, member invitations, or multi-tenant SaaS.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Managing Organizations (B2B Multi-Tenant)

Build multi-tenant B2B applications with Clerk Organizations. Covers team workspaces, RBAC, invitations, and organization-scoped data.

## Enable Organizations

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Organizations → Settings
2. Enable Organizations
3. Configure settings:
   - **Require organization** - Users must belong to an org
   - **Allow personal accounts** - Users can exist without org
   - **Max organizations per user** - Limit org memberships

## Quick Start

### 1. Add Organization Switcher

```tsx
import { OrganizationSwitcher } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <OrganizationSwitcher
        afterCreateOrganizationUrl="/org/:slug"
        afterSelectOrganizationUrl="/org/:slug"
      />
    </header>
  );
}
```

### 2. Protect Routes by Organization

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isOrgRoute = createRouteMatcher(['/org(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isOrgRoute(req)) {
    const { orgId } = await auth();
    if (!orgId) {
      return Response.redirect(new URL('/select-org', req.url));
    }
  }
});
```

### 3. Access Organization in Components

```tsx
// Server Component
import { auth } from '@clerk/nextjs/server';

export default async function OrgDashboard() {
  const { orgId, orgSlug, orgRole } = await auth();

  return (
    <div>
      <h1>Organization: {orgSlug}</h1>
      <p>Your role: {orgRole}</p>
    </div>
  );
}
```

```tsx
// Client Component
'use client';
import { useOrganization } from '@clerk/nextjs';

export function OrgInfo() {
  const { organization, membership } = useOrganization();

  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>Role: {membership?.role}</p>
    </div>
  );
}
```

---

## Role-Based Access Control (RBAC)

### Default Roles

| Role | Key | Permissions |
|------|-----|-------------|
| Admin | `org:admin` | Full access |
| Member | `org:member` | Limited access |

### Check Permissions

```tsx
// Server Component
import { auth } from '@clerk/nextjs/server';

export default async function SettingsPage() {
  const { has } = await auth();

  const canManageSettings = await has({ role: 'org:admin' });
  // Or with custom permission:
  // const canManageSettings = await has({ permission: 'org:settings:manage' });

  if (!canManageSettings) {
    return <div>Access denied</div>;
  }

  return <SettingsForm />;
}
```

```tsx
// Client Component
'use client';
import { useAuth } from '@clerk/nextjs';

export function AdminPanel() {
  const { has } = useAuth();

  if (!has?.({ role: 'org:admin' })) {
    return null;
  }

  return <div>Admin controls...</div>;
}
```

### Protect API Routes

```typescript
// app/api/org/settings/route.ts
import { auth } from '@clerk/nextjs/server';

export async function PATCH(req: Request) {
  const { userId, orgId, has } = await auth();

  if (!userId || !orgId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canManage = await has({ role: 'org:admin' });
  if (!canManage) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update settings...
}
```

---

## Member Management

### List Members

```tsx
'use client';
import { useOrganization } from '@clerk/nextjs';

export function MemberList() {
  const { memberships } = useOrganization({
    memberships: {
      infinite: true,
    },
  });

  return (
    <ul>
      {memberships?.data?.map((m) => (
        <li key={m.id}>
          {m.publicUserData.firstName} - {m.role}
        </li>
      ))}
    </ul>
  );
}
```

### Invite Members

```tsx
'use client';
import { useOrganization } from '@clerk/nextjs';
import { useState } from 'react';

export function InviteForm() {
  const { organization } = useOrganization();
  const [email, setEmail] = useState('');

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    await organization?.inviteMember({
      emailAddress: email,
      role: 'org:member',
    });
    setEmail('');
  }

  return (
    <form onSubmit={handleInvite}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
      />
      <button type="submit">Invite</button>
    </form>
  );
}
```

### Update Member Role

```tsx
async function updateRole(membershipId: string, newRole: string) {
  await organization?.updateMember({
    userId: membershipId,
    role: newRole,
  });
}
```

### Remove Member

```tsx
async function removeMember(membershipId: string) {
  await organization?.removeMember(membershipId);
}
```

---

## Organization Switching

### Organization List

```tsx
'use client';
import { useOrganizationList } from '@clerk/nextjs';

export function OrgList() {
  const { userMemberships, setActive } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  return (
    <ul>
      {userMemberships.data?.map((mem) => (
        <li key={mem.organization.id}>
          <button onClick={() => setActive({ organization: mem.organization.id })}>
            {mem.organization.name}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Select Organization Page

```tsx
// app/select-org/page.tsx
import { OrganizationList } from '@clerk/nextjs';

export default function SelectOrgPage() {
  return (
    <div>
      <h1>Select an organization</h1>
      <OrganizationList
        afterSelectOrganizationUrl="/org/:slug"
        afterCreateOrganizationUrl="/org/:slug"
      />
    </div>
  );
}
```

---

## Organization-Scoped Data

### Database Schema (Prisma)

```prisma
model Project {
  id             String @id @default(cuid())
  name           String
  organizationId String // Clerk org ID

  @@index([organizationId])
}
```

### Query by Organization

```tsx
// Server Component
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function ProjectList() {
  const { orgId } = await auth();

  if (!orgId) return <div>Select an organization</div>;

  const projects = await prisma.project.findMany({
    where: { organizationId: orgId },
  });

  return (
    <ul>
      {projects.map((p) => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}
```

### Server Action with Org Context

```typescript
'use server';
import { auth } from '@clerk/nextjs/server';

export async function createProject(formData: FormData) {
  const { orgId, has } = await auth();

  if (!orgId) throw new Error('No organization selected');

  const canCreate = await has({ permission: 'org:project:create' });
  if (!canCreate) throw new Error('Permission denied');

  const name = formData.get('name') as string;

  await prisma.project.create({
    data: {
      name,
      organizationId: orgId,
    },
  });
}
```

---

## Custom Permissions

### Define in Dashboard

1. Go to Organizations → Roles
2. Create custom roles with permissions:

```
org:settings:read
org:settings:manage
org:project:create
org:project:delete
org:billing:manage
```

### Check Custom Permissions

```tsx
const { has } = await auth();

const canManageBilling = await has({ permission: 'org:billing:manage' });
const canDeleteProjects = await has({ permission: 'org:project:delete' });
```

---

## Organization Webhooks

Handle org lifecycle events:

```typescript
// app/api/webhooks/clerk/route.ts
async function handleWebhookEvent(evt: WebhookEvent) {
  switch (evt.type) {
    case 'organization.created':
      await createOrgInDB(evt.data);
      break;
    case 'organization.deleted':
      await deleteOrgFromDB(evt.data.id);
      break;
    case 'organizationMembership.created':
      await addMemberToOrg(evt.data);
      break;
    case 'organizationMembership.deleted':
      await removeMemberFromOrg(evt.data);
      break;
  }
}
```

## Documentation

- [Organizations Overview](https://clerk.com/docs/organizations/overview)
- [Custom Roles & Permissions](https://clerk.com/docs/organizations/roles-permissions)
- [OrganizationSwitcher](https://clerk.com/docs/components/organization/organization-switcher)
- [useOrganization Hook](https://clerk.com/docs/references/react/use-organization)
