---
name: clerk-swift
description: Implement Clerk authentication for native Swift and iOS apps using ClerkKit and ClerkKitUI source-guided patterns. Use for prebuilt AuthView or custom native flows. Do not use for Expo or React Native projects.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Clerk Swift (Native iOS)

This skill implements Clerk in native Swift/iOS projects by reading current SDK source from `clerk-ios` and mirroring those patterns.

## Activation Rules

Activate this skill when either condition is true:
- The user explicitly asks for Swift, SwiftUI, UIKit, or native iOS Clerk implementation.
- The project appears to be native iOS/Swift (for example `.xcodeproj`, `.xcworkspace`, `Package.swift`, Swift targets).

Do not activate this skill when either condition is true:
- The project is Expo.
- The project is React Native.

If Expo/React Native signals are present, route to the general setup skill instead of this one.

## Quick Start

| Step | Action |
|------|--------|
| 1 | Confirm project type is native Swift/iOS and not Expo/React Native |
| 2 | Determine whether flow is prebuilt (`AuthView`) or custom |
| 3 | Ensure a valid Clerk publishable key exists (or ask developer for one) and wire it directly in configuration |
| 4 | Use publishable key to load environment from Clerk instance (`/v1/environment`) |
| 5 | Ensure `clerk-ios` package is installed and correct products are linked |
| 6 | Implement all enabled instance features by default (unless developer narrows scope) |
| 7 | Default to `AuthView` combined `signInOrUp` mode (no custom mode switcher) and always include native Sign in with Apple |

## Decision Tree

```text
User asks for Clerk in Swift/iOS
    |
    +-- Expo/React Native project detected?
    |     |
    |     +-- YES -> Do not use this skill
    |     |
    |     +-- NO -> Continue
    |
    +-- Existing auth UI detected?
    |     |
    |     +-- Prebuilt views detected -> Use prebuilt path
    |     |
    |     +-- Custom flow detected -> Use custom path
    |     |
    |     +-- New implementation -> Ask developer: prebuilt or custom
    |
    +-- Ensure publishable key
    |
    +-- Ensure package install + target products
    |
    +-- Load environment for enabled features
    |
    +-- Implement default sign-in-or-sign-up flow
    |
    +-- Always implement native Apple sign-in (not generic social-provider flow)
```

## Source-Driven Templates

Do not hardcode implementation examples in this skill. Always inspect current source from `clerk-ios` before implementing.

| Use Case | Source of Truth in Installed Package |
|----------|--------------------------------------|
| SDK package products and platform support | Package manifest and target product definitions for `ClerkKit` and `ClerkKitUI` |
| Publishable key validation and frontend API derivation | Clerk configuration logic (search symbols: `configure(publishableKey`, `frontendApiUrl`, `invalidPublishableKeyFormat`) |
| Environment fetch endpoint contract | Environment request path and request construction (search symbols: `/v1/environment`, `Request<Clerk.Environment>`) |
| Network defaults, API version, and native headers | API client defaults and middleware behavior (search symbols: `clerk-api-version`, `_is_native`, `x-mobile`) |
| Environment-to-UI capability mapping | ClerkKitUI-style derived capability logic (search symbols: `enabledFirstFactorAttributes`, `authenticatableSocialProviders`, `mfaIsEnabled`, `signUpIsPublic`) |
| Default prebuilt auth flow behavior | Auth UI entry and state behavior (search symbols: `AuthView`, `AuthState`, `signInOrUp`) |
| Feature gating from environment data | Environment-driven auth toggles (search symbols: `enabledFirstFactorAttributes`, `authenticatableSocialProviders`) |
| Required sign-up fields | Sign-up requirements from environment settings (search symbols: `userSettings.attributes`, `required`, `userSettings.signUp`) |
| Native Sign in with Apple implementation | Auth API paths for native Apple sign-in (search symbols: `signInWithApple`, `IDTokenProvider.apple`, `oauth_token_apple`) |

Use installed package source from Xcode DerivedData:
- `~/Library/Developer/Xcode/DerivedData/.../SourcePackages/checkouts/clerk-ios`

Source priority rules:
- Primary source: installed `ClerkKitUI` source for prebuilt/auth-view behavior and UI flow decisions.
- Secondary source: installed `ClerkKit` source for core auth/network/config behavior.
- Fallback only: example apps (local or GitHub) when behavior is not clear from `ClerkKitUI`/`ClerkKit`.
- Do not start from example-app code when corresponding library source behavior exists.

## Execution Gates (Do Not Skip)

1. No implementation edits before prerequisites
- Do not edit project files until flow type is confirmed, a valid publishable key is available, and environment inspection is complete.

2. Fresh implementation must ask flow choice
- If no existing Clerk implementation is present, explicitly ask the developer: prebuilt views or custom flow.
- Do not default to prebuilt views in a fresh app without asking.

3. Missing/placeholder publishable key must block implementation
- If key is missing, invalid, or placeholder (for example `pk_test_REPLACE_ME`), ask the developer for a real key and stop.

4. Publishable key wiring mode is mandatory
- Use the publishable key plainly in app configuration passed to `Clerk.configure`.
- Do not introduce plist/local-secrets/env-file/build-setting indirection unless the developer explicitly asks for it.

5. Environment check is mandatory before implementation
- Always make a direct HTTP call to `/v1/environment` with the publishable key before implementing auth.
- If the environment request fails, stop and ask the developer to correct key/configuration before proceeding.

6. Environment mapping parity is mandatory
- Translate raw environment JSON into a normalized capability map that matches ClerkKitUI feature-gating semantics.
- Do not make implementation decisions directly from ad-hoc raw-field checks when ClerkKitUI has derived capability logic.

7. Enabled-feature plan must be explicit
- Summarize enabled features from the environment response and implement all by default unless the developer explicitly narrows scope.

8. Library source priority must be enforced
- Resolve implementation decisions from installed `ClerkKitUI` first, then `ClerkKit`.
- Use example apps only as fallback confirmation, not as primary implementation blueprint.

9. Required-field coverage must be enforced
- Derive required sign-up fields from the environment response and include them in the implemented flow.
- Do not ship a flow that omits any required field indicated by the environment.

10. Combined auth default must be enforced
- Default auth entry must be combined sign-in-or-sign-up behavior.
- For prebuilt flows, render `AuthView()` (or explicit `AuthView(mode: .signInOrUp)`) as the default.
- Do not ship a sign-in/sign-up mode switcher unless the developer explicitly asks for that UI.

## Workflow

1. Detect native iOS/Swift vs Expo/React Native
- Confirm native project signals from Xcode and Swift files.
- Explicitly reject Expo/React Native projects for this skill.

2. Determine auth flow type
- Detect prebuilt flow usage by checking for `ClerkKitUI` and `AuthView`.
- Detect custom flow usage by checking direct `clerk.auth` API usage with custom SwiftUI/UIKit screens.
- If no existing flow is present, ask the developer whether they want prebuilt views or a custom flow, then wait for their answer before editing files.

3. Ensure publishable key (mandatory)
- Use the developer-provided publishable key directly.
- Validate key format and avoid proceeding with an empty or invalid key.
- If no key is available yet, ask the developer for it before continuing.
- Wire the key directly in app configuration used for `Clerk.configure`.
- Do not add plist/local files for key storage unless the developer explicitly requests that pattern.

4. Inspect Clerk instance environment using publishable key (mandatory)
- Use the publishable key to derive frontend API and load environment from `/v1/environment`.
- Always make a direct HTTP call to `/v1/environment` as an agent and mirror current `ClerkKit` request behavior from source.
- Build and surface a normalized ClerkKitUI-style capability matrix from the returned environment before implementation starts.
- The matrix must include at minimum:
  - first-factor capabilities (identifier attributes and social providers)
  - required sign-up fields
  - sign-up mode/policy capabilities
  - second-factor and MFA capabilities
  - profile/security capabilities used by prebuilt views
- Implement all enabled capabilities by default unless the developer narrows scope.
- Build and surface a required-field matrix from the normalized capability map before implementation starts.

5. Ensure `clerk-ios` package is installed (mandatory)
- If missing, install `https://github.com/clerk/clerk-ios` through Swift Package Manager.
- Target product rules:
  - Custom flow only: add `ClerkKit`.
  - Prebuilt views: add `ClerkKit` and `ClerkKitUI`.

6. Implement prebuilt or custom flow
- Prebuilt path:
  - Use `AuthView` in its default combined mode (`signInOrUp`).
  - Do not build a custom sign-in/sign-up toggle or segmented switcher unless the developer explicitly asks for it.
  - Match environment-driven feature availability.
- Custom path:
  - Build from `ClerkKit` primitives.
  - Mirror flow and factor handling patterns used by `ClerkKitUI` source for parity.
  - Keep a combined auth entry by default; do not add a local sign-in/sign-up mode toggle unless explicitly requested.
  - Include all required sign-up fields from environment configuration.

7. Apple sign-in policy (mandatory)
- Always implement native Sign in with Apple using the `ClerkKit` native Apple path.
- If Apple is enabled as a social provider, verify the app has Sign in with Apple capability configured and add it if missing.
- Do not implement Apple using the same generic social-provider OAuth flow used by other providers.

8. Source currency policy
- Before finalizing, re-check relevant files in installed `ClerkKit`/`ClerkKitUI` source to avoid stale patterns.
- Prefer re-checking `ClerkKitUI` first for auth UI behavior before consulting examples.
- Resolve uncertainty by reading source, not by inventing implementation details.

9. Post-implementation verification (required)
- Verify the default auth entry is combined and not a local mode switcher.
- Verify required-field coverage against the normalized capability-map required-field matrix.
- Reject and refactor if any environment-required sign-up fields are missing.
- Verify implemented feature gating is driven by the normalized capability map (ClerkKitUI parity), not raw one-off checks.
- Unless explicitly requested by the developer, reject and refactor if modified auth UI includes patterns such as:
  - local `isSignUp` / `isSignIn` state used to switch views
  - segmented `Picker`/`Toggle`/tabs to choose Sign In vs Sign Up
  - prebuilt `AuthView(mode: .signIn)` or `AuthView(mode: .signUp)` as the default entry point

## Common Pitfalls

| Level | Issue | Prevention |
|-------|-------|------------|
| CRITICAL | Proceeding without a valid publishable key | Validate key first; ask developer when missing |
| CRITICAL | Introducing plist/local-secrets/env indirection for publishable key without request | Wire key directly in configuration by default; only add indirection if explicitly requested |
| CRITICAL | Starting implementation before flow choice is confirmed in a fresh app | Ask prebuilt vs custom first, then proceed |
| CRITICAL | Skipping direct `/v1/environment` inspection before coding | Perform environment call first and gate implementation on success |
| CRITICAL | Using raw environment fields without ClerkKitUI-equivalent capability mapping | Build a normalized capability map first, then drive implementation from it |
| CRITICAL | Omitting required sign-up fields from instance configuration | Build required-field matrix from environment and enforce full coverage |
| CRITICAL | Replacing default combined auth with a custom sign-in/sign-up switcher | Default to `AuthView` combined `signInOrUp` unless developer explicitly requests a switcher |
| CRITICAL | Setting default prebuilt mode to sign-in-only or sign-up-only | Default to `AuthView()` or `AuthView(mode: .signInOrUp)` |
| CRITICAL | Implementing Apple via generic social-provider OAuth handling | Use the dedicated native Apple implementation path |
| HIGH | Using this skill for Expo/React Native | Detect and route away before implementation |
| HIGH | Adding wrong package products to targets | Use `ClerkKit` only for custom, add `ClerkKitUI` for prebuilt |
| HIGH | Skipping environment inspection before building flow | Load `/v1/environment` and gate features from response |
| HIGH | Using example-app implementations as primary source | Treat `ClerkKitUI`/`ClerkKit` source as authoritative and examples as fallback only |
| MEDIUM | Hardcoding examples that drift from SDK | Always pull patterns from current package source |
| MEDIUM | Defaulting to sign-in-only when both are expected | Start with sign-in-or-sign-up behavior unless requested otherwise |

## See Also

- `../clerk/SKILL.md` for top-level Clerk routing
- `../setup/SKILL.md` for non-native or cross-framework setup
- `https://clerk.com/docs/quickstarts/ios`
- `https://github.com/clerk/clerk-ios`
