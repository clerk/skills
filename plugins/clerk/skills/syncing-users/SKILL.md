---
name: syncing-users
description: Sync Clerk users to your database via webhooks. Use when you need to store user data locally, react to auth events, sync with Prisma/Drizzle/Supabase, or handle user lifecycle events.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Syncing Users to Your Database

Sync Clerk users, organizations, and events to your database using webhooks. Essential for storing user data locally, extending user profiles, or reacting to auth events.

## Why Sync?

Clerk is the source of truth for authentication, but you often need user data in your database for:
- Relating users to your app's data (posts, orders, etc.)
- Storing additional user metadata
- Offline access to user information
- Complex queries joining user data

## Quick Start

### 1. Create Webhook Endpoint

```typescript
// app/api/webhooks/clerk/route.ts
import { verifyWebhook, type WebhookEvent } from '@clerk/nextjs/webhooks';

export async function POST(req: Request) {
  try {
    const evt = await verifyWebhook(req);
    await handleWebhookEvent(evt);
    return Response.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }
}

async function handleWebhookEvent(evt: WebhookEvent) {
  switch (evt.type) {
    case 'user.created':
      await createUser(evt.data);
      break;
    case 'user.updated':
      await updateUser(evt.data);
      break;
    case 'user.deleted':
      await deleteUser(evt.data.id);
      break;
    case 'organization.created':
      await createOrg(evt.data);
      break;
    case 'organizationMembership.created':
      await addMember(evt.data);
      break;
  }
}
```

### 2. Configure Webhook in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
2. Add endpoint: `https://yourapp.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the signing secret to `.env`:

```bash
CLERK_WEBHOOK_SIGNING_SECRET=whsec_xxxxx
```

### 3. Implement Database Handlers

Choose your ORM below:

---

## Prisma

### Schema

```prisma
model User {
  id        String   @id // Use Clerk user ID
  email     String   @unique
  firstName String?
  lastName  String?
  imageUrl  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations to your app data
  posts     Post[]
  orders    Order[]
}
```

### Handlers

```typescript
import { prisma } from '@/lib/prisma';
import type { UserJSON } from '@clerk/nextjs/server';

export async function createUser(data: UserJSON) {
  await prisma.user.create({
    data: {
      id: data.id,
      email: data.email_addresses[0]?.email_address ?? '',
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    },
  });
}

export async function updateUser(data: UserJSON) {
  await prisma.user.update({
    where: { id: data.id },
    data: {
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    },
  });
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}
```

---

## Drizzle

### Schema

```typescript
// db/schema.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').notNull().unique(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

### Handlers

```typescript
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { UserJSON } from '@clerk/nextjs/server';

export async function createUser(data: UserJSON) {
  await db.insert(users).values({
    id: data.id,
    email: data.email_addresses[0]?.email_address ?? '',
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url,
  });
}

export async function updateUser(data: UserJSON) {
  await db
    .update(users)
    .set({
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    })
    .where(eq(users.id, data.id));
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
```

---

## Supabase

### Schema (SQL)

```sql
create table users (
  id text primary key, -- Clerk user ID
  email text unique not null,
  first_name text,
  last_name text,
  image_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;

-- Policy: users can read their own data
create policy "Users can read own data"
  on users for select
  using (auth.uid()::text = id);
```

### Handlers

```typescript
import { createClient } from '@supabase/supabase-js';
import type { UserJSON } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Use service key for webhooks
);

export async function createUser(data: UserJSON) {
  await supabase.from('users').insert({
    id: data.id,
    email: data.email_addresses[0]?.email_address ?? '',
    first_name: data.first_name,
    last_name: data.last_name,
    image_url: data.image_url,
  });
}

export async function updateUser(data: UserJSON) {
  await supabase
    .from('users')
    .update({
      email: data.email_addresses[0]?.email_address,
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url,
    })
    .eq('id', data.id);
}

export async function deleteUser(userId: string) {
  await supabase.from('users').delete().eq('id', userId);
}
```

---

## Webhook Events Reference

### User Events

| Event | When |
|-------|------|
| `user.created` | New user signs up |
| `user.updated` | User updates profile, email, etc. |
| `user.deleted` | User account deleted |

### Organization Events

| Event | When |
|-------|------|
| `organization.created` | New org created |
| `organization.updated` | Org name/settings changed |
| `organization.deleted` | Org deleted |
| `organizationMembership.created` | User joins org |
| `organizationMembership.deleted` | User leaves/removed from org |

### Session Events

| Event | When |
|-------|------|
| `session.created` | User signs in |
| `session.ended` | User signs out |
| `session.removed` | Session revoked |

---

## Testing Webhooks Locally

Use ngrok or Clerk's CLI:

```bash
# Option 1: ngrok
ngrok http 3000
# Use ngrok URL in Clerk Dashboard

# Option 2: Clerk CLI (if available)
clerk webhooks trigger user.created
```

## Error Handling

```typescript
export async function POST(req: Request) {
  try {
    const evt = await verifyWebhook(req);

    // Idempotency: check if already processed
    const processed = await isEventProcessed(evt.data.id);
    if (processed) {
      return Response.json({ received: true, skipped: true });
    }

    await handleWebhookEvent(evt);
    await markEventProcessed(evt.data.id);

    return Response.json({ received: true });
  } catch (err) {
    // Log but return 200 to prevent retries for bad data
    console.error('Webhook error:', err);

    if (err instanceof WebhookVerificationError) {
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Return 500 for DB errors to trigger retry
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## Documentation

- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [Webhook Events](https://clerk.com/docs/webhooks/events)
- [verifyWebhook Helper](https://clerk.com/docs/references/nextjs/webhooks)
