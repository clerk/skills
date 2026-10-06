# TanStack Start Server Setup (HIGH)

## Vite Plugin and Request Middleware

TanStack Start uses the `tanstackStart()` Vite plugin. In `vite.config.ts`, add the plugin to the Vite configuration:

```typescript
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tanstackStart()],
})
```

Register Clerk and CSRF middleware in `src/start.ts` (requires `@tanstack/react-start` 1.168.0 or later):

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

Defining `src/start.ts` replaces TanStack Start's default middleware configuration. Include CSRF middleware to protect server functions. Without `clerkMiddleware()`, `auth()` cannot read the session in server functions.

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

TanStack Start server routes live in `src/routes/api/`:

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
