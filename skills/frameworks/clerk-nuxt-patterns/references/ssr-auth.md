# SSR Auth (HIGH)

## Server vs Client Boundary

`@clerk/nuxt` composables (`useAuth`, `useUser`) are client-reactive but the initial state is SSR-safe.

| Context | How to get auth |
|---------|----------------|
| Vue component (`<script setup>`) | `useAuth()`, `useUser()` composables |
| Nitro server route | `event.context.auth` |
| Nuxt plugin (server) | `event.context.auth` via `useNitroApp` |

## SSR-Safe Page Pattern

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { userId, isLoaded } = useAuth()
</script>

<template>
  <div v-if="!isLoaded">Loading...</div>
  <main v-else>
    <p>User: {{ userId }}</p>
  </main>
</template>
```

The middleware runs server-side, so by the time the page renders, unauthenticated users are already redirected.

## Hydration Safety

Avoid rendering auth-dependent content that differs between server and client:

```vue
<!-- WRONG: causes hydration mismatch -->
<template>
  <div v-if="isSignedIn">Dashboard</div>
</template>

<!-- CORRECT: use ClientOnly for auth-gated content if SSR causes mismatch -->
<template>
  <ClientOnly>
    <div v-if="isSignedIn">Dashboard</div>
  </ClientOnly>
</template>
```

When using middleware, the server redirect happens before hydration, so this is rarely needed for protected pages.

## useFetch with Auth

Pass the session token to server-side `useFetch` for authenticated API calls:

```vue
<script setup lang="ts">
const { getToken } = useAuth()

const { data } = await useFetch('/api/protected', {
  headers: async () => {
    const token = await getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  },
})
</script>
```

[Docs](https://clerk.com/docs/nuxt/getting-started/quickstart)
