# Server vs Client

## CRITICAL: Always `await auth()`

```tsx
// WRONG
const { userId } = auth(); // undefined!

// CORRECT
const { userId } = await auth();
```

## When to Use

- **Server Components** - Initial load, SEO, DB queries. Render the ones that call `auth()` or `currentUser()` inside `<Suspense>`: with Cache Components (`cacheComponents: true`, the `create-next-app` default), `next build` fails on request data read outside a `<Suspense>` boundary.
- **Client Components** - Interactive UI, sign out, token fetching

## Import Rules

```tsx
// Server Components
import { auth, currentUser } from '@clerk/nextjs/server';

// Client Components
'use client';
import { useAuth, useUser } from '@clerk/nextjs';
```

## Server Component

```tsx
import { auth, currentUser } from '@clerk/nextjs/server';
import { Suspense } from 'react';

async function Welcome() {
  const { isAuthenticated } = await auth();
  if (!isAuthenticated) return <div>Please sign in</div>;

  const user = await currentUser();
  return <h1>Welcome, {user?.firstName}!</h1>;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Welcome />
    </Suspense>
  );
}
```

> **Core 2 ONLY (skip if current SDK):** `isAuthenticated` is not available. Use `const { userId } = await auth()` and check `if (!userId)` instead.

## Client Component

```tsx
'use client';
import { useUser, useAuth } from '@clerk/nextjs';

export function UserDashboard() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

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

## Hybrid Pattern

```tsx
// Server: fetch initial data
import { currentUser } from '@clerk/nextjs/server';
import { Suspense } from 'react';
import { ProfileForm } from './ProfileForm';

async function Profile() {
  const user = await currentUser();
  if (!user) return <div>Please sign in</div>;
  return <ProfileForm initialData={{ firstName: user.firstName }} />;
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}

// Client: handle interactions
'use client';
import { useUser } from '@clerk/nextjs';

export function ProfileForm({ initialData }) {
  const { user } = useUser();
  return <form>...</form>;
}
```

## Conditional Rendering

Use `<Show>` to render content based on auth state. In a Server Component, `<Show>` reads the session from the request, so wrap it in `<Suspense>`. In a Client Component, it reads client-side auth state and needs no boundary.

```tsx
import { Show } from '@clerk/nextjs';
import { Suspense } from 'react';

<Suspense>
  <Show when="signed-in" fallback={<div>Please sign in</div>}>
    <Dashboard />
  </Show>
</Suspense>
```

> **Core 2 ONLY (skip if current SDK):** Use `<SignedIn>` and `<SignedOut>` components instead of `<Show>`.

[Docs](https://clerk.com/docs/reference/nextjs/auth)
