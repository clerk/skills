---
name: clerk-chrome-extension-patterns
description: 'Chrome Extension auth patterns with @clerk/chrome-extension and Plasmo
  - popup auth, background scripts, content scripts, CRX ID navigation. Triggers on:
  Chrome extension auth, Plasmo clerk, popup sign-in, background script token, extension
  manifest permissions.'
license: MIT
allowed-tools: WebFetch
metadata:
  author: clerk
  version: 1.0.0
---

# Chrome Extension Patterns

## What Do You Need?

| Task | Reference |
|------|-----------|
| Setup ClerkProvider in popup | references/popup-auth.md |
| Token access in background service worker | references/background-scripts.md |
| Auth checks in content scripts | references/content-scripts.md |
| Persist auth with chrome.storage.sync | references/storage-tokens.md |

## Impact Levels

- **CRITICAL** - Breaking bugs, security holes
- **HIGH** - Common mistakes
- **MEDIUM** - Optimization

## References

| Reference | Impact |
|-----------|--------|
| `references/popup-auth.md` | CRITICAL - ClerkProvider CRX ID setup |
| `references/background-scripts.md` | HIGH - Service worker token access |
| `references/content-scripts.md` | HIGH - Isolated world messaging |
| `references/storage-tokens.md` | MEDIUM - Sync storage persistence |

## Prerequisites

Enable **Native API** in the Clerk Dashboard under Native applications. This is required for all native/extension integrations.

## Setup (Plasmo)

```
pnpm create plasmo --with-tailwindcss --with-src my-extension
pnpm add @clerk/chrome-extension
```

`.env.development`:
```
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_FRONTEND_API=https://your-frontend-api.clerk.accounts.dev
```

## Mental Model

Chrome Extensions use `chrome-extension://CRX_ID/popup.html` URLs — NOT `http://localhost`. `ClerkProvider` must be configured with the CRX URL for redirects to work.

`chrome.runtime.getURL('.')` returns the extension's base URL dynamically.

Plasmo uses `PLASMO_PUBLIC_` prefix for public env vars (equivalent to `NEXT_PUBLIC_`).

## Minimal Pattern (popup.tsx)

```tsx
import { ClerkProvider, Show, SignInButton, UserButton } from '@clerk/chrome-extension'

const PUBLISHABLE_KEY = process.env.PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY
const EXTENSION_URL = chrome.runtime.getURL('.')

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY')
}

function IndexPopup() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={`${EXTENSION_URL}/popup.html`}
      signInFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
      signUpFallbackRedirectUrl={`${EXTENSION_URL}/popup.html`}
    >
      <Show when="signed-out">
        <SignInButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </ClerkProvider>
  )
}

export default IndexPopup
```

## CRX ID — Required for Production

Without a stable CRX ID, every build generates a different extension URL, breaking Clerk's allowed origins.

1. Generate a key pair: `openssl genrsa -out key.pem 2048`
2. Extract public key and base64 encode it
3. Add to `.env.chrome`: `CRX_PUBLIC_KEY=<base64>`
4. Update `package.json`: `"key": "env:CRX_PUBLIC_KEY"`

Add the production `chrome-extension://YOUR_CRX_ID` URL to Clerk Dashboard allowed origins.

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirect loop on sign-in | Missing CRX URL in ClerkProvider props | Set `afterSignOutUrl`, `signInFallbackRedirectUrl` |
| Auth broken after reinstall | Unstable CRX ID | Configure stable key via `.env.chrome` |
| Background script can't access token | No Clerk context in service worker | Use message passing from popup |
| Content script auth fails | Content scripts run in isolated world | Send message to background, receive token |
| `PLASMO_PUBLIC_` var undefined | Wrong env file | Use `.env.development` not `.env` |

## See Also

- `references/popup-auth.md`
- `references/background-scripts.md`

## Docs

[Chrome Extension SDK](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
