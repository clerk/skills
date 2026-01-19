# Syncing Users - Gotchas

Common pitfalls when syncing Clerk users to your database.

## Webhook Security

### Invalid Signature Errors
```typescript
// WRONG - using parsed JSON body
export async function POST(req: Request) {
  const body = await req.json(); // Signature will fail!
  const wh = new Webhook(secret);
  wh.verify(JSON.stringify(body), headers); // Wrong!
}

// CORRECT - use raw text body
export async function POST(req: Request) {
  const body = await req.text();
  const wh = new Webhook(secret);
  wh.verify(body, headers);
}
```

### Missing Headers
```typescript
// WRONG - not passing all required headers
const evt = wh.verify(body, { 'svix-signature': sig });

// CORRECT - pass all svix headers
const evt = wh.verify(body, {
  'svix-id': req.headers.get('svix-id')!,
  'svix-timestamp': req.headers.get('svix-timestamp')!,
  'svix-signature': req.headers.get('svix-signature')!,
});
```

### Wrong Signing Secret
- Dashboard > Webhooks > Your Endpoint > Signing Secret
- Must match `CLERK_WEBHOOK_SIGNING_SECRET` exactly
- Regenerate if compromised

## Event Handling

### Not Handling All Events
```typescript
// WRONG - only handling user.created
if (evt.type === 'user.created') {
  await db.user.create({ ... });
}
// User updates never sync!

// CORRECT - handle all relevant events
switch (evt.type) {
  case 'user.created':
    await db.user.create({ ... });
    break;
  case 'user.updated':
    await db.user.update({ ... });
    break;
  case 'user.deleted':
    await db.user.delete({ ... });
    break;
}
```

### Race Conditions
```typescript
// WRONG - update might arrive before create
case 'user.updated':
  await db.user.update({ where: { clerkId } }); // Might not exist!

// CORRECT - upsert pattern
case 'user.updated':
  await db.user.upsert({
    where: { clerkId },
    update: { ...userData },
    create: { clerkId, ...userData },
  });
```

### Idempotency
```typescript
// Webhooks may be delivered multiple times
// Use unique constraints and upserts
await db.user.upsert({
  where: { clerkId: evt.data.id },
  // ...
});
```

## Data Mapping

### Missing Required Fields
```typescript
// WRONG - name might be null
await db.user.create({
  data: {
    name: evt.data.first_name, // Could be null!
  },
});

// CORRECT - handle nulls
await db.user.create({
  data: {
    name: evt.data.first_name ?? evt.data.email_addresses[0]?.email_address ?? 'Unknown',
  },
});
```

### Email Changes
```typescript
// User's primary email can change!
// Store clerkId as the stable identifier, not email

// WRONG
await db.user.update({
  where: { email: oldEmail }, // Email changed!
});

// CORRECT
await db.user.update({
  where: { clerkId: evt.data.id },
  data: { email: evt.data.email_addresses[0]?.email_address },
});
```

## Performance

### Webhook Timeouts
```typescript
// WRONG - long operation in webhook
export async function POST(req: Request) {
  // ... verify webhook
  await sendWelcomeEmail(user); // Slow!
  await syncToAnalytics(user); // Slow!
  await notifyTeam(user); // Slow!
  return Response.json({ success: true });
}

// CORRECT - return fast, process async
export async function POST(req: Request) {
  // ... verify webhook

  // Queue for async processing
  await queue.add('process-user', { userId: evt.data.id });

  // Return immediately
  return Response.json({ success: true });
}
```

### Database Connection Limits
- Serverless functions create new connections
- Use connection pooling (PgBouncer, Prisma Data Proxy)
- Set appropriate pool sizes

## Organization Webhooks

### Missing Org Events
```typescript
// Don't forget organization events if using B2B
switch (evt.type) {
  case 'organization.created':
  case 'organization.updated':
  case 'organization.deleted':
  case 'organizationMembership.created':
  case 'organizationMembership.deleted':
    // Handle org sync
}
```

## Testing Webhooks

### Local Development
```bash
# Use Clerk CLI to forward webhooks locally
npx clerk-cli webhook:forward --url http://localhost:3000/api/webhooks
```

### Webhook Logs
- Dashboard > Webhooks > Logs
- Shows delivery attempts and responses
- Retry failed deliveries

## See Also

- `managing-orgs/gotchas.md` - Organization sync issues
