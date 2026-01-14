# Astro Webhook Setup

## Install

```bash
npm install @clerk/astro
```

## Environment Variable

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx
```

## Files to Copy

1. `endpoint.ts` → `src/pages/api/webhooks/clerk.ts`

## Gotchas

### 1. Use APIRoute type

```typescript
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  // ...
};
```

### 2. Return Response objects

```typescript
// WRONG
return { received: true };

// RIGHT
return new Response(JSON.stringify({ received: true }));
```

### 3. Handle idempotency

Webhooks may be delivered multiple times:

```typescript
await db.users.upsert({
  where: { clerk_id: data.id },
  create: { ... },
  update: { ... },
});
```
