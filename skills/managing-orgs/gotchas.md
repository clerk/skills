# Managing Orgs - Gotchas

Common pitfalls when building multi-tenant B2B applications.

## Enable Organizations

### Organizations Not Enabled
```typescript
// Error: "Organization not found" or "Organizations not enabled"

// Fix: Enable in Dashboard
// Dashboard > Organizations > Settings > Enable Organizations
```

### Missing Organization in Context
```typescript
// WRONG - assuming org context exists
const { organization } = useOrganization();
const members = organization.members; // Error if no org selected!

// CORRECT - check for organization
const { organization, isLoaded } = useOrganization();
if (!isLoaded) return <Loading />;
if (!organization) return <SelectOrgPrompt />;
```

## Role-Based Access

### Wrong Role Key Format
```typescript
// WRONG - using display name
if (membership.role === 'Admin') { ... }

// CORRECT - use role key
if (membership.role === 'org:admin') { ... }
```

### Custom Roles Not Synced
```typescript
// After creating custom roles in Dashboard, they need time to propagate
// Or force refresh:
await organization.reload();
```

### Permission Check Patterns
```typescript
// WRONG - checking role name for permissions
if (role === 'org:admin') {
  // Can delete
}

// CORRECT - use has() with permission
const { has } = await auth();
if (has({ permission: 'org:settings:delete' })) {
  // Can delete
}
```

## Organization Switching

### Active Org Not Set
```typescript
// WRONG - assuming activeOrganization is always set
const { activeOrganization } = useOrganization();
fetchData(activeOrganization.id); // Could be null!

// CORRECT - handle personal account case
const { activeOrganization } = useOrganization();
const orgId = activeOrganization?.id ?? null;
// null means personal account, handle accordingly
```

### Org Switch Not Reflected in Backend
```typescript
// Frontend org switch doesn't automatically update server requests
// Pass org ID explicitly in API calls

// Client
fetch('/api/data', {
  headers: { 'X-Organization-Id': activeOrganization?.id ?? '' }
});

// Server
const orgId = req.headers.get('X-Organization-Id');
```

## Invitations

### Invitation Email Not Sending
```typescript
// Check:
// 1. Email service configured in Dashboard
// 2. Invitation emails enabled
// 3. User's email is valid

// Use Backend API for programmatic invitations:
import { clerkClient } from '@clerk/nextjs/server';

await clerkClient().organizations.createOrganizationInvitation({
  organizationId: orgId,
  emailAddress: 'user@example.com',
  role: 'org:member',
  // redirectUrl: optional URL for invitation link
});
```

### Expired Invitations
```typescript
// Invitations expire after 30 days by default
// Check invitation status before allowing claim
const invitation = await clerkClient.organizations.getInvitation(id);
if (invitation.status !== 'pending') {
  throw new Error('Invitation expired or already used');
}
```

## Middleware for Organizations

### Not Protecting Org Routes
```typescript
// WRONG - only checking auth, not org
export default clerkMiddleware((auth) => {
  auth().protect();
});

// CORRECT - require organization for org routes
export default clerkMiddleware((auth, req) => {
  if (req.nextUrl.pathname.startsWith('/org/')) {
    const { orgId } = auth();
    if (!orgId) {
      return NextResponse.redirect(new URL('/select-org', req.url));
    }
  }
  auth().protect();
});
```

### Org Slug in URL
```typescript
// Pattern: /org/[orgSlug]/dashboard
// Access org by slug:
const { organization } = await clerkClient.organizations.getOrganization({
  slug: params.orgSlug,
});
```

## Database Sync

### Not Syncing Organization Changes
```typescript
// Remember to handle org webhooks too!
switch (evt.type) {
  case 'organization.created':
  case 'organization.updated':
  case 'organization.deleted':
  case 'organizationMembership.created':
  case 'organizationMembership.updated':
  case 'organizationMembership.deleted':
    // Sync to your database
}
```

### Membership Role Changes
```typescript
// When role changes, old permissions should be revoked immediately
// Use webhook: organizationMembership.updated
case 'organizationMembership.updated':
  const { role, public_user_data } = evt.data;
  await db.membership.update({
    where: { clerkMembershipId: evt.data.id },
    data: { role },
  });
```

## Personal vs Org Context

### Confusing Personal and Org Data
```typescript
// Users can have both personal data AND org data
// Clearly separate in your schema

// Personal
type User = {
  id: string;
  personalSettings: Settings;
};

// Org-scoped
type OrgMember = {
  userId: string;
  orgId: string;
  orgSettings: Settings;
};
```

### Queries Without Org Context
```typescript
// WRONG - fetching all user's data regardless of org
const data = await db.items.findMany({
  where: { createdById: userId },
});

// CORRECT - scope to current org
const data = await db.items.findMany({
  where: {
    createdById: userId,
    organizationId: orgId, // Always filter by org!
  },
});
```

## See Also

- `syncing-users/gotchas.md` - Webhook sync issues
