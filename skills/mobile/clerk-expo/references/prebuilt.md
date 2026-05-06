# Prebuilt Flow Reference (@clerk/expo native components)

Use this file only when flow type is `prebuilt`.

## Purpose

Implement Expo / React Native auth with prebuilt @clerk/expo native components (`AuthView`, `InlineAuthView`, `UserButton`, `UserProfileView`) instead of building custom hook-driven UI.

## Required Patterns

1. Package install
- If `@clerk/expo` is missing, install with `npx expo install @clerk/expo`.
- Install peer dep `expo-secure-store` for persistent token cache (recommended).
- Add the Expo config plugin in `app.json` / `app.config.js`:
  ```json
  { "plugins": ["@clerk/expo"] }
  ```
- Native components require a development build (`expo run:ios` / `expo run:android`); they do not work in Expo Go or on web.

2. Quickstart prerequisite audit
- Read the official Expo quickstart: `https://clerk.com/docs/getting-started/quickstart` (Expo SDK tab).
- Verify required project setup is present:
  - `<ClerkProvider publishableKey={...}>` wraps the app at the root.
  - `tokenCache` from `@clerk/expo/token-cache` is passed to `<ClerkProvider>` for session persistence.
  - Expo config plugin is registered.
  - Native build has been generated (`npx expo prebuild` or `expo run:*`).
- If required setup is missing, add it before finishing prebuilt auth implementation.

3. ClerkProvider setup
- Pass the developer-provided publishable key directly to `<ClerkProvider publishableKey={key}>`.
- Use `tokenCache` from `@clerk/expo/token-cache` for persistent sessions:
  ```tsx
  import { ClerkProvider } from '@clerk/expo';
  import { tokenCache } from '@clerk/expo/token-cache';

  <ClerkProvider publishableKey={key} tokenCache={tokenCache}>
    {/* app content */}
  </ClerkProvider>
  ```
- Do not set ClerkProvider props that match defaults.
- Do not wrap `ClerkProvider` in custom context providers unless the developer has a specific requirement.
- `ClerkProvider` calls `WebBrowser.maybeCompleteAuthSession()` automatically; do not call it manually.

4. Imports
- All native components are imported from `@clerk/expo/native`:
  ```tsx
  import { AuthView, InlineAuthView, UserButton, UserProfileView } from '@clerk/expo/native';
  ```

5. Auth presentation pattern
- Default signed-out UI: `<AuthView />` (or `<InlineAuthView />` to embed inline in an existing view hierarchy).
- Keep `mode="signInOrUp"` (the default combined behavior).
- Do not pass `mode="signIn"` or `mode="signUp"` unless the developer explicitly requests separate flows.
- Use `onAuthEvent` only when the app needs to react to completion beyond automatic session sync.

6. Signed-in entry pattern
- Default signed-in entry: `<UserButton />` (avatar + native profile modal).
- For inline profile management, use `<UserProfileView />`.
- For imperative modal presentation, use `useUserProfileModal()` from `@clerk/expo`.

7. Session synchronization
- Native components automatically sync auth state to the JS SDK; do not call `setActive()` after native component auth.
- Do not manually manage session state; ClerkProvider handles bidirectional sync via `NativeSessionSync` and `useNativeAuthEvents` internally.

8. Capability handling
- Provider availability and enabled factors are driven by environment configuration on the native side; do not hardcode provider lists in prebuilt mode.
- If a specific capability looks wrong, verify the Clerk Dashboard config rather than overriding the prebuilt UI.

9. Platform availability
| Component | iOS | Android | Web |
|-----------|-----|---------|-----|
| AuthView | Yes | Yes | No |
| InlineAuthView | Yes | Yes | No |
| UserButton | Yes | Yes | No (mock fallback) |
| UserProfileView | Yes | Yes | No |
- For web targets, use `@clerk/expo/web` control components or fall back to a hook-driven flow.

10. Minimal customization by default
- Do not replace prebuilt components with custom forms unless the developer asks for the custom flow.
- Keep customization focused on layout placement and theme integration.

## Verification Checklist

1. Quickstart prerequisites are complete
- `<ClerkProvider>` is at the app root with the developer-provided publishable key wired directly.
- `tokenCache` from `@clerk/expo/token-cache` is configured.
- Expo config plugin is registered in `app.json` / `app.config.js`.
- Native development build exists (not Expo Go).

2. Default entry is prebuilt
- Signed-out state renders `<AuthView />` (or `<InlineAuthView />` when inline placement is required).
- Signed-in state renders `<UserButton />` or app content that includes it.

3. Default mode is combined
- `<AuthView />` keeps default `signInOrUp` behavior; no sign-in-only or sign-up-only override unless explicitly requested.

4. No manual session management
- No manual `setActive()` calls after native component auth.
- No custom auth state management duplicating Clerk hooks.

5. Imports are correct
- Native components imported from `@clerk/expo/native`.
- Hooks for ancillary use (`useAuth`, `useUser`, `useSession`) imported from `@clerk/expo`.

6. Platform gating respected
- Native components are not used on web targets without a `@clerk/expo/web` fallback.
- Native development build is required for iOS/Android, not Expo Go.

7. No accidental custom-flow rewrite
- No unnecessary `useSignIn` / `useSignUp` form logic introduced alongside the prebuilt auth view.
