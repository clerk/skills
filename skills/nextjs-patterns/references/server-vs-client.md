# Server vs Client Components

| Impact | Tags |
|--------|------|
| CRITICAL | server, client, auth, hooks |

## Always Await auth()

**Impact: CRITICAL** - Missing await causes undefined userId

**Incorrect (sync call):**

```tsx
// WRONG - auth() is async in Next.js 15!
const { userId } = auth();
console.log(userId); // undefined
```

**Correct (async call):**

```tsx
const { userId } = await auth();
console.log(userId); // 'user_xxx'
```

---

## Server vs Client Import

**Impact: CRITICAL** - Wrong import breaks the build

**Incorrect (server import in client):**

```tsx
'use client';
import { auth } from '@clerk/nextjs/server'; // BUILD ERROR
```

**Correct (client hooks in client):**

```tsx
'use client';
import { useAuth } from '@clerk/nextjs';

export function UserButton() {
  const { userId } = useAuth();
  // ...
}
```

---

## Server Components (Default)

**Impact: HIGH** - Best for initial load, SEO, DB queries

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
  return <h1>Welcome, {user?.firstName}!</h1>;
}
```

---

## Client Components

**Impact: MEDIUM** - For interactive UI, sign out, token fetching

Use hooks from `@clerk/nextjs`:

```tsx
'use client';

import { useUser, useAuth } from '@clerk/nextjs';

export function UserDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken, signOut } = useAuth();

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

---

## Hybrid Pattern (Recommended)

**Impact: HIGH** - Best of both worlds

```tsx
// Server Component - fetch initial data
import { currentUser } from '@clerk/nextjs/server';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) return <div>Please sign in</div>;

  return <ProfileForm initialData={{ firstName: user.firstName }} />;
}

// Client Component - handle interactions
'use client';

import { useUser } from '@clerk/nextjs';

export function ProfileForm({ initialData }) {
  const { user } = useUser();
  const displayName = user?.firstName ?? initialData.firstName;
  return <form>...</form>;
}
```

Reference: [Server-side auth](https://clerk.com/docs/references/nextjs/auth)
