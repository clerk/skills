---
name: syncing-users
description: Sync Clerk users to database via webhooks (Prisma, Drizzle, Supabase).
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Syncing Users to Database

Sync users to your database for relating to app data and complex queries.

## Setup

1. Create webhook endpoint (`templates/nextjs/route.ts`)
2. Configure in Dashboard → Webhooks
3. Add `CLERK_WEBHOOK_SIGNING_SECRET` to `.env`

## Templates

| Template | Use Case |
|----------|----------|
| `templates/nextjs/route.ts` | Webhook route handler |
| `templates/prisma/handlers.ts` | Prisma sync |
| `templates/drizzle/handlers.ts` | Drizzle sync |
| `templates/supabase/handlers.ts` | Supabase sync |

## Events

`user.created` | `user.updated` | `user.deleted` | `organization.created` | `organizationMembership.created`

## Common Pitfalls

- **Use raw text body** - `await req.text()` not `req.json()` for signature verification
- **Pass all svix headers** - `svix-id`, `svix-timestamp`, `svix-signature`
- **Handle all event types**
- **Use upsert** - events may arrive out of order
- **Return fast** - queue long operations

## See Also

`managing-orgs/`

## Docs

[Webhooks](https://clerk.com/docs/webhooks/overview) | [Events](https://clerk.com/docs/webhooks/events)
