# Next.js Webhook Setup

## Install

```bash
npm install @clerk/nextjs
```

## Environment Variable

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx
```

## Files to Copy

1. `route.ts` → `app/api/webhooks/clerk/route.ts`

## Middleware Configuration

Ensure webhook route is NOT protected:

```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip webhook routes - they use their own auth
    '/((?!api/webhooks).*)',
  ],
};
```

## Gotchas

### 1. Webhook route must be excluded from middleware

The webhook uses `CLERK_WEBHOOK_SIGNING_SECRET` for auth, not session tokens.

### 2. Return 200 quickly

Clerk retries on non-2xx. For heavy processing:

```typescript
await queue.add('process-webhook', { event: evt });
return Response.json({ received: true });
```

### 3. Webhooks are eventually consistent

```typescript
// BAD: User might not exist in DB yet
redirect('/dashboard');

// GOOD: Use session token for immediate access
const { userId } = await auth();
```
