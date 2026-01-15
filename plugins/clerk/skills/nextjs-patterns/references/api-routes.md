# Protected API Routes

## Basic Protected Route

```typescript
// app/api/data/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await db.data.findMany({ where: { userId } });
  return Response.json(data);
}
```

## With Organization Check

```typescript
// app/api/org/[orgId]/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is accessing their own org
  if (orgId !== params.orgId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgData = await db.orgs.findUnique({ where: { id: orgId } });
  return Response.json(orgData);
}
```

## With Permission Check

```typescript
// app/api/admin/route.ts
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req: Request) {
  const { userId, has } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = await has({ role: 'org:admin' });
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Perform admin action...
  return Response.json({ success: true });
}
```

## Error Response Pattern

```typescript
import { auth } from '@clerk/nextjs/server';

// Reusable auth check
async function requireAuth() {
  const { userId, orgId, has } = await auth();

  if (!userId) {
    return { error: Response.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return { userId, orgId, has };
}

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if ('error' in authResult) return authResult.error;

  const { userId } = authResult;
  // Continue with authenticated request...
}
```

## 401 vs 403

| Status | When |
|--------|------|
| 401 Unauthorized | User not authenticated |
| 403 Forbidden | User authenticated but lacks permission |
