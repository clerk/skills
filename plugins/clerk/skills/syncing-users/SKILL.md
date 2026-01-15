---
name: syncing-users
description: Sync Clerk users to your database via webhooks. Use when you need to store user data locally, react to auth events, sync with Prisma/Drizzle/Supabase, or handle user lifecycle events.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Syncing Users to Your Database

Sync Clerk users, organizations, and events to your database using webhooks.

## Why Sync?

Clerk is the source of truth for auth, but you need user data in your database for:
- Relating users to app data (posts, orders, etc.)
- Complex queries joining user data
- Storing additional metadata

## Quick Start

1. Create webhook endpoint (see `templates/nextjs/route.ts`)
2. Configure webhook in [Clerk Dashboard](https://dashboard.clerk.com) → Webhooks
3. Add `CLERK_WEBHOOK_SIGNING_SECRET` to `.env`
4. Implement DB handlers for your ORM

## Templates

| Template | Use Case |
|----------|----------|
| `templates/nextjs/route.ts` | Next.js webhook route handler |
| `templates/prisma/handlers.ts` | Prisma DB sync handlers |
| `templates/drizzle/handlers.ts` | Drizzle DB sync handlers |
| `templates/supabase/handlers.ts` | Supabase DB sync handlers |

## Webhook Events

| Event | When |
|-------|------|
| `user.created` | New user signs up |
| `user.updated` | User updates profile |
| `user.deleted` | User account deleted |
| `organization.created` | New org created |
| `organizationMembership.created` | User joins org |

## Documentation

- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
- [Webhook Events](https://clerk.com/docs/webhooks/events)
