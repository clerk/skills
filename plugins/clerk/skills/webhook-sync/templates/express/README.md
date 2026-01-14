# Express Webhook Setup

## Install

```bash
npm install @clerk/express
```

## Environment Variable

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx
```

## Files to Copy

1. `handler.ts` → your Express routes file

## Gotchas

### 1. Don't parse body before verifyWebhook

`verifyWebhook` needs the raw request body:

```typescript
// WRONG - body already parsed
app.use(express.json());
app.post('/webhooks', async (req, res) => {
  await verifyWebhook(req); // Fails!
});

// RIGHT - let verifyWebhook handle it
app.post('/webhooks', async (req, res) => {
  await verifyWebhook(req); // Works
});
```

### 2. Return 200 quickly

```typescript
await queue.add('process-webhook', { event: evt });
res.json({ received: true });
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
