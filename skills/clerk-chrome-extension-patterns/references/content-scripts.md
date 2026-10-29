# Content Scripts

## Constraint

Content scripts run in an isolated JavaScript world injected into web pages. They cannot:
- Use Clerk React hooks
- Call Clerk APIs directly (Clerk enforces strict origin restrictions -- content scripts could run on any domain)
- Access the extension's React context

Use message passing to request auth state from the background service worker.

## Pattern: Request Token from Background

`entrypoints/content.ts` (WXT):
```typescript
export default defineContentScript({
  matches: ['https://specific-site.com/*'],
  async main() {
    const token = await getToken()

    if (!token) {
      console.log('User not signed in, skipping injection')
      return
    }

    const overlay = document.createElement('div')
    overlay.id = 'my-extension-overlay'
    document.body.appendChild(overlay)
  },
})

async function getToken(): Promise<string | null> {
  const response = await browser.runtime.sendMessage({ type: 'GET_TOKEN' })
  return response?.token ?? null
}
```

`entrypoints/background.ts`:
```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

export default defineBackground(() => {
  const publishableKey = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY

  async function getToken(): Promise<string | null> {
    const clerk = await createClerkClient({ publishableKey, background: true })
    if (!clerk.session) return null
    return await clerk.session.getToken()
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_TOKEN') {
      getToken()
        .then((token) => sendResponse({ token }))
        .catch(() => sendResponse({ token: null }))
      return true
    }
  })
})
```

WXT imports content scripts and the background in Node.js at build time. Keep DOM access, listeners, and env checks inside `main()` / the `defineBackground()` callback. Function declarations (like `getToken` above) can live at the top level because they don't run until called.

## Pattern: Authenticated Fetch from Content Script

```typescript
// called from main() in entrypoints/content.ts
async function fetchUserData() {
  const token = await getToken()
  if (!token) return null

  const res = await fetch('https://api.yourapp.com/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return res.json()
}
```

## Content Script Registration (WXT)

WXT adds every content script entrypoint to the manifest for you. Set `matches` (and options such as `runAt` or `world`) in `defineContentScript()` -- don't edit the manifest.

For multiple content scripts with different match patterns, create one entrypoint per script:

```
entrypoints/
  github.content.ts     # defineContentScript({ matches: ['https://github.com/*'], ... })
  youtube.content.ts    # defineContentScript({ matches: ['https://www.youtube.com/*'], ... })
```

WXT's React template ships an example `entrypoints/content.ts` that matches `*://*.google.com/*`. Delete it if you don't need it -- otherwise your extension requests access to Google sites.

## Manifest Permissions

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    permissions: ['storage'],
  },
})
```

A content script's `matches` already grants it access to those pages. Add `host_permissions` only for hosts the extension calls from other contexts (for example, your sync host and Frontend API URL).

## Why Clerk Can't Be Used Directly in Content Scripts

Clerk enforces strict allowed origins for API requests. A content script can be injected into any domain (e.g., `https://github.com`, `https://google.com`). There is no way to add all possible domains to Clerk's allowed origins, so direct Clerk usage in content scripts is blocked by design.

[Docs](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
