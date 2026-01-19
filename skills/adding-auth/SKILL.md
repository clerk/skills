---
name: adding-auth
description: Add Clerk authentication to any project. Use when setting up Clerk, adding auth to a new app, or integrating Clerk with Next.js, Express, Remix, React, or other frameworks.
license: MIT
metadata:
  author: clerk
  version: "1.1.0"
---

# Adding Authentication with Clerk

Add Clerk to any project. Detects framework and provides setup.

## Quick Setup (Automated)

| Framework | Script |
|-----------|--------|
| Next.js | `scripts/setup-nextjs.sh` |
| Express | `scripts/setup-express.sh` |
| Remix | `scripts/setup-remix.sh` |
| React SPA | `scripts/setup-react.sh` |

Run the script for your framework, then get keys from [dashboard.clerk.com](https://dashboard.clerk.com/last-active?path=api-keys).

## Framework Detection

Check `package.json` to detect:

| Dependency | Framework | Template |
|------------|-----------|----------|
| `next` | Next.js | `templates/nextjs/` |
| `express` | Express | Use script |
| `@remix-run/react` | Remix | Use script |
| `react` (no framework) | React SPA | Use script |

## Manual Setup

For Next.js, copy from `templates/nextjs/`:

- `middleware/basic.ts` - Route protection
- `layout.tsx` - ClerkProvider wrapper
- `components/AuthButtons.tsx` - Sign in/out UI

## Environment Variables

```bash
# Required
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Optional (webhooks)
CLERK_WEBHOOK_SECRET=whsec_xxx
```

## See Also

- `gotchas.md` - Common setup pitfalls and security issues
- `customizing-auth-ui/` - Custom sign-in/sign-up forms
- `syncing-users/` - Sync users to your database
- `managing-orgs/` - B2B multi-tenant apps
- `testing-auth/` - E2E test setup
- `nextjs-patterns/` - Advanced Next.js patterns

## Documentation

- [Next.js Quickstart](https://clerk.com/docs/quickstarts/nextjs)
- [Express Quickstart](https://clerk.com/docs/quickstarts/express)
- [React Quickstart](https://clerk.com/docs/quickstarts/react)
- [Remix Quickstart](https://clerk.com/docs/quickstarts/remix)
