---
name: nextjs-clerk
description: Help write Next.js applications with Clerk authentication. Use when the user asks about adding Clerk auth to a Next.js app, protecting routes, using authentication hooks, implementing sign-in/sign-up flows, or working with organizations in Next.js.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Next.js Clerk Authentication Skill

This skill helps you implement Clerk authentication in Next.js applications. It covers the App Router (Next.js 15+), server components, client components, proxy middleware, and common authentication patterns.

> **Note**: Next.js 16+ uses `proxy.ts` instead of `middleware.ts`. For Next.js 15 or earlier, use `middleware.ts` with the same code.

## Quick Start

### 1. Install Dependencies

```bash
npm install @clerk/nextjs
```

### 2. Set Environment Variables

Create a `.env.local` file with your Clerk keys from the [Clerk Dashboard](https://dashboard.clerk.com):

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

### 3. Wrap Your App with ClerkProvider

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

### 4. Add Proxy Middleware for Route Protection

```typescript
// proxy.ts (or middleware.ts for Next.js ≤15)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

## Available Scripts

This skill provides shell scripts to scaffold common Clerk patterns:

| Script | Description |
|--------|-------------|
| `bash scripts/setup.sh` | Set up a new Next.js project with Clerk |
| `bash scripts/middleware.sh` | Generate middleware with route protection |
| `bash scripts/auth-pages.sh` | Generate sign-in and sign-up pages |
| `bash scripts/components.sh` | Generate common auth component patterns |
| `bash scripts/webhook.sh` | Generate webhook handler for Clerk events |

## Common Patterns

### Server Components (Recommended)

Access auth state in Server Components:

```typescript
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

### Client Components

Use hooks in Client Components:

```typescript
'use client';
import { useUser, useAuth } from '@clerk/nextjs';

export function UserGreeting() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>Not signed in</div>;

  return <p>Hello, {user.firstName}!</p>;
}
```

### API Routes

Protect API routes:

```typescript
// app/api/data/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({ data: 'Protected data' });
}
```

### Pre-built Components

Use Clerk's pre-built UI components:

```tsx
import {
  SignIn,
  SignUp,
  UserButton,
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from '@clerk/nextjs';

// In your layout or page
<SignedIn>
  <UserButton />
</SignedIn>
<SignedOut>
  <SignInButton />
</SignedOut>
```

## Organizations (B2B)

For multi-tenant applications with organizations:

### Enable Organizations

1. Go to Clerk Dashboard → Organizations → Settings
2. Enable Organizations

### Use Organization Hooks

```typescript
'use client';
import { useOrganization, useOrganizationList } from '@clerk/nextjs';

export function OrgDashboard() {
  const { organization, membership } = useOrganization();
  const { setActive } = useOrganizationList();

  return (
    <div>
      <h1>{organization?.name}</h1>
      <p>Your role: {membership?.role}</p>
    </div>
  );
}
```

### Protect Routes by Organization

```typescript
// proxy.ts (or middleware.ts for Next.js ≤15)
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isOrgRoute = createRouteMatcher(['/dashboard(.*)']);

export default clerkMiddleware(async (auth, req) => {
  const { orgId } = await auth();

  // Require organization for dashboard routes
  if (isOrgRoute(req) && !orgId) {
    return Response.redirect(new URL('/select-org', req.url));
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

## Webhooks

Handle Clerk webhook events:

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  
  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id!,
      'svix-timestamp': svix_timestamp!,
      'svix-signature': svix_signature!,
    }) as WebhookEvent;
  } catch (err) {
    return Response.json({ error: 'Invalid webhook' }, { status: 400 });
  }

  switch (evt.type) {
    case 'user.created':
      // Handle new user
      break;
    case 'organization.created':
      // Handle new organization
      break;
  }

  return Response.json({ received: true });
}
```

## Documentation

- [Clerk Docs](https://clerk.com/docs)
- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Backend API](https://clerk.com/docs/reference/backend-api)
- [@clerk/nextjs Reference](https://clerk.com/docs/references/nextjs/overview)

