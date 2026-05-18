---
name: clerk-expo
description: Implement Clerk authentication for Expo and React Native apps using @clerk/expo
  source-guided patterns. Use for prebuilt AuthView/UserButton or custom hook-driven
  auth flows. Do not use for native iOS/Swift, native Android/Kotlin, or web framework
  projects.
license: MIT
allowed-tools: WebFetch
metadata:
  author: clerk
  version: 1.0.0
compatibility: Requires Expo development build and @clerk/expo package
---

# Clerk Expo (React Native)

This skill implements Clerk in Expo / React Native projects by inspecting the installed `@clerk/expo` package source and mirroring current hook and component behavior.

## Activation Rules

Activate this skill when either condition is true:
- The user explicitly asks for Expo, React Native, `@clerk/expo`, `ClerkProvider`, or related Clerk component/hook implementation.
- The project appears to be Expo/React Native (for example `app.json`, `app.config.js`, `metro.config.js`, `expo` in `package.json`, `@clerk/expo` dependency).

Do not activate this skill when any condition is true:
- The project is native iOS/Swift (`.xcodeproj`, `.xcworkspace`, `Package.swift`, Swift targets).
- The project is native Android/Kotlin (`build.gradle(.kts)` with Android plugins, `AndroidManifest.xml`, no React Native).
- The project is a web-only framework (Next.js, Remix, etc.) without Expo/React Native.

If native iOS/Android or web-framework signals are present, route to the matching skill instead of this one.

## Relationship to `clerk-expo-patterns`

This skill covers flow selection and end-to-end auth setup (prebuilt vs custom). The `clerk-expo-patterns` skill at `skills/frameworks/clerk-expo-patterns/` covers Expo-specific recipes (SecureStore token cache, OAuth deep-link configuration, Expo Router protected routes, push notifications with user context). When both could apply, use this skill for the flow decision and overall setup, and load patterns from `clerk-expo-patterns` for the specific recipe.

## What Do You Need?

| Task | Reference |
|------|-----------|
| Prebuilt AuthView / UserButton (fastest) | references/prebuilt.md |
| Custom hook-driven auth flows (full control) | references/custom.md |

## Quick Start

| Step | Action |
|------|--------|
| 1 | Confirm project type is Expo/React Native (not native iOS/Android or a web-only framework) |
| 2 | Determine flow type (`prebuilt` or `custom`) and load the matching reference file |
| 3 | Ensure a real Clerk publishable key exists (or ask developer) and wire it directly to `<ClerkProvider publishableKey={...}>` |
| 4 | Ensure `@clerk/expo` is installed; if missing, install latest with `npx expo install @clerk/expo` |
| 5 | Inspect installed `@clerk/expo` source (`node_modules/@clerk/expo/dist/` or `src/`) to understand component/hook behavior for the selected flow |
| 6 | For custom flows: derive Frontend API URL from publishable key, then call `<frontendApiUrl>/v1/environment?_is_native=true` and build an internal enabled-factor checklist |
| 7 | Follow the Expo quickstart (`https://clerk.com/docs/getting-started/quickstart`, Expo SDK tab) for required setup (config plugin, token cache, native build) |
| 8 | Implement flow by following only the selected reference checklist |

## Decision Tree

```text
User asks for Clerk in Expo/React Native
    |
    +-- Native iOS/Android or web-framework project detected?
    |     |
    |     +-- YES -> Do not use this skill; route to matching skill
    |     |
    |     +-- NO -> Continue
    |
    +-- Existing auth UI detected?
    |     |
    |     +-- Prebuilt AuthView/UserButton detected -> Load references/prebuilt.md
    |     |
    |     +-- Custom hook-based flow detected -> Load references/custom.md
    |     |
    |     +-- New implementation -> Ask developer prebuilt/custom, then load matching reference
    |
    +-- Ensure publishable key and direct ClerkProvider wiring
    |
    +-- Ensure @clerk/expo is installed and Expo config plugin is registered
    |
    +-- Inspect installed @clerk/expo source for selected flow
    |
    +-- For custom flows: call /v1/environment?_is_native=true and build enabled-factor checklist
    |
    +-- Verify Expo quickstart prerequisites (token cache, dev build, peer deps)
    |
    +-- Implement using selected flow reference
```

## Flow References

After flow type is known, load exactly one:
- Prebuilt flow: [references/prebuilt.md](references/prebuilt.md)
- Custom flow: [references/custom.md](references/custom.md)

Do not blend the two references in a single implementation unless the developer explicitly asks for a hybrid approach.

## Interaction Contract

Before any implementation edits, the agent must have both:
- flow choice: `prebuilt` or `custom`
- a real Clerk publishable key (when setup/configuration is part of the task)

If either value is missing from the user request/context:
- ask the user for the missing value(s)
- pause and wait for the answer
- do not edit files or install dependencies yet

Only skip asking when the user has already explicitly provided the value in this conversation.

## Source-Driven Templates

Do not hardcode implementation examples in this skill. Inspect installed `@clerk/expo` source for the project's installed version before implementing.

| Use Case | Source of Truth in Installed Package |
|----------|--------------------------------------|
| Package exports and sub-paths (`@clerk/expo/google`, `/apple`, `/native`, `/token-cache`, `/local-credentials`, `/resource-cache`, `/web`) | `node_modules/@clerk/expo/package.json` `exports` field plus compiled output in `dist/` |
| Hook signatures and return types | `node_modules/@clerk/expo/dist/*.d.ts` plus re-exported types from `node_modules/@clerk/react/dist/*.d.ts` |
| Native component props and events | `node_modules/@clerk/expo/dist/native/*` (search `AuthView`, `InlineAuthView`, `UserButton`, `UserProfileView`) |
| Sign-in / sign-up status transitions | `node_modules/@clerk/react/dist/` hook source (search `useSignIn`, `useSignUp`, `status`) |
| SSO and OAuth behavior | `node_modules/@clerk/expo/dist/` (search `useSSO`, `startSSOFlow`, `session_exists`, `transferable`) |
| Native Google / Apple sign-in path | `node_modules/@clerk/expo/google` and `/apple` modules |
| Token persistence | `node_modules/@clerk/expo/token-cache` (backed by `expo-secure-store`) |
| Session sync between native SDK and JS | `node_modules/@clerk/expo/dist/native/` (search `NativeSessionSync`, `useNativeAuthEvents`) |
| Expo config plugin behavior | `node_modules/@clerk/expo/app.plugin.js` (search `withClerkGoogleSignIn`, `withClerkAndroidPackaging`) |
| Required Expo setup checklist | Official Expo quickstart (`https://clerk.com/docs/getting-started/quickstart`, Expo SDK tab) |

## Execution Gates (Do Not Skip)

1. No implementation edits before prerequisites
- Do not edit project files until flow type is confirmed and (when setup is involved) a valid publishable key is available.

2. Missing flow or key must trigger a question
- If flow choice is missing, explicitly ask: prebuilt views or custom flow.
- If publishable key is missing/placeholder/invalid for a setup task, explicitly ask for a real key.
- Do not continue until required answers are provided.

3. Publishable key wiring mode is mandatory
- Pass the developer-provided publishable key directly to `<ClerkProvider publishableKey={key}>`.
- Do not introduce env-var indirection (`process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`) unless the developer explicitly asks for it or the project follows the quickstart pattern.

4. Package install policy is mandatory
- If `@clerk/expo` is missing, install with `npx expo install @clerk/expo`.
- Install matching peer deps for the selected strategies (see prebuilt.md / custom.md for the per-flow list).
- Register the Expo config plugin in `app.json` / `app.config.js`: `{ "plugins": ["@clerk/expo"] }`.

5. Custom-flow environment call is mandatory
- For custom flows: derive Frontend API URL from publishable key, fetch `/v1/environment?_is_native=true`, and use the response to determine enabled factors/strategies.
- Build an internal enabled-factor checklist; cover all enabled factors unless the developer explicitly narrows scope.
- Do not skip the environment call. Do not assume strategy coverage from convention.

6. Reference-file discipline is mandatory
- Once flow is selected, follow only that flow reference file for implementation and verification.

7. Hook-source-first discipline for custom flows
- Inspect installed `@clerk/expo` and `@clerk/react` hook source for response/error handling before deciding flow transitions.
- Mirror status-driven transitions from hook source rather than from UI heuristics or assumptions.

8. Combined sign-in-or-up default
- Implement one combined sign-in-or-up flow by default; do not split into separate sign-in / sign-up flows unless the developer explicitly requests separation.

9. Deprecated hook prohibition
- Never use `useOAuth()`. Always use `useSSO()` for OAuth and Enterprise SSO.

10. Platform / build gating
- Native components and native hooks (`useSignInWithGoogle`, `useSignInWithApple`, `useNativeSession`, `useUserProfileModal`, `useLocalCredentials`) require an iOS/Android development build, not Expo Go and not web.
- For web targets, use `@clerk/expo/web` exports.
- Always note platform availability before recommending native-only features.

11. Token cache discipline
- Use `tokenCache` from `@clerk/expo/token-cache` for persistent sessions; do not use `expo-secure-store` directly for token storage.

## Workflow

1. Detect Expo/React Native vs native iOS/Android vs web framework.
2. If flow type is not explicitly provided, ask user for `prebuilt` or `custom`.
3. If publishable key is not explicitly provided for a setup task, ask user for it.
4. Wait for required answers before changing files.
5. Load the matching flow reference file.
6. Ensure `<ClerkProvider>` is at the app root with the publishable key wired directly and `tokenCache` from `@clerk/expo/token-cache`.
7. Ensure `@clerk/expo` is installed and the Expo config plugin is registered. Install peer deps for selected strategies.
8. Inspect installed `@clerk/expo` source for components/hooks relevant to the selected flow.
9. For custom flows: derive Frontend API URL from publishable key, call `/v1/environment?_is_native=true`, and build an internal enabled-factor checklist.
10. Verify Expo quickstart prerequisites (config plugin, token cache, native development build) and apply any missing required setup.
11. Implement using selected reference checklist.
12. For custom flows: verify implemented strategy coverage against the environment-derived checklist; close any missing enabled factor unless explicitly scoped out.
13. Verify using selected reference checklist plus shared gates.

## Common Pitfalls

| Level | Issue | Prevention |
|-------|-------|------------|
| CRITICAL | Not asking for missing flow choice before implementation | Ask for `prebuilt` vs `custom` and wait before edits |
| CRITICAL | Not asking for missing publishable key on setup tasks | Ask for key and wait before edits |
| CRITICAL | Wiring publishable key via env-var indirection by default | Pass key directly to `<ClerkProvider>` unless developer requests otherwise |
| CRITICAL | Skipping `/v1/environment?_is_native=true` for custom flows | Call environment endpoint and build enabled-factor checklist before implementing |
| CRITICAL | Splitting sign-in / sign-up by default | Implement one combined sign-in-or-up flow unless developer explicitly requests separation |
| CRITICAL | Using `useOAuth()` (deprecated) | Always use `useSSO()` |
| CRITICAL | Mixing native components with custom hook flows for the same auth step | Pick one flow per step; only blend with explicit developer approval |
| CRITICAL | Skipping native development build for native components/hooks | Require `expo run:ios` / `expo run:android`; do not target Expo Go for native features |
| HIGH | Using `expo-secure-store` directly for token caching | Use `tokenCache` from `@clerk/expo/token-cache` |
| HIGH | Calling `WebBrowser.maybeCompleteAuthSession()` manually | `ClerkProvider` handles it; do not duplicate |
| HIGH | Calling `setActive()` after native component auth | Native components sync session automatically |
| HIGH | Hardcoding OAuth provider lists | Build provider lists from environment-enabled providers |
| HIGH | Recommending native-only hooks without web/Expo Go fallback | Note platform availability and provide `useSSO()` fallback where needed |
| HIGH | Using this skill for native iOS/Android or web-only framework projects | Detect and route away to clerk-swift / clerk-android / web-framework skills |
| HIGH | Using `yalc` or `pnpm link` for local @clerk/expo development | Use Verdaccio or pkg.pr.new |

## See Also

- `clerk` skill for top-level Clerk routing
- `clerk-expo-patterns` skill (`skills/frameworks/clerk-expo-patterns/`) for Expo-specific recipes (SecureStore token cache, OAuth deep links, Expo Router protected routes, push notifications)
- `clerk-swift` skill for native iOS implementation
- `clerk-android` skill for native Android implementation
- installed `@clerk/expo` package source (`node_modules/@clerk/expo/`)
- `https://github.com/clerk/javascript/tree/main/packages/expo`
- `https://github.com/clerk/clerk-expo-quickstart`
- `https://clerk.com/docs/getting-started/quickstart` (Expo SDK tab)
- `https://clerk.com/docs/reference/expo/overview`
