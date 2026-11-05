# Caching with Auth

**CRITICAL**: Cache entries MUST be scoped by `userId`/`orgId` to prevent data leaking between users.

**Never call `auth()` or `currentUser()` inside `'use cache'`.** They read the request, and Next.js rejects request data inside a cached scope (`headers() can't be read inside "use cache"`). Read `userId` or `orgId` outside the cached function and pass it in as an argument. Arguments are part of the cache key, so each user gets their own entry. See [Cache data per user with `'use cache'`](https://clerk.com/docs/guides/development/rendering-modes#cache-data-per-user-with-use-cache).

## User-Scoped Cache

```tsx
// app/profile/page.tsx
import { auth } from '@clerk/nextjs/server';
import { cacheLife, cacheTag } from 'next/cache';
import { Suspense } from 'react';

async function getUserData(userId: string) {
  'use cache';
  cacheTag(`user-${userId}`);
  cacheLife('minutes');
  return db.users.findUnique({ where: { id: userId } });
}

async function Profile() {
  const { userId } = await auth();
  if (!userId) return <div>Not signed in</div>;

  const userData = await getUserData(userId);
  return <div>{userData?.name}</div>;
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
```

`auth()` runs in `Profile`, inside `<Suspense>`, because Cache Components requires request data to be read inside a `<Suspense>` boundary.

## Revalidate After Updates

```typescript
'use server';
import { updateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  await db.users.update({
    where: { id: userId },
    data: { name: formData.get('name') as string },
  });
  updateTag(`user-${userId}`);
}
```

## Org-Scoped Cache

```tsx
async function getOrgData(orgId: string) {
  'use cache';
  cacheTag(`org-${orgId}`);
  return db.orgData.findMany({ where: { organizationId: orgId } });
}

async function OrgData() {
  const { orgId } = await auth();
  if (!orgId) return <div>Select an organization</div>;

  const data = await getOrgData(orgId);
  return <OrgTable data={data} />;
}
```

Render `OrgData` inside `<Suspense>`, the same way as `Profile` above.

## Without Cache Components

`'use cache'` needs `cacheComponents: true` in `next.config`, the `create-next-app` default since Next.js 16.4. On apps without it, use `unstable_cache` and include the ID in the key and tags:

```tsx
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) return <div>Not signed in</div>;

  const getCachedUserData = unstable_cache(
    () => db.users.findUnique({ where: { id: userId } }),
    [`user-${userId}`],
    { revalidate: 60, tags: [`user-${userId}`] }
  );

  const userData = await getCachedUserData();
  return <div>{userData?.name}</div>;
}
```

[Docs](https://nextjs.org/docs/app/getting-started/caching)
