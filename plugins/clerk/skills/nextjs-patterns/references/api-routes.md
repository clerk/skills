# Protected API Routes

| Impact | Tags |
|--------|------|
| HIGH | api, routes, protection |

## Always Check Auth in API Routes

**Impact: HIGH** - Unprotected routes are security vulnerabilities

**Incorrect (no auth check):**

```typescript
// app/api/data/route.ts - WRONG
export async function GET() {
  const data = await db.data.findMany(); // Anyone can access!
  return Response.json(data);
}
```

**Correct (auth check first):**

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

---

## 401 vs 403 - Use Correctly

**Impact: MEDIUM** - Wrong status codes confuse clients

| Status | When |
|--------|------|
| 401 Unauthorized | User not authenticated |
| 403 Forbidden | User authenticated but lacks permission |

**Incorrect (wrong status):**

```typescript
if (!userId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 }); // WRONG
}
```

**Correct (proper status codes):**

```typescript
import { auth } from '@clerk/nextjs/server';

export async function DELETE(req: Request) {
  const { userId, has } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 }); // Not logged in
  }

  const isAdmin = await has({ role: 'org:admin' });
  if (!isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 }); // Lacks permission
  }

  return Response.json({ success: true });
}
```

---

## Organization Route Protection

**Impact: HIGH** - Verify user owns the org they're accessing

**Incorrect (no org verification):**

```typescript
// app/api/org/[orgId]/route.ts - WRONG
export async function GET(req: Request, { params }) {
  const orgData = await db.orgs.findUnique({ where: { id: params.orgId } });
  return Response.json(orgData); // Any logged-in user can access any org!
}
```

**Correct (verify org membership):**

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

  if (orgId !== params.orgId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const orgData = await db.orgs.findUnique({ where: { id: orgId } });
  return Response.json(orgData);
}
```

---

## Reusable Auth Helper

**Impact: LOW** - DRY pattern for many routes

```typescript
import { auth } from '@clerk/nextjs/server';

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

Reference: [API Routes Auth](https://clerk.com/docs/references/nextjs/auth)
