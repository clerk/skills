# Headless Extension (no popup, no side panel)

## Use Case

An extension that runs entirely in the background -- no UI, no popup, no side panel. It syncs auth state from a companion web app and acts on behalf of the signed-in user automatically.

Examples:
- Auto-fill tools that activate when the user visits certain pages
- Extensions that sync data in the background when the user is signed in on the web app
- Developer tools that call your API without user interaction

## Requirements

- The user signs in via your web app (not the extension)
- The extension reads auth state from the web app's session cookie
- `syncHost` + `createClerkClient({ background: true })` combination

## Background Service Worker

`entrypoints/background.ts` (WXT):
```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

export default defineBackground(() => {
  const publishableKey = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY
  const syncHost = import.meta.env.WXT_CLERK_SYNC_HOST

  if (!publishableKey || !syncHost) {
    throw new Error('Missing WXT_CLERK_PUBLISHABLE_KEY or WXT_CLERK_SYNC_HOST')
  }

  async function getAuthenticatedUser() {
    const clerk = await createClerkClient({
      publishableKey,
      syncHost,
      background: true,
    })

    return clerk.user
  }

  async function getSessionToken(): Promise<string | null> {
    const clerk = await createClerkClient({
      publishableKey,
      syncHost,
      background: true,
    })

    if (!clerk.session) return null

    return await clerk.session.getToken()
  }

  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') return

    const token = await getSessionToken()
    if (!token) return

    await fetch('https://api.yourapp.com/page-visit', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: tab.url }),
    })
  })
})
```

All runtime code (env checks, listeners) goes inside `defineBackground()`, because WXT imports this file in Node.js at build time.

## Environment Variables

`.env.development`:
```
WXT_CLERK_PUBLISHABLE_KEY=pk_test_...
WXT_CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
WXT_CLERK_SYNC_HOST=http://localhost
```

`.env.production`:
```
WXT_CLERK_PUBLISHABLE_KEY=pk_live_...
WXT_CLERK_FRONTEND_API=https://clerk.your-domain.com
WXT_CLERK_SYNC_HOST=https://clerk.your-domain.com
```

## Manifest Configuration

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: () => ({
    key: import.meta.env.WXT_CRX_PUBLIC_KEY,
    permissions: ['cookies', 'storage', 'tabs'],
    host_permissions: [
      `${import.meta.env.WXT_CLERK_SYNC_HOST}/*`,
      `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`,
    ],
  }),
})
```

Use the function form `manifest: () => ({ ... })` so WXT reads the `.env` files before building the manifest. A headless extension has no popup, so leave out `entrypoints/popup/` (and delete the template's popup and `content.ts` if you started from `wxt init`).

`host_permissions` for the sync host domain is what allows the extension to read the Clerk session cookie from the web app.

## Register Extension in Clerk

The extension ID must be in your web app instance's allowed origins:

```bash
curl -X PATCH https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-type: application/json" \
  -d '{"allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID"]}'
```

## Key Difference from Popup + syncHost

In a popup extension with `syncHost`, the user can also sign in directly via the popup (email/password, OTP). In a headless extension, there is no UI at all -- the user MUST sign in via the web app. The extension only reads auth state.

## Debugging

To verify auth state is syncing:

```typescript
const clerk = await createClerkClient({ publishableKey, syncHost, background: true })
console.log('User:', clerk.user?.emailAddresses[0]?.emailAddress ?? 'Not signed in')
console.log('Session:', clerk.session?.id ?? 'No session')
```

If `user` is null despite being signed in on the web app, check:
1. `host_permissions` includes the sync host domain
2. The extension ID is in Clerk's allowed origins
3. The `syncHost` value matches the Clerk Frontend API URL (not the web app's main domain)
4. In development, the web app has been opened at least once in the same browser. Until it loads, the `__clerk_db_jwt` cookie doesn't exist, and signing in fails with "Unable to authenticate this browser for your development instance". See the troubleshooting section in `sync-host.md`.
