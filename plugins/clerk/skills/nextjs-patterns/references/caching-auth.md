# Caching with Auth

## Using unstable_cache with Auth

```typescript
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

async function getUserData(userId: string) {
  return db.users.findUnique({ where: { id: userId } });
}

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) return <div>Not signed in</div>;

  // Cache per-user
  const cachedGetUserData = unstable_cache(
    () => getUserData(userId),
    [`user-${userId}`],
    { revalidate: 60, tags: [`user-${userId}`] }
  );

  const userData = await cachedGetUserData();

  return <div>{userData.name}</div>;
}
```

## Revalidating Cached Auth Data

```typescript
'use server';

import { revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();

  if (!userId) throw new Error('Unauthorized');

  await db.users.update({
    where: { id: userId },
    data: { name: formData.get('name') as string },
  });

  // Invalidate user's cached data
  revalidateTag(`user-${userId}`);
}
```

## Organization-Scoped Caching

```typescript
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

export default async function OrgDashboard() {
  const { orgId } = await auth();

  if (!orgId) return <div>Select an organization</div>;

  const getOrgData = unstable_cache(
    () => db.orgData.findMany({ where: { organizationId: orgId } }),
    [`org-${orgId}-data`],
    { revalidate: 300, tags: [`org-${orgId}`] }
  );

  const data = await getOrgData();
  return <div>...</div>;
}
```

## Key Points

1. **Cache key must include userId/orgId** - Prevents data leaking between users
2. **Use tags for targeted revalidation** - `revalidateTag()` is more precise than `revalidatePath()`
3. **Set appropriate TTL** - Balance freshness vs performance
