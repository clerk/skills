# Server vs Client Components

## When to Use Server Components

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

**Best for:**
- Initial page load
- SEO-critical pages
- Reducing client bundle size
- Database queries with auth context

## When to Use Client Components

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

**Best for:**
- Interactive UI needing live auth state
- Sign out buttons
- Token fetching for API calls
- Organization switching

## Hybrid Pattern (Recommended)

```tsx
// Server Component - fetch initial data
import { currentUser } from '@clerk/nextjs/server';
import { ProfileForm } from './ProfileForm';

export default async function ProfilePage() {
  const user = await currentUser();
  if (!user) return <div>Please sign in</div>;

  const initialData = {
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return <ProfileForm initialData={initialData} />;
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

## Common Mistakes

### Calling auth() in Client Components

```tsx
// WRONG - won't work
'use client';
import { auth } from '@clerk/nextjs/server';

// RIGHT
'use client';
import { useAuth } from '@clerk/nextjs';
```

### Not Awaiting auth()

```tsx
// WRONG
const { userId } = auth();

// RIGHT
const { userId } = await auth();
```
