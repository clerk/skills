# Recipes: users, orgs, sign-out, backend calls, device features

Post-auth patterns. Hooks below are imported from `@clerk/expo` unless noted; they mirror `@clerk/react`.

> Canonical docs (fetch to re-verify if the installed SDK is newer than 4.x): [Expo SDK reference](https://clerk.com/docs/reference/expo/overview), plus the [`useBiometricCredentials()`](https://clerk.com/docs/reference/expo/native-hooks/use-biometric-credentials) and [passkeys](https://clerk.com/docs/reference/expo/passkeys) pages

## User profile data

```tsx
import { useUser } from '@clerk/expo'

const { user, isLoaded } = useUser()
// user is null until loaded/signed in — always guard
// user.fullName, user.firstName, user.imageUrl, user.primaryEmailAddress?.emailAddress
```

For a full profile management UI on a dev build, prefer the native `UserProfileView` / `UserButton` (prebuilt-components.md) over hand-built screens.

## Sign out

```tsx
import { useClerk } from '@clerk/expo'

const { signOut } = useClerk()
<Pressable onPress={() => signOut()}>...</Pressable>
```

## Organization switching (B2B)

Organizations must be enabled in the dashboard. For deeper org work (roles, invitations, RBAC) load the `clerk-orgs` skill — the hooks are identical in Expo.

```tsx
import { useOrganization, useOrganizationList } from '@clerk/expo'

const { organization } = useOrganization()
const { setActive, userMemberships } = useOrganizationList({
  userMemberships: { infinite: true },
})

// Current: organization?.name ?? 'Personal account'
// Switch: setActive({ organization: membership.organization.id })
// List: userMemberships.data?.map((m) => m.organization) — guard while undefined
```

## Calling your backend

Route guards are client-side only; authorize on the server:

```tsx
import { useAuth } from '@clerk/expo'

const { getToken } = useAuth()
const res = await fetch(`${API_URL}/endpoint`, {
  headers: { Authorization: `Bearer ${await getToken()}` },
})
```

Verify the token server-side with Clerk's backend SDK for your server framework (e.g. `@clerk/backend`'s `verifyToken`, or the framework SDK's `getAuth`). Clerk has no official Expo Router API-routes (`+api.ts`) integration — treat any server code as a normal backend and use `@clerk/backend`.

## Push notifications with user context

Associate the Expo push token with the Clerk user:

```tsx
import { useUser } from '@clerk/expo'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'

export function PushTokenRegistrar() {
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (!isLoaded || !user) return
    ;(async () => {
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== 'granted') return
      const token = (await Notifications.getExpoPushTokenAsync()).data
      await user.update({
        unsafeMetadata: { ...user.unsafeMetadata, expoPushToken: token },
      })
    })()
  }, [isLoaded, user])

  return null
}
```

- `unsafeMetadata` is client-writable; anything that must be trusted belongs in `publicMetadata`, written server-side via the Backend SDK.
- Server send: look up the user with the Backend SDK, read `unsafeMetadata.expoPushToken`, POST to `https://exp.host/--/api/v2/push/send`.
- Re-register after sign-out/sign-in as a different user.

## Biometric sign-in: `useBiometricCredentials()`

Dev build only. Enrolls a hardware-backed credential for the signed-in user on this device, then signs them back in with Face ID, Touch ID, or device biometrics. No password is stored.

Prerequisites: enable Clerk Dashboard → **User & authentication** → **Biometric** → **Sign-in with mobile biometrics** (otherwise `getAvailability()` reports `feature_disabled`), then `npx expo install @clerk/expo-biometrics` and rebuild. For the iOS Face ID prompt, pass `faceIDPermission` to the `@clerk/expo` plugin: `["@clerk/expo", { "faceIDPermission": "Sign in with Face ID" }]`. The iOS Simulator can't create the keys, so test on a physical iPhone.

```tsx
import { useBiometricCredentials } from '@clerk/expo/biometrics'

const { getAvailability, enroll, signIn, revokeCurrentDeviceCredential } = useBiometricCredentials()

// While signed in, offer to enable biometrics:
await enroll()

// On the sign-in screen:
// After useAuth().isLoaded:
try {
  const { isAvailable } = await getAvailability()
  if (isAvailable) {
    const result = await signIn()
    if (result.status === 'complete' && result.createdSessionId) {
      await result.setActive({ session: result.createdSessionId })
    }
    // Otherwise continue result.signIn (e.g. needs_second_factor) with the custom-flow methods
  }
} catch {
  // Keep another sign-in method available
}

// Before signing out, if the user turns biometrics off:
await revokeCurrentDeviceCredential()
```

Fetch the hook's docs page before wiring UI; it lists the `unavailableReason` values and the `reverify()` method for step-up checks.

`useLocalCredentials()` from `@clerk/expo/local-credentials` is deprecated (it replays a stored password). Don't use it in new code.

## Passkeys

Dev build only. Install the separate `@clerk/expo-passkeys` package, then import from the `@clerk/expo/passkeys` subpath — the subpath re-exports the peer package (this install/import pairing is intentional and matches the docs). Pass it to the provider and enable passkeys in the dashboard:

```tsx
import { passkeys } from '@clerk/expo/passkeys'

<ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache} __experimental_passkeys={passkeys}>
```

Requires associated-domains setup (iOS) / asset links (Android). Fetch the [Expo passkeys reference](https://clerk.com/docs/reference/expo/passkeys) for the current platform configuration before implementing — the passkeys API is still experimental and changes.

## Offline resource caching

If Clerk resources (user, session) should survive offline cold starts, pass `resourceCache` from `@clerk/expo/resource-cache` to the provider (`__experimental_resourceCache`). `@clerk/expo/secure-store` is the deprecated alias — never use it in new code.
