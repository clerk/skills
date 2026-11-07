---
name: clerk-chrome-extension-patterns
description: 'Chrome Extension auth with @clerk/chrome-extension -- popup/sidepanel
  setup, syncHost for OAuth/SAML via web app, createClerkClient for service workers
  and headless extensions, stable CRX ID. Triggers on: Chrome extension auth, WXT
  clerk, Plasmo clerk migration, popup sign-in, syncHost, background service worker
  token, createClerkClient, headless extension.'
license: MIT
allowed-tools: WebFetch
compatibility: Requires WXT_CLERK_PUBLISHABLE_KEY and WXT_CLERK_FRONTEND_API (WXT exposes only WXT_- or VITE_-prefixed env vars to extension code).
metadata:
  author: clerk
  version: 3.0.0
  references:
  - references/sync-host.md
  - references/create-clerk-client.md
  - references/content-scripts.md
  - references/headless-extension.md
---

# Chrome Extension Patterns

## CRITICAL RULES

1. OAuth (Google, GitHub, etc.) and SAML are NOT supported in popups or side panels -- use `syncHost` to delegate auth to your web app
2. Email links (magic links) don't work in popups -- the popup closes when the user clicks outside, resetting sign-in state
3. Side panels don't auto-refresh auth state -- users must close and reopen the side panel after signing in via the web app
4. Service workers and content scripts have NO access to Clerk React hooks -- use `createClerkClient()` or message passing
5. Extension URLs use `chrome-extension://` not `http://` -- build redirect URLs with `browser.runtime.getURL('/popup.html')`
6. Without a stable CRX ID, every rebuild breaks auth -- configure `key` in the manifest BEFORE deploying
7. Content scripts cannot use Clerk directly due to origin restrictions -- Clerk enforces strict allowed origins
8. Bot protection must be DISABLED in Clerk Dashboard -- Cloudflare bot detection is not supported in extension environments
9. WXT imports background, content, and unlisted scripts in Node.js at build time -- all runtime code (listeners, env checks, DOM access) goes inside `defineBackground()` / `defineContentScript({ main })`
10. Use the function form `manifest: () => ({ ... })` in `wxt.config.ts` whenever the manifest reads `import.meta.env` -- WXT loads `.env` files after evaluating the config

## Authentication Options

| Method | Popup | Side Panel | syncHost (with web app) |
|--------|-------|------------|------------------------|
| Email + OTP | Yes | Yes | Yes |
| Email + Link | No | No | Yes |
| Email + Password | Yes | Yes | Yes |
| Username + Password | Yes | Yes | Yes |
| SMS + OTP | Yes | Yes | Yes |
| OAuth (Google, GitHub, etc.) | **NO** | **NO** | **YES** |
| SAML | **NO** | **NO** | **YES** |
| Passkeys | Yes | Yes | Yes |
| Google One Tap | No | No | Yes |
| Web3 | No | No | Yes |

## Quick Start (WXT)

[WXT](https://wxt.dev) is a Vite-based extension framework. It generates `manifest.json` from `wxt.config.ts` and opens Chrome with the extension installed during `npm run dev`.

```bash
mkdir my-extension
cd my-extension
npx wxt@latest init . --template react --pm npm
npm install
npm install @clerk/chrome-extension
rm entrypoints/content.ts entrypoints/popup/App.css assets/react.svg public/wxt.svg
```

- `wxt init .` requires an empty directory.
- Delete `entrypoints/content.ts`: the template's content script runs on `*://*.google.com/*` and adds a permission warning.
- pnpm 11 stops the install with `ERR_PNPM_IGNORED_BUILDS` for `browser-tabs-lock` and `core-js`. Neither needs its build script: `pnpm approve-builds '!browser-tabs-lock' '!core-js'`.

Enable **Native API** in Clerk Dashboard under Native applications. Required for all extension integrations.

`.env.development` (WXT loads it for `npm run dev`; `.env.production` for `npm run build` / `npm run zip`):
```
WXT_CLERK_PUBLISHABLE_KEY=pk_test_...
WXT_CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
```

`entrypoints/popup/App.tsx` (the template's `main.tsx` already mounts it):
```tsx
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/chrome-extension'

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY
const POPUP_URL = browser.runtime.getURL('/popup.html')

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing WXT_CLERK_PUBLISHABLE_KEY')
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={POPUP_URL}
      signInFallbackRedirectUrl={POPUP_URL}
      signUpFallbackRedirectUrl={POPUP_URL}
    >
      <Show when="signed-out">
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </ClerkProvider>
  )
}
```

`wxt.config.ts`:
```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: () => ({
    key: import.meta.env.WXT_CRX_PUBLIC_KEY,
    permissions: ['cookies', 'storage'],
    host_permissions: ['http://localhost/*', `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`],
  }),
})
```

- Use `mode="modal"` for `SignInButton` -- navigating to a separate page breaks the popup flow.
- Give the popup room for Clerk's modal (e.g., `body { width: 800px; height: 600px; }` in `entrypoints/popup/style.css`).
- The popup's `<title>` in `entrypoints/popup/index.html` becomes the toolbar tooltip (`action.default_title`).
- `browser` and `defineBackground`/`defineContentScript` are auto-imported by WXT. In Chrome, `browser` is the `chrome` object.

## syncHost -- Sync Auth with Web App

Use this when you need OAuth, SAML, or want the extension to reflect sign-in from your web app.

**How it works**: The extension reads the Clerk session cookie from your web app's domain via `host_permissions`.

**Step 1 -- Environment variables:**

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

**Step 2 -- Add `syncHost` prop:**

```tsx
const SYNC_HOST = import.meta.env.WXT_CLERK_SYNC_HOST

<ClerkProvider
  publishableKey={PUBLISHABLE_KEY}
  syncHost={SYNC_HOST}
  afterSignOutUrl="/"
  routerPush={(to) => navigate(to)}
  routerReplace={(to) => navigate(to, { replace: true })}
>
```

**Step 3 -- Configure `host_permissions` in `wxt.config.ts`:**

```ts
manifest: () => ({
  key: import.meta.env.WXT_CRX_PUBLIC_KEY,
  permissions: ['cookies', 'storage'],
  host_permissions: [
    `${import.meta.env.WXT_CLERK_SYNC_HOST}/*`,
    `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`,
  ],
}),
```

**Step 4 -- Add extension ID to web app's allowed origins via Clerk API:**

```bash
curl -X PATCH https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-type: application/json" \
  -d '{"allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID"]}'
```

**Hide unsupported auth methods in popup when using syncHost:**

```tsx
<SignIn
  appearance={{
    elements: {
      socialButtonsRoot: { display: 'none' },
      dividerRow: { display: 'none' },
    },
  }}
/>
```

**In development, open the web app before signing in to the extension.** The extension uses the dev browser cookie Clerk sets on `localhost` when the web app loads. See the "Unable to authenticate this browser" row in Common Pitfalls.

Full guide: `references/sync-host.md`

## createClerkClient() for Vanilla JS / Service Workers

Import from `@clerk/chrome-extension/client` (not `@clerk/chrome-extension`).

**Background service worker** (`entrypoints/background.ts`):

```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

export default defineBackground(() => {
  const publishableKey = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY

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
        console.error('[Background] Error:', JSON.stringify(error))
        sendResponse({ token: null })
      })
    return true
  })
})
```

The `background: true` flag keeps sessions fresh even when popup/sidepanel is closed. Without it, tokens expire after 60 seconds.

**Popup with vanilla JS, no framework** (`src/popup.ts`, bundled with esbuild as in the [JavaScript quickstart](https://clerk.com/docs/getting-started/quickstart/chrome-extension-js)):

```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

const EXTENSION_URL = chrome.runtime.getURL('.')
const POPUP_URL = `${EXTENSION_URL}popup.html`

const clerk = createClerkClient({ publishableKey })

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

Full guide: `references/create-clerk-client.md`

## Headless Extension (no popup, no side panel)

For extensions that run entirely in the background and sync with a web app.

Uses `syncHost` + `createClerkClient` with `background: true` to read auth state from the web app's cookies.

```typescript
import { createClerkClient } from '@clerk/chrome-extension/client'

export default defineBackground(() => {
  const publishableKey = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY
  const syncHost = import.meta.env.WXT_CLERK_SYNC_HOST

  async function getAuthenticatedUser() {
    const clerk = await createClerkClient({
      publishableKey,
      syncHost,
      background: true,
    })
    return clerk.user
  }
})
```

Requires `host_permissions` for the sync host domain in `wxt.config.ts`.

Full guide: `references/headless-extension.md`

## Content Scripts

Content scripts run in an isolated JavaScript world injected into web pages. **Clerk cannot be used directly** -- origin restrictions prevent it.

Use message passing to request auth state from the background service worker:

```typescript
// entrypoints/content.ts
export default defineContentScript({
  matches: ['https://specific-site.com/*'],
  async main() {
    const response = await browser.runtime.sendMessage({ type: 'GET_TOKEN' })
    const token: string | null = response?.token ?? null
    if (!token) return
    // use token for authenticated API calls
  },
})
```

Full guide: `references/content-scripts.md`

## Stable CRX ID

Without a pinned key, Chrome derives the CRX ID from a random key at build time. This rotates every rebuild, breaking allowed origins.

Generate a key with `openssl` (on Windows, use Git Bash):

```bash
# Private key -- store securely, add *.pem to .gitignore
openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out key.pem

# Public key (for the manifest)
openssl rsa -in key.pem -pubout -outform DER | openssl base64 -A

# CRX ID (what Chrome will show)
openssl rsa -in key.pem -pubout -outform DER | shasum -a 256 | head -c32 | tr 0-9a-f a-p
```

For an extension already in the Chrome Web Store, use its public key from Developer Dashboard > Package > **View public key** (one line, without the BEGIN/END markers).

**`.env.chrome`** (WXT loads it for every Chrome build, dev and production):
```
WXT_CRX_PUBLIC_KEY=<public key>
```

**`wxt.config.ts`:**
```ts
manifest: () => ({
  key: import.meta.env.WXT_CRX_PUBLIC_KEY,
  permissions: ['cookies', 'storage'],
  host_permissions: ['http://localhost/*', `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`],
}),
```

Add `chrome-extension://YOUR_STABLE_CRX_ID` to Clerk Dashboard > Allowed Origins.

## Session Persistence

The SDK persists the Clerk client token in `chrome.storage.local` by default, so sessions survive popup closes with no setup. To use a different store, pass `storageCache` to `<ClerkProvider>` (or to `createClerkClient({ background: true })` -- without `background: true`, `createClerkClient()` ignores it): an object with `createKey(...keys)`, `get(key)`, `set(key, value)`, and `remove(key)`.

Don't store auth in `localStorage` -- it's scoped to the popup page.

## Migrating from Plasmo

| Plasmo | WXT |
|--------|-----|
| `PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY` via `process.env` | `WXT_CLERK_PUBLISHABLE_KEY` via `import.meta.env` |
| `package.json` `"manifest"` with `$VAR` | `wxt.config.ts` `manifest: () => ({ ... })` with `` `${import.meta.env.WXT_…}` `` |
| `src/popup.tsx`, `src/background/index.ts`, `src/tabs/*` | `entrypoints/popup/`, `entrypoints/background.ts` (`defineBackground`), `entrypoints/<name>/index.html` |
| `chrome.*` | `browser.*` |
| `CRX_PUBLIC_KEY` in `.env.chrome` | `WXT_CRX_PUBLIC_KEY` in `.env.chrome` -- reuse the same public key to keep the same CRX ID |

## Common Pitfalls

| Symptom | Cause | Fix |
|---------|-------|-----|
| Redirect loop on sign-in | Missing CRX URL in ClerkProvider props | Set `afterSignOutUrl`, `signInFallbackRedirectUrl` |
| OAuth button not working | OAuth not supported in popup | Use `syncHost` to delegate to web app |
| Auth state stale after web app sign-in | `syncHost` not configured | Add `syncHost` prop + `host_permissions` |
| Side panel shows signed-out after web sign-in | Known limitation | User must close and reopen the side panel |
| "Unable to authenticate this browser for your development instance" (syncHost, dev) | The `__clerk_db_jwt` cookie on `localhost` doesn't exist until the web app loads, and any Clerk app on any `localhost` port can overwrite it | Open the web app (e.g., `http://localhost:5173`) in the same browser and retry. If it persists, delete the `__clerk*`/`__client*` cookies for `http://localhost` in DevTools, reload the web app, retry |
| Background can't get token after 60s | Session expired, no background refresh | Use `createClerkClient({ background: true })` |
| Content script can't access Clerk | Isolated world + origin restrictions | Use message passing to background service worker |
| Auth breaks after rebuild | CRX ID rotated | Configure stable key via `.env.chrome` + `key` in `wxt.config.ts` |
| `import.meta.env.WXT_…` is undefined | Missing `WXT_` prefix, or wrong file (`.env.development` for dev, `.env.production` for build/zip) | Rename or move the variable; restart `npm run dev` |
| `host_permissions` contains `undefined/*` | Built without `.env.production`, or `manifest` uses the object form | Add production env vars; use `manifest: () => ({ ... })` |
| Build fails with a `browser`/`window`/`document` error | Runtime code outside `defineBackground()` / `defineContentScript({ main })` | Move it inside |
| `wxt init` says "directory is not empty" | `wxt init .` needs an empty directory | Run it in a new, empty directory |
| Extension asks for access to Google sites | Template `entrypoints/content.ts` still present | Delete it |
| Bot protection errors | Cloudflare not supported in extensions | Disable bot protection in Clerk Dashboard |

## Plan Requirements

| Feature | Plan |
|---------|------|
| Basic popup auth (email/password, OTP) | Free |
| Passkeys | Free |
| syncHost | Requires Pro (custom domain) |
| OAuth through syncHost | Pro + OAuth configured on web app |
| SAML through syncHost | Enterprise |
| Bot protection | N/A -- must be disabled for extensions |

## See Also

- `clerk-setup` - Initial Clerk install
- `clerk-custom-ui` - Custom flows & appearance
