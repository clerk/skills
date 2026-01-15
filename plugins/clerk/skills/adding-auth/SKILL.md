---
name: adding-auth
description: Add Clerk authentication to any project. Use when setting up Clerk, adding auth to a new app, or integrating Clerk with Next.js, Express, Remix, React, or other frameworks.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Adding Authentication with Clerk

This skill helps you add Clerk authentication to any project. It detects your framework and provides the appropriate setup instructions.

## Framework Detection

Before starting, check your project's `package.json` to detect the framework:

| Dependency | Framework | Template |
|------------|-----------|----------|
| `next` | Next.js | `templates/nextjs/` |
| `express` | Express | `templates/express/` |
| `@remix-run/react` | Remix | `templates/remix/` |
| `react` (no framework) | React SPA | `templates/react/` |

## Quick Start

### 1. Install Dependencies

```bash
# Next.js
npm install @clerk/nextjs

# Express
npm install @clerk/express

# Remix
npm install @clerk/remix

# React SPA
npm install @clerk/clerk-react
```

### 2. Get Your API Keys

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create an application (or select existing)
3. Copy your keys from **API Keys** section

```bash
# .env.local (Next.js) or .env (others)
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Next.js also needs:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
```

### 3. Framework-Specific Setup

Choose your framework below for detailed setup instructions.

---

## Next.js Setup

### Wrap Your App with ClerkProvider

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Add Middleware for Route Protection

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

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

### Add Auth UI

```tsx
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton />
        <SignUpButton />
      </SignedOut>
    </header>
  );
}
```

---

## Express Setup

### Initialize Clerk Middleware

```typescript
import express from 'express';
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';

const app = express();

// Add Clerk middleware to all routes
app.use(clerkMiddleware());

// Public route
app.get('/', (req, res) => {
  res.json({ message: 'Public route' });
});

// Protected route
app.get('/protected', requireAuth(), (req, res) => {
  const { userId } = getAuth(req);
  res.json({ userId });
});

app.listen(3000);
```

---

## React SPA Setup

### Wrap Your App with ClerkProvider

```tsx
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function App() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <Router />
    </ClerkProvider>
  );
}
```

### Add Auth Components

```tsx
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';

function Header() {
  return (
    <header>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
    </header>
  );
}
```

---

## Remix Setup

### Add ClerkApp HOC

```tsx
// app/root.tsx
import { ClerkApp } from '@clerk/remix';
import { rootAuthLoader } from '@clerk/remix/ssr.server';

export const loader = (args) => rootAuthLoader(args);

function App() {
  return (
    <html>
      <head />
      <body>
        <Outlet />
      </body>
    </html>
  );
}

export default ClerkApp(App);
```

---

## Next Steps

After basic setup:

- **Custom UI**: See `customizing-auth-ui` skill for custom sign-in/sign-up forms
- **Webhooks**: See `syncing-users` skill to sync users to your database
- **Organizations**: See `managing-orgs` skill for B2B multi-tenant apps
- **Testing**: See `testing-auth` skill for E2E test setup
- **Advanced Next.js**: See `nextjs-patterns` skill for middleware strategies, Server Actions, caching

## Documentation

- [Clerk Docs](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Express Quickstart](https://clerk.com/docs/quickstarts/express)
- [React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Remix Quickstart](https://clerk.com/docs/quickstarts/remix)
