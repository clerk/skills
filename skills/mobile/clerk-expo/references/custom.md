# Custom Flow Reference (@clerk/expo hooks)

Use this file only when flow type is `custom`.

## Purpose

Implement Expo / React Native auth with `@clerk/expo` hooks (`useSignIn`, `useSignUp`, `useSSO`, native sign-in hooks) while preserving Clerk's status-driven, multi-step auth semantics.

## Source-Driven Requirements

Use installed `@clerk/expo` package source as the primary reference:
- `node_modules/@clerk/expo/dist/` (compiled JS)
- `node_modules/@clerk/expo/src/` (TypeScript source if available)
- `node_modules/@clerk/react/dist/` (re-exported hooks)
- `node_modules/@clerk/shared/dist/` (shared utilities and error helpers)

Source priority rules for custom flow:
- Primary source: installed `@clerk/expo` and `@clerk/react` hook source for response/error handling, status fields, and flow transitions.
- Secondary source: `clerk-expo-quickstart` example app (`https://github.com/clerk/clerk-expo-quickstart`) for behavioral confirmation patterns.
- Fallback only: official Expo reference docs (`https://clerk.com/docs/reference/expo/...`) when behavior is unclear from source.

For custom flows, treat hook return values and status fields as the source of truth for auth transitions; do not infer transitions from UI heuristics.

## Required Patterns

1. Package install
- If `@clerk/expo` is missing, install with `npx expo install @clerk/expo`.
- Install peer deps based on selected strategies:
  - SSO/OAuth: `npx expo install expo-auth-session expo-web-browser`
  - Persistent token cache: `npx expo install expo-secure-store`
  - Native Apple sign-in (iOS): `npx expo install expo-apple-authentication`
  - Biometric credentials: `npx expo install expo-local-authentication expo-secure-store`
- Add the Expo config plugin in `app.json` / `app.config.js`:
  ```json
  { "plugins": ["@clerk/expo"] }
  ```
- Native hooks (`useSignInWithGoogle`, `useSignInWithApple`, `useNativeSession`, `useUserProfileModal`, `useLocalCredentials`) require a development build, not Expo Go.

2. ClerkProvider setup
- Wrap the app at the root with `<ClerkProvider publishableKey={key} tokenCache={tokenCache}>`.
- Pass the developer-provided publishable key directly; do not introduce env-var indirection unless explicitly requested or following the quickstart pattern.
- Use `tokenCache` from `@clerk/expo/token-cache` for persistent sessions.

3. Environment-driven strategy coverage
- Derive the Frontend API URL from the publishable key.
- Fetch environment at `<frontendApiUrl>/v1/environment?_is_native=true` before deciding strategy coverage.
- Treat the environment payload as the source of truth for enabled auth strategies/features.
- Build an internal enabled-factor checklist from the response and use it as the implementation coverage target.
- Implement support for all environment-enabled factors/strategies by default; ask only to narrow scope.
- If environment fetch fails, ask the developer which strategies to use and wait before continuing.
- Do not serialize the environment matrix into project source files.

4. Combined sign-in-or-up default
- Implement one combined sign-in-or-up flow by default.
- Do not split into separate sign-in and sign-up flows unless the developer explicitly requests separation.
- Handle fallback from sign-in to sign-up when identifier is not found:
  ```typescript
  try {
    await signIn.create({ identifier });
  } catch (err) {
    if (isClerkAPIResponseError(err)) {
      const shouldSignUp = err.errors.some(e =>
        ['form_identifier_not_found', 'invitation_account_not_exists'].includes(e.code)
      );
      if (shouldSignUp) {
        await signUp.create({ emailAddress: identifier });
      } else {
        throw err;
      }
    }
  }
  ```

5. Status-driven multi-step progression
- Drive transitions from `signIn.status` and `signUp.status` returned by hook responses.
- Sign-in status values: `needs_identifier`, `needs_first_factor`, `needs_second_factor`, `complete`.
- Sign-up status values: `missing_requirements`, `complete`.
- On `complete`, call `setActive({ session: result.createdSessionId })`.
- Show only the inputs required by the current step; do not collect all fields up front.
- Mirror the response/error handling found in installed hook source for branching decisions.

6. Hook selection map
| Strategy | Hook | Import |
|----------|------|--------|
| Email/password sign-in | `useSignIn()` | `@clerk/expo` |
| Email/password sign-up | `useSignUp()` | `@clerk/expo` |
| Email code / phone OTP | `useSignIn()` / `useSignUp()` (`prepare*` + `attempt*`) | `@clerk/expo` |
| Browser-based OAuth (all platforms) | `useSSO()` | `@clerk/expo` |
| Enterprise SSO / SAML | `useSSO()` | `@clerk/expo` |
| Native Google sign-in (credential manager) | `useSignInWithGoogle()` | `@clerk/expo/google` |
| Native Apple sign-in (iOS only) | `useSignInWithApple()` | `@clerk/expo/apple` |
| Two-factor authentication | `useSignIn().attemptSecondFactor` | `@clerk/expo` |
| Biometric credentials | `useLocalCredentials()` | `@clerk/expo/local-credentials` |
| Email link verification | `useEmailLink()` | `@clerk/expo` |
| Session/user/auth state | `useAuth()`, `useUser()`, `useSession()` | `@clerk/expo` |
| Native session state | `useNativeSession()` | `@clerk/expo` |

7. SSO / OAuth policy
- Always use `useSSO()` for OAuth and Enterprise SSO. Never use the deprecated `useOAuth()`.
- `redirectUrl` defaults to `AuthSession.makeRedirectUri({ path: 'sso-callback' })` if omitted.
- Treat user cancellation (`authSessionResult.type !== 'success'`) as non-fatal; do not show error UI.
- `useSSO` internally clears stale `session_exists` cached JWT and retries; do not reimplement that.
- `useSSO` handles the `transferable` status by creating a sign-up with `transfer: true`; do not duplicate.
- Build provider option lists from environment-enabled providers, not hardcoded arrays.

8. Native Google / Apple policy
- Native Google: `useSignInWithGoogle()` from `@clerk/expo/google`. Requires Expo config plugin and `EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME`. iOS + Android only.
- Native Apple: `useSignInWithApple()` from `@clerk/expo/apple`. Requires `expo-apple-authentication` and the Apple Sign In capability. iOS only.
- Provide a graceful fallback (e.g., `useSSO({ strategy: 'oauth_google' / 'oauth_apple' })`) on platforms where the native hook is unavailable.
- Do not implement provider-specific token exchange directly; always go through Clerk hooks.

9. Code organization and separation of concerns
- Split custom auth into focused modules:
  - UI step screens / components per status state.
  - Flow / state orchestration (hooks composing `useSignIn` + `useSignUp`).
  - Strategy-specific glue (SSO entry, native sign-in entry, biometric setup).
- Keep module boundaries narrow so new factors/steps can be added without rewriting a monolithic screen.

10. Hook usage discipline
- Do not create custom auth state management when `useAuth`, `useUser`, `useSession`, `useClerk` already satisfy the need.
- Do not wrap Clerk hooks in unnecessary context providers or facades.
- Do not call `WebBrowser.maybeCompleteAuthSession()` manually; `ClerkProvider` does it.
- Do not use `expo-secure-store` directly for token caching; use `@clerk/expo/token-cache`.

## Verification Checklist

1. Quickstart prerequisites are complete
- `<ClerkProvider publishableKey={...} tokenCache={tokenCache}>` is at the app root.
- Expo config plugin is registered.
- Required peer deps for selected strategies are installed.
- Native development build exists where native hooks are used.

2. Environment-driven coverage
- Frontend API URL was derived from the publishable key.
- `/v1/environment?_is_native=true` was called before strategy selection.
- Internal enabled-factor checklist exists and every factor is implemented (or explicitly out of scope per developer request).
- Environment matrix is not persisted in project source files.

3. Combined-flow default
- One combined sign-in-or-up flow is implemented; no split sign-in / sign-up unless explicitly requested.
- Identifier-not-found fallback into sign-up is implemented.

4. Status-driven transitions
- Transitions are driven by `signIn.status` / `signUp.status` returned from hook responses.
- Each step renders only the inputs required by the current status.
- `setActive` is called on `complete` with the resource's `createdSessionId`.

5. Hook discipline
- `useSSO()` is used for OAuth/Enterprise SSO; `useOAuth()` is never used.
- Native hooks are imported from sub-paths (`@clerk/expo/google`, `/apple`, `/local-credentials`).
- `useAuth`, `useUser`, `useSession` are used directly without redundant wrappers.

6. SSO behavior
- Cancellation is non-fatal; error UI only appears for true errors.
- `transferable` and `session_exists` are not re-implemented (handled inside `useSSO`).
- Provider lists are built from environment, not hardcoded.

7. Native sign-in correctness
- Native Google / Apple are used via their dedicated hooks where supported.
- Platform fallbacks via `useSSO()` exist where native hooks are unavailable.

8. Token persistence
- `tokenCache` from `@clerk/expo/token-cache` is configured; no direct `expo-secure-store` usage for token caching.

9. Architecture quality
- UI step screens, flow orchestration, and strategy-specific integration are split across focused files.

10. Source parity
- Hook response/error handling matches behavior found in installed `@clerk/expo` and `@clerk/react` source.
