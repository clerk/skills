# Pinia Integration

## Auth Store (Thin Wrapper)

Wrap `useAuth` in a Pinia store for app-wide access without prop drilling:

```ts
// stores/auth.ts
import { defineStore } from 'pinia'
import { useAuth, useUser } from '@clerk/vue'

export const useAuthStore = defineStore('auth', () => {
  const { isSignedIn, isLoaded, userId, signOut, getToken } = useAuth()
  const { user } = useUser()

  return {
    isSignedIn,
    isLoaded,
    userId,
    user,
    signOut,
    getToken,
  }
})
```

Usage in components:

```vue
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<template>
  <p v-if="auth.isSignedIn">{{ auth.user?.firstName }}</p>
</template>
```

## Org Store

```ts
// stores/org.ts
import { defineStore } from 'pinia'
import { useOrganization, useOrganizationList } from '@clerk/vue'

export const useOrgStore = defineStore('org', () => {
  const { organization, membership } = useOrganization()
  const { userMemberships, setActive } = useOrganizationList()

  function switchOrg(orgId: string) {
    return setActive.value!({ organization: orgId })
  }

  return {
    organization,
    membership,
    userMemberships,
    switchOrg,
  }
})
```

## Server-Side State Hydration (Nuxt)

In Nuxt, hydrate the store with server auth state to avoid client-side flash:

```ts
// plugins/auth-hydration.ts
import { useAuthStore } from '@/stores/auth'

export default defineNuxtPlugin(async () => {
  const store = useAuthStore()
  await until(store.isLoaded).toBeTruthy()
})
```

## CRITICAL

- Do NOT copy `userId` into Pinia state manually — it creates a stale copy. Always return refs directly from composables
- Pinia store `setup()` function runs inside Vue's setup context — composables work correctly here
- In Nuxt, stores are created per-request on the server — do NOT store sensitive data (tokens) in Pinia
