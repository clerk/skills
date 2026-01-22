---
name: syncing-users
description: Sync Clerk users to your database via webhooks. Use when you need to store user data locally, react to auth events, sync with Prisma/Drizzle/Supabase, or handle user lifecycle events.
license: MIT
metadata:
  author: clerk
  version: '1.0.0'
---

# Syncing Users to Your Database

Sync Clerk users, organizations, and events to your database using webhooks.

## Why Sync?

Clerk is the source of truth for auth, but you need user data in your database for:

- Relating users to app data (posts, orders, etc.)
- Complex queries joining user data
- Storing additional metadata

## Quick Start

1. Create an endpoint in your app that listens for and handles the webhook. It should use Clerk's `verifyWebhook()` helper to verify the webhook.
1. Go to the [Webhooks](https://dashboard.clerk.com/~/webhooks) page in the Clerk Dashboard and add your endpoint URL.
1. Select the webhook events you want to subscribe to.
1. Copy your endpoint's Signing Secret and add it to your app's environment variables. Clerk's `verifyWebhook()` method will use it to verify the webhook.

For a detailed tutorial with code examples, see the [dedicated guide](https://clerk.com/docs/guides/development/webhooks/syncing) in the Clerk documentation.

## Templates

| Template                         | Use Case                      |
| -------------------------------- | ----------------------------- |
| `templates/nextjs/route.ts`      | Next.js webhook route handler |
| `templates/prisma/handlers.ts`   | Prisma DB sync handlers       |
| `templates/drizzle/handlers.ts`  | Drizzle DB sync handlers      |
| `templates/supabase/handlers.ts` | Supabase DB sync handlers     |

## Webhook Events

The following are examples of available webhooks. To find a list of all the events Clerk supports, navigate to the [Webhooks](https://dashboard.clerk.com/~/webhooks) page in the Clerk Dashboard, and select the **Event Catalog** tab.

| Event                            | When                 |
| -------------------------------- | -------------------- |
| `user.created`                   | New user signs up    |
| `user.updated`                   | User updates profile |
| `user.deleted`                   | User account deleted |
| `organization.created`           | New org created      |
| `organizationMembership.created` | User joins org       |

## Common Pitfalls

- **Use raw text body** for signature verification - `await req.text()` not `req.json()`
- **Pass all svix headers** - `svix-id`, `svix-timestamp`, `svix-signature`
- **Handle all event types** - `user.created`, `user.updated`, `user.deleted`
- **Use upsert pattern** - events may arrive out of order
- **Return fast** - queue long operations, webhook has timeout

## See Also

- `managing-orgs/` - Organization webhook events

## Documentation

- [Clerk Webhooks](https://clerk.com/docs/webhooks/overview)
