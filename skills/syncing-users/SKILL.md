---
name: syncing-users
description: Sync Clerk users to database via webhooks. Use when relating users to app data or running complex queries.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# User Sync (Webhooks)

## Decision Tree

| ORM/DB | Documentation |
|--------|---------------|
| General setup | https://clerk.com/docs/webhooks/overview |
| Sync to database | https://clerk.com/docs/webhooks/sync-data |
| Event reference | https://clerk.com/docs/webhooks/events |

## Setup

1. Create webhook endpoint
2. Dashboard → Webhooks → Add Endpoint
3. Add `CLERK_WEBHOOK_SIGNING_SECRET` to env

## Key Events

`user.created` | `user.updated` | `user.deleted` | `organization.created` | `organizationMembership.created`

## Best Practices

- Use `verifyWebhook(req)` from `@clerk/nextjs/webhooks` (handles signature automatically)
- Use upsert operations (events may arrive out of order)
- Return fast, queue long operations
- Handle all relevant event types in switch statement

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Manual svix verification | Error-prone | Use `verifyWebhook()` helper |
| Long webhook handler | Timeouts | Queue async work |
| Only handle `user.created` | Missing updates/deletes | Handle all user events |

## See Also

- [Webhooks Overview](https://clerk.com/docs/webhooks/overview)
- [Sync Data Guide](https://clerk.com/docs/webhooks/sync-data)
