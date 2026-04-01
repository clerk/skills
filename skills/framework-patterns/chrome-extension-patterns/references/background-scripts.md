# Background Scripts (HIGH)

## Constraint

Chrome Extension service workers (background scripts) run in an isolated context — no DOM, no React, no `ClerkProvider`. Clerk's React hooks are NOT available.

## Token via Message Passing

The popup (which has ClerkProvider) sends the token to the background:

**popup.tsx** (sender):
```tsx
import { useAuth } from '@clerk/chrome-extension'

function PopupWithBackground() {
  const { getToken } = useAuth()

  async function sendTokenToBackground() {
    const token = await getToken()
    chrome.runtime.sendMessage({ type: 'CLERK_TOKEN', token })
  }

  return <button onClick={sendTokenToBackground}>Sync</button>
}
```

**background.ts** (receiver):
```typescript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'CLERK_TOKEN' && message.token) {
    // Cache token for API calls
    chrome.storage.session.set({ clerkToken: message.token })
  }
})
```

## Making Authenticated Requests from Background

```typescript
async function fetchUserData() {
  const { clerkToken } = await chrome.storage.session.get('clerkToken')

  if (!clerkToken) {
    console.warn('No auth token available')
    return null
  }

  const res = await fetch('https://api.example.com/me', {
    headers: { Authorization: `Bearer ${clerkToken}` },
  })

  return res.json()
}
```

## Token Expiry

Clerk session tokens expire every 60 seconds by default. The popup should refresh and re-send the token when the background makes a request:

```typescript
// background.ts — request fresh token from popup
async function getAuthToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_TOKEN' }, (response) => {
      resolve(response?.token ?? null)
    })
  })
}
```

```tsx
// popup.tsx — respond to token requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_TOKEN') {
    getToken().then((token) => sendResponse({ token }))
    return true
  }
})
```

[Docs](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
