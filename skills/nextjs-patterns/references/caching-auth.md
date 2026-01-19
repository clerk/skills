# Caching with Auth

| Impact | Tags |
|--------|------|
| MEDIUM | caching, performance, security |

## Cache Keys Must Include userId

**Impact: CRITICAL** - Wrong cache key leaks data between users

**Incorrect (shared cache key):**

```typescript
// WRONG - All users share same cache!
const cachedData = unstable_cache(
  () => getUserData(userId),
  ['user-data'], // Missing userId in key
  { revalidate: 60 }
);
```

**Correct (user-scoped cache key):**

```typescript
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

export default async function ProfilePage() {
  const { userId } = await auth();

  if (!userId) return <div>Not signed in</div>;

  const cachedGetUserData = unstable_cache(
    () => getUserData(userId),
    [`user-${userId}`], // User-specific key
    { revalidate: 60, tags: [`user-${userId}`] }
  );

  const userData = await cachedGetUserData();
  return <div>{userData.name}</div>;
}
```

---

## Revalidating Cached Auth Data

**Impact: HIGH** - Stale data after updates

**Incorrect (no revalidation):**

```typescript
export async function updateProfile(formData: FormData) {
  await db.users.update({ ... });
  // User sees stale cached data!
}
```

**Correct (revalidate by tag):**

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

  revalidateTag(`user-${userId}`); // Invalidate user's cache
}
```

---

## Organization-Scoped Caching

**Impact: MEDIUM** - B2B apps with shared org data

```typescript
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

export default async function OrgDashboard() {
  const { orgId } = await auth();

  if (!orgId) return <div>Select an organization</div>;

  const getOrgData = unstable_cache(
    () => db.orgData.findMany({ where: { organizationId: orgId } }),
    [`org-${orgId}-data`], // Org-scoped key
    { revalidate: 300, tags: [`org-${orgId}`] }
  );

  const data = await getOrgData();
  return <div>...</div>;
}
```

---

## Key Rules

| Rule | Why |
|------|-----|
| Cache key includes userId/orgId | Prevents data leaking between users |
| Use tags for revalidation | More precise than revalidatePath() |
| Set appropriate TTL | Balance freshness vs performance |

Reference: [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
