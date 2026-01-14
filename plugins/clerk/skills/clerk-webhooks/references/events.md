# Webhook Events Reference

## User Events

| Event | When it fires | Payload |
|-------|---------------|---------|
| `user.created` | New user signs up | Full user object |
| `user.updated` | User profile changes | Full user object |
| `user.deleted` | User account deleted | `{ id, deleted: true }` |

## Organization Events

| Event | When it fires | Payload |
|-------|---------------|---------|
| `organization.created` | New organization created | Full org object |
| `organization.updated` | Organization settings changed | Full org object |
| `organization.deleted` | Organization deleted | `{ id, deleted: true }` |

## Membership Events

| Event | When it fires | Payload |
|-------|---------------|---------|
| `organizationMembership.created` | User joins organization | Membership object |
| `organizationMembership.updated` | Member role changed | Membership object |
| `organizationMembership.deleted` | User removed from organization | Membership object |

## Session Events

| Event | When it fires | Payload |
|-------|---------------|---------|
| `session.created` | New session started | Session object |
| `session.ended` | Session ended | Session object |
| `session.removed` | Session revoked | Session object |

## Testing Locally

### ngrok (Recommended)

```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Expose localhost
ngrok http 3000
```

Add ngrok URL to Clerk Dashboard → Webhooks:
```
https://xxxx.ngrok.io/api/webhooks/clerk
```

### localtunnel

```bash
npx localtunnel --port 3000
```

## Debugging

### Check Clerk Dashboard

1. Go to **Webhooks** → Select your endpoint
2. View **Message Attempts** for delivery status
3. Check **Payload** for actual data sent

### Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| 400 errors | Wrong signing secret | Check `CLERK_WEBHOOK_SIGNING_SECRET` |
| 404 errors | Wrong endpoint URL | Verify path matches your route |
| Timeout | Handler too slow | Return 200 fast, process async |
| Missing events | Events not subscribed | Enable in Dashboard → Webhooks |

## Documentation

- [Webhooks Overview](https://clerk.com/docs/webhooks/overview)
- [Sync Data Guide](https://clerk.com/docs/webhooks/sync-data)
- [Debug Webhooks](https://clerk.com/docs/webhooks/debug)
- [Webhook Events Reference](https://clerk.com/docs/webhooks/webhook-events)
