---
name: clerk-vue-patterns
description: 'Vue 3 and Nuxt patterns with Clerk — composables (useAuth, useUser,
  useClerk, useOrganization), Nuxt middleware, Vue Router guards, Pinia auth store
  integration. Triggers on: vue clerk, nuxt clerk, useAuth vue, clerk composables,
  nuxt middleware auth, vue router clerk guard, pinia auth clerk.'
license: MIT
allowed-tools: WebFetch
metadata:
  author: clerk
  version: 1.0.0
---

# Vue / Nuxt Patterns

SDKs: `@clerk/vue` v2+ (Vue 3), `@clerk/nuxt` v2+ (Nuxt 3).

## What Do You Need?

| Task | Reference |
|------|-----------|
| Composables: useAuth, useUser, useOrganization | references/composables.md |
| Nuxt server middleware | references/nuxt-middleware.md |
| Vue Router navigation guards | references/vue-router-guards.md |
| Pinia store with auth state | references/pinia-integration.md |

## Mental Model

Vue and Nuxt use the same composables from `@clerk/vue`. Nuxt adds server-side auth via `@clerk/nuxt/server`:

- **`useAuth()`** — reactive `isSignedIn`, `userId`, `signOut`
- **`useUser()`** — reactive `user` object
- **`useClerk()`** — full Clerk instance for advanced operations
- **`useOrganization()`** — reactive `organization`, `membership`
- **Nuxt middleware** — `clerkMiddleware` in `server/middleware/clerk.ts`

## Setup

### Vue (Plain)

```ts
// main.ts
import { clerkPlugin } from '@clerk/vue'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.mount('#app')
```

### Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@clerk/nuxt'],
  clerk: {
    publishableKey: process.env.NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  },
})
```

## Composables Usage

```vue
<script setup lang="ts">
import { useAuth, useUser } from '@clerk/vue'

const { isSignedIn, userId, signOut } = useAuth()
const { user } = useUser()
</script>

<template>
  <div v-if="isSignedIn">
    <p>Hello {{ user?.firstName }}</p>
    <button @click="signOut()">Sign Out</button>
  </div>
  <SignInButton v-else />
</template>
```

## Nuxt Server Auth

```ts
// server/api/data.get.ts
import { getAuth } from '@clerk/nuxt/server'

export default defineEventHandler(async (event) => {
  const { userId } = getAuth(event)
  if (!userId) throw createError({ statusCode: 401, message: 'Unauthorized' })

  return { data: await fetchData(userId) }
})
```

## Org Switching

```vue
<script setup lang="ts">
import { useOrganizationList } from '@clerk/vue'

const { userMemberships, setActive } = useOrganizationList()
</script>

<template>
  <button
    v-for="mem in userMemberships.data ?? []"
    :key="mem.organization.id"
    @click="setActive({ organization: mem.organization.id })"
  >
    {{ mem.organization.name }}
  </button>
</template>
```

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Composables return `undefined` | Not inside `ClerkProvider` tree | Ensure `clerkPlugin` is installed or `@clerk/nuxt` module added |
| `userId` reactive but not updating | Destructuring loses reactivity | Use `const { userId } = useAuth()` (toRefs-style composable, reactive) |
| Server route returns stale auth | Using client composable in server route | Use `getAuth(event)` from `@clerk/nuxt/server` |
| Nuxt hydration mismatch | Server/client auth state differs | This is expected — Clerk handles it; avoid server-rendering auth-gated UI |

## Import Map

| What | Vue Import | Nuxt Import |
|------|-----------|-------------|
| Composables | `@clerk/vue` | `@clerk/vue` or auto-imported |
| Plugin setup | `@clerk/vue` | via `@clerk/nuxt` module |
| Server auth | — | `@clerk/nuxt/server` |
| Components | `@clerk/vue` | auto-imported |

## Docs

- [Vue SDK](https://clerk.com/docs/vue/getting-started/quickstart)
