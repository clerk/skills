---
name: webhooks
description: Clerk webhooks for real-time events and data syncing. Listen for user creation, updates, deletion, and organization events. Build event-driven features like database sync, notifications, integrations.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Webhooks

> **Prerequisite**: Webhooks are asynchronous. Use for background tasks (sync, notifications), not synchronous flows.

## Documentation Reference

| Task | Link |
|------|------|
| Overview | https://clerk.com/docs/guides/development/webhooks/overview |
| Sync to database | https://clerk.com/docs/guides/development/webhooks/syncing |
| Debugging | https://clerk.com/docs/guides/development/webhooks/debugging |
| Event catalog | https://dashboard.clerk.com/~/webhooks (Event Catalog tab) |

## Quick Start

1. Create endpoint at `app/api/webhooks/route.ts`
2. Use `verifyWebhook(req)` from `@clerk/nextjs/webhooks`
3. Dashboard → Webhooks → Add Endpoint
4. Set `CLERK_WEBHOOK_SIGNING_SECRET` in env
5. Make route public (not protected by middleware)

## Supported Events

**User Events**
- `user.created` - New user registers or created via API
- `user.updated` - User info changes
- `user.deleted` - User deletes account

**Organization Events**
- `organization.created` - New org created
- `organization.updated` - Org info changes
- `organization.deleted` - Org deleted
- `organizationDomain.created` - Domain verified
- `organizationDomain.updated` - Domain changes
- `organizationDomain.deleted` - Domain removed
- `organizationInvitation.created` - Invitation sent
- `organizationInvitation.accepted` - Invitation accepted
- `organizationInvitation.revoked` - Invitation revoked
- `organizationMembership.created` - User joined org
- `organizationMembership.updated` - Member role changed
- `organizationMembership.deleted` - User removed from org

**Roles & Permissions**
- `role.created` - Custom role created
- `role.updated` - Role updated
- `role.deleted` - Role deleted
- `permission.created` - Permission created
- `permission.updated` - Permission updated
- `permission.deleted` - Permission deleted

**Session Events**
- `session.created` - Session started
- `session.updated` - Session activity
- `session.ended` - Session ended
- `session.removed` - Session revoked
- `session.revoked` - Session manually revoked
- `session.pending` - Session pending activation

**Communication Events**
- `email.created` - Email sent
- `sms.created` - SMS sent

**Other Events**
- `invitation.created` - General invitation sent
- `invitation.accepted` - Invitation accepted
- `invitation.revoked` - Invitation revoked
- `waitlistEntry.created` - User added to waitlist
- `waitlistEntry.updated` - Waitlist status changed

For full event details and payload structures, see Dashboard → Webhooks → Event Catalog

## When to Sync

**Do sync when:**
- Need other users' data (social features, profiles)
- Storing extra custom fields (birthday, country, bio)
- Building notifications or integrations

**Don't sync when:**
- Only need current user data (use session token)
- No custom fields (Clerk has everything)
- Need immediate access (webhooks are eventual consistency)

## Key Patterns

### Make Route Public

Webhooks come unsigned. Route must be public:

Ensure `clerkMiddleware()` doesn't protect `/api/webhooks(.*)` path.

### Verify Webhook

Use correct import and single parameter:

```typescript
import { verifyWebhook } from '@clerk/nextjs/webhooks'
const evt = await verifyWebhook(req)  // Pass request directly
```

### Type-Safe Events

Narrow to specific event:

```typescript
if (evt.type === 'user.created') {
  // TypeScript knows evt.data structure
}
```

### Handle All Three Events

Don't only listen to `user.created`. Also handle `user.updated` and `user.deleted`.

### Queue Async Work

Return 200 immediately, queue long operations:

```typescript
await queue.enqueue('process-webhook', evt)
return new Response('Received', { status: 200 })
```

## Webhook Reliability

**Retries**: Svix retries failed webhooks for up to 3 days. Return 2xx to succeed, 4xx/5xx to retry.

**Replay**: Failed webhooks can be replayed from Dashboard.

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Verification fails | Wrong import or usage | Use `@clerk/nextjs/webhooks`, pass `req` directly |
| Route not found (404) | Wrong path | Use `/api/webhooks` |
| Not authorized (401) | Route is protected | Make route public |
| No data in DB | Async job pending | Wait/check logs |
| Duplicate entries | Only handling `user.created` | Also handle `user.updated` |
| Timeouts | Handler too slow | Queue async work |

## Testing & Deployment

**Local**: Use ngrok to tunnel `localhost:3000` to internet. Add ngrok URL to Dashboard endpoint.

**Production**: Update webhook endpoint URL to production domain. Copy signing secret to production env vars.
