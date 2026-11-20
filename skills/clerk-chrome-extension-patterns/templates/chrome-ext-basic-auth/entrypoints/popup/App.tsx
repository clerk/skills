import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from '@clerk/chrome-extension'

const PUBLISHABLE_KEY = import.meta.env.WXT_CLERK_PUBLISHABLE_KEY
const POPUP_URL = browser.runtime.getURL('/popup.html')

if (!PUBLISHABLE_KEY) {
  throw new Error(`Add WXT_CLERK_PUBLISHABLE_KEY to your .env.${import.meta.env.MODE} file`)
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={POPUP_URL}
      signInFallbackRedirectUrl={POPUP_URL}
      signUpFallbackRedirectUrl={POPUP_URL}
      // Social buttons can't finish in a popup. OAuth and SAML go through `syncHost`.
      appearance={{
        elements: {
          socialButtonsRoot: { display: 'none' },
          dividerRow: { display: 'none' },
        },
      }}
    >
      <header>
        <Show when="signed-out">
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
    </ClerkProvider>
  )
}
