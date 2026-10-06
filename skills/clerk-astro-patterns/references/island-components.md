# Island Components

## React Island with Clerk Hooks

`@clerk/astro/react` exports `useAuth` but no `useUser`. Read the user from `$userStore` in `@clerk/astro/client` instead.

```tsx
// src/components/UserNav.tsx
import { useSyncExternalStore } from 'react'
import { useAuth, UserButton, SignInButton } from '@clerk/astro/react'
import { $userStore } from '@clerk/astro/client'

export function UserNav() {
  const { isSignedIn, isLoaded } = useAuth()
  const user = useSyncExternalStore($userStore.listen, $userStore.get, $userStore.get)

  if (!isLoaded) return null

  if (!isSignedIn) {
    return <SignInButton mode="modal" />
  }

  return (
    <div>
      <span>{user?.firstName}</span>
      <UserButton />
    </div>
  )
}
```

```astro
---
// src/pages/index.astro
import { UserNav } from '../components/UserNav'
---

<UserNav client:load />
```

## Client Directives

| Directive | When to Use |
|-----------|-------------|
| `client:load` | Hydrate immediately on page load |
| `client:idle` | Hydrate when browser is idle |
| `client:visible` | Hydrate when component scrolls into view |
| `client:only="react"` | No SSR, render only on client |

## Prebuilt UI Components

```tsx
import {
  SignIn,
  SignUp,
  UserButton,
  UserProfile,
  OrganizationSwitcher,
  SignInButton,
  SignOutButton,
} from '@clerk/astro/react'
```

Use these in islands (`.tsx` files) — not directly in `.astro` files without a client directive.

## CRITICAL

- Always add a `client:*` directive — without it the island is server-rendered only and Clerk hooks return undefined
- Import from `@clerk/astro/react` — not `@clerk/react`
- Islands that need real-time auth state (e.g. sign-out button) must use `client:load`
