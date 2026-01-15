---
name: nextjs-patterns
description: Advanced Next.js patterns with Clerk authentication. Use when working on middleware strategies, Server Actions auth, App Router patterns, caching with auth, or optimizing Clerk in Next.js.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Advanced Next.js Patterns with Clerk

Deep patterns for building production Next.js applications with Clerk. Covers middleware strategies, Server Components vs Client Components, Server Actions, and caching.

> **Note**: For basic setup, see the `adding-auth` skill. This skill focuses on advanced patterns and optimization.

## Middleware Strategies

### Public-First (Recommended for most apps)

Protect specific routes, allow everything else:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/settings(.*)',
  '/api/private(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

### Protected-First (For internal apps)

Block everything, allow specific public routes:

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/public(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});
```

### With Organizations

Require organization membership for specific routes:

```typescript
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

---

## Server Components vs Client Components

### When to Use Server Components

Use `auth()` and `currentUser()` from `@clerk/nextjs/server`:

```tsx
// app/dashboard/page.tsx
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return <div>Please sign in</div>;
  }

  const user = await currentUser();

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      <p>User ID: {userId}</p>
      {orgId && <p>Organization: {orgId}</p>}
    </div>
  );
}
```

**Best for:**
- Initial page load
- SEO-critical pages
- Reducing client bundle size
- Database queries with auth context

### When to Use Client Components

Use hooks from `@clerk/nextjs`:

```tsx
'use client';

import { useUser, useAuth, useOrganization } from '@clerk/nextjs';

export function UserDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut } = useAuth();
  const { organization } = useOrganization();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;

  return (
    <div>
      <p>Hello, {user.firstName}!</p>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
```

**Best for:**
- Interactive UI that needs live auth state
- Sign out buttons
- Token fetching for API calls
- Organization switching

### Hybrid Pattern (Recommended)

Combine Server and Client Components:

```tsx
// app/profile/page.tsx (Server Component)
import { currentUser } from '@clerk/nextjs/server';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) return <div>Please sign in</div>;

  // Pass serializable data to client
  const initialData = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.primaryEmailAddress?.emailAddress,
  };

  return <ProfileForm initialData={initialData} />;
}

// app/profile/ProfileForm.tsx (Client Component)
'use client';

import { useUser } from '@clerk/nextjs';

export function ProfileForm({ initialData }) {
  const { user } = useUser();

  // Use initialData for hydration, user for live updates
  const displayName = user?.firstName ?? initialData.firstName;

  return <form>{/* ... */}</form>;
}
```

---

## Server Actions with Auth

### Protected Server Actions

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createPost(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;

  // Create post with userId
  await db.posts.create({
    data: { title, authorId: userId },
  });

  revalidatePath('/posts');
}
```

### With Organization Context

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function createTeamProject(formData: FormData) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error('Must be in an organization');
  }

  // Check permissions
  if (orgRole !== 'org:admin') {
    throw new Error('Only admins can create projects');
  }

  const name = formData.get('name') as string;

  await db.projects.create({
    data: { name, organizationId: orgId },
  });
}
```

### With Permission Checks

```typescript
'use server';

import { auth } from '@clerk/nextjs/server';

export async function deleteProject(projectId: string) {
  const { userId, has } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Check custom permission
  const canDelete = await has({ permission: 'org:project:delete' });

  if (!canDelete) {
    throw new Error('Missing permission: org:project:delete');
  }

  await db.projects.delete({ where: { id: projectId } });
}
```

---

## Caching with Auth

### Using unstable_cache with Auth

```typescript
import { auth } from '@clerk/nextjs/server';
import { unstable_cache } from 'next/cache';

// Create a cached function that uses auth context
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

### Revalidating Cached Auth Data

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

---

## API Route Patterns

### Protected API Route

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

### With Organization Check

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

---

## Common Pitfalls

### 1. Calling auth() in Client Components

**Wrong:**
```tsx
'use client';
import { auth } from '@clerk/nextjs/server'; // Won't work!
```

**Right:**
```tsx
'use client';
import { useAuth } from '@clerk/nextjs';
```

### 2. Not Awaiting auth()

**Wrong:**
```tsx
const { userId } = auth(); // Missing await!
```

**Right:**
```tsx
const { userId } = await auth();
```

### 3. Serialization Errors with User Object

**Wrong:**
```tsx
// Server Component
const user = await currentUser();
return <ClientComponent user={user} />; // Error: not serializable
```

**Right:**
```tsx
const user = await currentUser();
const userData = {
  id: user.id,
  firstName: user.firstName,
  email: user.primaryEmailAddress?.emailAddress,
};
return <ClientComponent user={userData} />;
```

## Documentation

- [Next.js SDK Reference](https://clerk.com/docs/references/nextjs/overview)
- [Server-side helpers](https://clerk.com/docs/references/nextjs/auth)
- [Middleware](https://clerk.com/docs/references/nextjs/clerk-middleware)
