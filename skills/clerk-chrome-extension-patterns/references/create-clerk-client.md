# createClerkClient() -- Vanilla JS and Service Workers

## When to Use

Use `createClerkClient()` when:
- Your extension doesn't use React
- You need Clerk in a background service worker
- You need Clerk in a content script context (via message passing from background)
- You want to keep sessions fresh without a visible popup

Import from `@clerk/chrome-extension/client`, NOT from `@clerk/chrome-extension`.

## Background Service Worker

The key option is `background: true`. This tells Clerk to refresh the session token continuously, even when no popup or side panel is open. Without it, tokens expire after 60 seconds of the UI being closed.

`entrypoints/background.ts` (WXT):
```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

export default defineBackground(() => {
  const publishableKey = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error('Missing WXT_CLERK_PUBLISHABLE_KEY')
  }

  async function getToken(): Promise<string | null> {
    const clerk = await createClerkClient({
      publishableKey,
      background: true,
    })

    if (!clerk.session) return null

    return await clerk.session.getToken()
  }

  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    getToken()
      .then((token) => sendResponse({ token }))
      .catch((error) => {
        console.error('[Background service worker] Error:', JSON.stringify(error))
        sendResponse({ token: null })
      })
    return true
  })
})
```

WXT imports `entrypoints/background.ts` in Node.js at build time, so all runtime code (the env check, listeners) must be inside the `defineBackground()` callback. Imports at the top of the file are fine. `defineBackground` and `browser` are auto-imported by WXT.

The listener MUST `return true` to keep the message channel open for the async `sendResponse` call.

## Requesting the Token from a Tab or Content Script

```typescript
// entrypoints/<name>/main.tsx (an unlisted page) or a content script
async function getTokenFromBackground(): Promise<string | null> {
  const response = await browser.runtime.sendMessage({ type: 'GET_TOKEN' })
  return response?.token ?? null
}

async function makeAuthenticatedRequest() {
  const token = await getTokenFromBackground()
  if (!token) {
    console.warn('User not signed in')
    return
  }

  const res = await fetch('https://api.example.com/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return res.json()
}
```

## Vanilla JS Popup (no React)

For popups or side panels that use plain TypeScript instead of React. This example matches the framework-free [JavaScript quickstart](https://clerk.com/docs/getting-started/quickstart/chrome-extension-js), which bundles with esbuild and injects `process.env.CLERK_PUBLISHABLE_KEY` at build time. In a WXT project, use `import.meta.env.WXT_CLERK_PUBLISHABLE_KEY` and `browser.runtime.getURL('/popup.html')` instead.

`src/popup.ts`:
```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

const publishableKey = process.env.CLERK_PUBLISHABLE_KEY
const EXTENSION_URL = chrome.runtime.getURL('.')
const POPUP_URL = `${EXTENSION_URL}popup.html`

const clerk = createClerkClient({ publishableKey })
const contentEl = document.getElementById('content') as HTMLDivElement

function render() {
  const email = clerk.user?.primaryEmailAddress?.emailAddress
  contentEl.textContent = email ?? 'Not signed in'
}

clerk.load({
  afterSignOutUrl: POPUP_URL,
  signInForceRedirectUrl: POPUP_URL,
  signUpForceRedirectUrl: POPUP_URL,
  allowedRedirectProtocols: ['chrome-extension:'],
}).then(() => {
  clerk.addListener(render)
  render()
})
```

`allowedRedirectProtocols: ['chrome-extension:']` is required to allow redirects to `chrome-extension://` URLs.

## createClerkClient() Options

| Option | Type | Description |
|--------|------|-------------|
| `publishableKey` | `string` | Required. Your Clerk publishable key. |
| `background` | `boolean` | Set `true` in service workers to keep sessions fresh. |
| `syncHost` | `string` | The web app domain to sync auth from (headless extensions). |

## Making Authenticated API Calls from Background

Call this from inside `defineBackground()`:

```typescript
async function callMyAPI() {
  const clerk = await createClerkClient({ publishableKey, background: true })

  if (!clerk.session) return

  const token = await clerk.session.getToken()

  const res = await fetch('https://api.yourapp.com/data', {
    headers: { Authorization: `Bearer ${token}` },
  })

  return res.json()
}
```

## Docs

[createClerkClient() reference](https://clerk.com/docs/reference/chrome-extension/create-clerk-client)
