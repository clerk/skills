# Popup Auth (CRITICAL)

## ClerkProvider for Popup

Chrome Extensions use `chrome-extension://CRX_ID/popup.html` URLs. All redirect props must use the CRX URL:

```tsx
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/chrome-extension'

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
        <SignUpButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </ClerkProvider>
  )
}

export default IndexPopup
```

Use `mode="modal"` for `SignInButton` in popups — navigating to a separate page breaks the popup flow.

## Environment Variables

`.env.development`:
```
PLASMO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_FRONTEND_API=https://your-app.clerk.accounts.dev
```

Plasmo uses `PLASMO_PUBLIC_` as the public env prefix (equivalent to `NEXT_PUBLIC_`).

## Hooks in Popup

All Clerk React hooks work in the popup since it has `ClerkProvider`:

```tsx
import { useUser, useAuth } from '@clerk/chrome-extension'

function UserInfo() {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  if (!isLoaded) return <p>Loading...</p>
  if (!isSignedIn) return <p>Not signed in</p>

  return <p>{user.firstName}</p>
}
```

## Native API Requirement

The Clerk Dashboard **Native API** must be enabled for Chrome Extensions. Navigate to: Dashboard > Native applications > Enable Native API.

[Docs](https://clerk.com/docs/chrome-extension/getting-started/quickstart)
