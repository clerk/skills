# syncHost -- Sync Auth with Web App

## When to Use

Use `syncHost` when you need:
- OAuth (Google, GitHub, etc.)
- SAML
- Email magic links
- The extension to reflect auth state from your web app without the user signing in again

Without `syncHost`, the extension popup can only do email/password, OTP, and passkeys.

## How It Works

The extension reads Clerk's session cookie from your web app's domain using `host_permissions`. The `syncHost` prop tells `ClerkProvider` which domain to sync from.

## Step 1 -- Environment Variables

Use separate files for dev vs prod. WXT loads `.env.development` for `wxt` (dev) and `.env.production` for `wxt build` / `wxt zip`. Only variables prefixed with `WXT_` (or `VITE_`) reach extension code.

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

The production value of `WXT_CLERK_SYNC_HOST` is the domain your Clerk Frontend API runs on (e.g., `https://clerk.your-domain.com`), not your app's main domain.

## Step 2 -- ClerkProvider with syncHost

```tsx
import { ClerkProvider } from '@clerk/chrome-extension'
import { Outlet, useNavigate } from 'react-router'

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY
const SYNC_HOST = import.meta.env.WXT_CLERK_SYNC_HOST

if (!PUBLISHABLE_KEY || !SYNC_HOST) {
  throw new Error('Missing WXT_CLERK_PUBLISHABLE_KEY or WXT_CLERK_SYNC_HOST')
}

export function RootLayout() {
  const navigate = useNavigate()

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      syncHost={SYNC_HOST}
      afterSignOutUrl="/"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
    >
      <Outlet />
    </ClerkProvider>
  )
}
```

## Step 3 -- Manifest host_permissions

In `wxt.config.ts`, configure `host_permissions` to grant the extension access to the sync host domain:

```ts
import { defineConfig } from 'wxt'

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: () => ({
    key: import.meta.env.WXT_CRX_PUBLIC_KEY,
    permissions: ['cookies', 'storage'],
    host_permissions: [
      `${import.meta.env.WXT_CLERK_SYNC_HOST}/*`,
      `${import.meta.env.WXT_CLERK_FRONTEND_API}/*`,
    ],
  }),
})
```

Use the function form `manifest: () => ({ ... })`. WXT loads `.env` files after it evaluates the config file, so the object form reads `undefined`. In dev this resolves to `http://localhost/*`.

## Step 4 -- Register Extension ID in Clerk

Clerk must explicitly allow requests from the extension's origin. Run this once per environment:

```bash
curl -X PATCH https://api.clerk.com/v1/instance \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-type: application/json" \
  -d '{"allowed_origins": ["chrome-extension://YOUR_EXTENSION_ID"]}'
```

Replace `YOUR_SECRET_KEY` with your Clerk Secret Key (`sk_test_...` or `sk_live_...`) and `YOUR_EXTENSION_ID` with your stable CRX ID.

If your extension ID changes (unstable key), you must re-run this command. Configure a stable CRX ID to avoid repeating this step.

## Hide Unsupported Auth Methods in Popup

When using `syncHost`, your web app may have OAuth enabled but the popup itself can't do OAuth flows. Hide those buttons in the popup:

```tsx
import { SignIn, SignUp } from '@clerk/chrome-extension'

function SignInPage() {
  return (
    <SignIn
      appearance={{
        elements: {
          socialButtonsRoot: { display: 'none' },
          dividerRow: { display: 'none' },
        },
      }}
    />
  )
}

function SignUpPage() {
  return (
    <SignUp
      appearance={{
        elements: {
          socialButtonsRoot: { display: 'none' },
          dividerRow: { display: 'none' },
        },
      }}
    />
  )
}
```

This way the popup shows only the methods it supports (email/password, OTP) while the web app exposes all methods including OAuth.

## Side Panel Limitation

`syncHost` does not fully support side panels. If a user signs in via the web app, the side panel will not automatically update its auth state. The user must close and reopen the side panel to reflect the new auth status. This is a known limitation of the SDK.

## Troubleshooting: "Unable to authenticate this browser for your development instance"

In development, the extension reads the dev browser cookie (`__clerk_db_jwt`) that Clerk sets on `localhost` when your web app loads. If that cookie is missing or belongs to a different Clerk app, signing in to the extension fails with this error.

1. Open your web app (for example, `http://localhost:5173`) in the same browser as the extension, then reopen the extension and try again.
2. If the error persists, another Clerk app on `localhost` may have overwritten the cookie, because cookies are shared across all `localhost` ports. In DevTools, go to **Application** > **Cookies** > `http://localhost`, delete every cookie whose name starts with `__clerk` or `__client`, reload your web app, then reopen the extension.

## Docs

[Sync auth status guide](https://clerk.com/docs/guides/sessions/sync-host)
