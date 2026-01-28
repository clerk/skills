---
name: syncing-users
description: Sync Clerk users to database via webhooks. Use when relating users to app data or running complex queries.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# User Sync (Webhooks)

**Workflow**: WebFetch the relevant doc URL below, then implement following the code examples from the docs.

## Decision Tree

| Task | Documentation |
|------|---------------|
| Setup | https://clerk.com/docs/guides/development/webhooks/overview |
| Sync to database | https://clerk.com/docs/guides/development/webhooks/syncing |
| Debugging | https://clerk.com/docs/guides/development/webhooks/debugging |

## Setup

1. Create webhook endpoint at `app/api/webhooks/route.ts`
2. Dashboard → Webhooks → Add Endpoint
3. Add `CLERK_WEBHOOK_SIGNING_SECRET` to env

## Key Events

`user.created` | `user.updated` | `user.deleted` | `organization.created` | `organizationMembership.created`

## Critical Requirements

- Import from `@clerk/backend/webhooks`
- Call `verifyWebhook(req)` passing the Request object directly (NOT `verifyWebhook({ headers, payload })`)
- Return 200 on success, 400 on verification failure
- Do NOT use svix directly

## Symptom-Based Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Verification fails | Manual svix handling | Use `verifyWebhook(req)` single param |
| "Missing svix headers" | Wrong import | Use `@clerk/backend/webhooks` |
| Missing updates | Only `user.created` | Handle `user.updated` and `user.deleted` |
| Timeouts | Long handler | Queue async work, return immediately |
| Route not found | Wrong path | Use `app/api/webhooks/route.ts` |

## See Also

- [Webhooks Overview](https://clerk.com/docs/guides/development/webhooks/overview)
- [Sync Data Guide](https://clerk.com/docs/guides/development/webhooks/syncing)
