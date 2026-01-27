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

- Use `await req.text()` for signature verification (not `req.json()`)
- Pass all svix headers: `svix-id`, `svix-timestamp`, `svix-signature`
- Use upsert operations (events may arrive out of order)
- Return fast, queue long operations

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| `req.json()` for body | Signature fails | `req.text()` then parse |
| Missing svix headers | Verification fails | Forward all three headers |
| Long webhook handler | Timeouts | Queue async work |

## See Also

- [Webhooks Overview](https://clerk.com/docs/webhooks/overview)
- [Sync Data Guide](https://clerk.com/docs/webhooks/sync-data)
