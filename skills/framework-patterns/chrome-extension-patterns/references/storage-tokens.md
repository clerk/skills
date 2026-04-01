# Storage Tokens (MEDIUM)

## tokenCache Prop

`ClerkProvider` accepts a `tokenCache` prop to customize where Clerk stores its tokens. Use `chrome.storage.local` for persistence across popup closes:

```tsx
import { ClerkProvider } from '@clerk/chrome-extension'

const tokenCache = {
  async getToken(key: string) {
    const result = await chrome.storage.local.get(key)
    return result[key] ?? null
  },
  async saveToken(key: string, token: string) {
    await chrome.storage.local.set({ [key]: token })
  },
  async clearToken(key: string) {
    await chrome.storage.local.remove(key)
  },
}

function IndexPopup() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      {/* ... */}
    </ClerkProvider>
  )
}
```

## Storage Types

| Storage | Scope | Persistence |
|---------|-------|-------------|
| `chrome.storage.local` | Device | Until cleared or uninstalled |
| `chrome.storage.sync` | All devices (via Google account) | Synced, size-limited (8KB total) |
| `chrome.storage.session` | Session | Cleared when browser closes |

For auth tokens, use `chrome.storage.session` (cleared on browser close = better security) or `chrome.storage.local` (survives browser restarts).

## Why Not localStorage

Service workers and background scripts cannot access `localStorage`. Only use `localStorage` in popup/options pages (they have a DOM context) but prefer `chrome.storage` for consistency.

## Stable CRX ID for Persistent Auth

Without a stable CRX ID, the extension gets a new URL on each development reload, invalidating stored tokens.

Generate a stable key:
```bash
openssl genrsa -out key.pem 2048
openssl rsa -in key.pem -pubout -out public.pem
```

Add to `.env.chrome`:
```
CRX_PUBLIC_KEY=<base64-encoded-public-key>
```

Update `package.json`:
```json
{
  "key": "env:CRX_PUBLIC_KEY"
}
```

Add the resulting `chrome-extension://STABLE_CRX_ID` to Clerk Dashboard > Allowed Origins.

[Docs](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
