# TanStack Start Server Setup (HIGH)

## Vite Plugin and Request Middleware

TanStack Start uses the `tanstackStart()` Vite plugin. In `vite.config.ts`, add it before the React plugin:

```typescript
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
})
```

Register Clerk and CSRF middleware in `src/start.ts`:

```typescript
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [csrfMiddleware, clerkMiddleware()],
  }
})
```

When `src/start.ts` exists, TanStack Start stops adding its default CSRF middleware to server functions, so register it yourself. Without `clerkMiddleware()`, `auth()` throws a middleware-not-configured error.

## ClerkProvider in Root

Add `ClerkProvider` to the root route shell component in `src/routes/__root.tsx`:

```tsx
import { ClerkProvider } from '@clerk/tanstack-react-start'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'

export const Route = createRootRoute({
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  )
}
```

## Environment Variables

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

The publishable key uses Vite's `VITE_` prefix so client-side code can access it. Keep the secret key server-side.

## Server Routes

Server routes can live anywhere under `src/routes/`. For an `/api/protected` endpoint, create `src/routes/api/protected.ts`:

```typescript
// src/routes/api/protected.ts
import { auth } from '@clerk/tanstack-react-start/server'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/protected')({
  server: {
    handlers: {
      GET: async () => {
        const { isAuthenticated, userId } = await auth()

        if (!isAuthenticated) {
          return new Response('Unauthorized', { status: 401 })
        }

        return Response.json({ userId })
      },
    },
  },
})
```

[TanStack React Start quickstart](https://clerk.com/docs/tanstack-react-start/getting-started/quickstart)
