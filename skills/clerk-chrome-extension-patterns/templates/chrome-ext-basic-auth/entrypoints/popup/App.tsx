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
  throw new Error('Please add the WXT_CLERK_PUBLISHABLE_KEY to the .env.development file')
}

export default function App() {
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl={POPUP_URL}
      signInFallbackRedirectUrl={POPUP_URL}
      signUpFallbackRedirectUrl={POPUP_URL}
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
