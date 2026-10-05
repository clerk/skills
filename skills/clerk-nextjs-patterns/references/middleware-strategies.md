# Route Protection and Middleware

> **Filename:** `proxy.ts` (Next.js <=15: `middleware.ts`). The code is identical; only the filename changes.

Protect each resource where it runs: the page, the Route Handler, and the Server Function. `clerkMiddleware()` stays in `proxy.ts` so Clerk can read the session, but it does not decide which routes need auth.

`createRouteMatcher` is deprecated in `@clerk/nextjs` 7 and will be removed in the next major version. Don't add it. If a project already uses it, leave it working and point the user to the [migration guide](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher). Middleware matches on URL paths, so a Server Function called by ID, or a path the framework normalizes differently, can reach a protected resource without passing the check.

## `proxy.ts`

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

Keep the `config.matcher` block. Without the `'/(api|trpc)(.*)'` entry, `auth()` has no session on API routes.

## Protect Each Resource

`await auth.protect()` at the top of the function. For a signed-out request it redirects to sign-in from a page, returns `401` from a Server Action, and returns `404` from a Route Handler.

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  await auth.protect();
  return <h1>Dashboard</h1>;
}
```

```typescript
// app/api/dashboard/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = await auth.protect();
  return Response.json({ userId });
}
```

```typescript
// app/dashboard/actions.ts
'use server';
import { auth } from '@clerk/nextjs/server';

export async function updateDashboard() {
  await auth.protect();
  // Server Function logic
}
```

Every page checks for itself. A check in a layout is an addition, never a substitute: Next.js doesn't always re-render a layout when the page under it changes. To return `401` from a Route Handler instead of `404`, check `isAuthenticated` from `await auth()` and return the response yourself (see `references/api-routes.md`).

Two kinds of route skip the session check:

- Webhook routes authenticate each delivery with `verifyWebhook()` instead of a user session. See the `clerk-webhooks` skill.
- Deliberately public endpoints need no session check.

> **Core 2 ONLY (skip if current SDK):** On `@clerk/nextjs` v5, write `auth().protect()` (synchronous). v6 and later use `await auth.protect()`.

## Permission-Gated Resources

For B2B apps where a page or handler requires a specific permission or role, pass `{ permission }`, `{ role }`, or a callback to `auth.protect()`. A signed-in user without the permission gets a `404`.

```typescript
// app/invoices/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  await auth.protect({ permission: 'org:invoices:create' });
  return <InvoiceEditor />;
}
```

```typescript
// app/admin/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function Page() {
  await auth.protect((has) =>
    has({ role: 'org:admin' }) || has({ role: 'org:billing_manager' })
  );
  return <AdminPanel />;
}
```

Prefer permissions over roles — permissions are more granular and easier to reassign across roles in the Dashboard. See the [authorization checks guide](https://clerk.com/docs/guides/secure/authorization-checks).

> **Core 2 ONLY (skip if current SDK):** On `@clerk/nextjs` v5, write `auth().protect((has) => ...)` (synchronous). The callback signature is the same.

## Token-Based Protection (Machine APIs)

For Route Handlers that accept other token types (OAuth tokens, machine-to-machine tokens, API keys), pass a `token` option to `auth.protect()`:

```typescript
// app/api/machine/route.ts
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { machineId } = await auth.protect({ token: 'm2m_token' });
  return Response.json({ machineId });
}
```

Token types: `'session_token'` (default, browser sessions), `'oauth_token'`, `'api_key'`, `'m2m_token'`, `'any'` (accept any valid token). An array accepts several: `auth.protect({ token: ['session_token', 'm2m_token'] })`.

> **Core 2 ONLY (skip if current SDK):** Token-type protection requires Core 3. In Core 2, `protect()` only accepts a callback (no `token` option) and only validates session tokens.

## Pages Router

Call `getAuth(req)` in `getServerSideProps` and in each `pages/api` handler, and return `401` when `isAuthenticated` is false. See the [`getAuth()` reference](https://clerk.com/docs/reference/nextjs/pages-router/get-auth).

## Early Redirects

Signed-out users can be redirected to sign-in from `proxy.ts` before the page renders. That is a latency optimization only; the page still calls `auth.protect()`. See [What about early redirects for signed-out users?](https://clerk.com/docs/guides/development/upgrading/upgrade-guides/migrate-from-create-route-matcher#what-about-early-redirects-for-signed-out-users) in the migration guide.

## Session Tasks

When session tasks are enabled (e.g., forced password reset, MFA setup), users may have a `pending` session status. Redirect pending users to the task page from `proxy.ts`, for the routes that need completed tasks:

```typescript
import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const sessionTaskRoutes = ['/dashboard', '/settings'];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { sessionStatus } = await auth();
  const { pathname } = req.nextUrl;
  const routeRequiresSessionTasks = sessionTaskRoutes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (sessionStatus === 'pending' && routeRequiresSessionTasks) {
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in/tasks';
    return NextResponse.redirect(url);
  }
});
```

`/sign-in/tasks` works with the standard catch-all sign-in route (`app/sign-in/[[...sign-in]]/page.tsx`), because `<SignIn />` renders the task components by default. The redirect is a navigation convenience, not a security boundary: a `pending` session is already treated as signed out, so each page and handler still runs its own `auth.protect()`. See the [session tasks guide](https://clerk.com/docs/guides/configure/session-tasks).

> **Core 2 ONLY (skip if current SDK):** `sessionStatus` is not available. Session tasks do not exist in Core 2.

[Docs](https://clerk.com/docs/reference/nextjs/clerk-middleware)
