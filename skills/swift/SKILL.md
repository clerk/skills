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
| 3 | Ensure a valid Clerk publishable key exists (or ask developer for one) |
| 4 | Ensure `clerk-ios` package is installed and correct products are linked |
| 5 | Use publishable key to load environment from Clerk instance (`/v1/environment`) |
| 6 | Implement all enabled instance features by default (unless developer narrows scope) |
| 7 | Default to sign-in-or-sign-up behavior and always include native Sign in with Apple |

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
| Default prebuilt auth flow behavior | Auth UI entry and state behavior (search symbols: `AuthView`, `AuthState`, `signInOrUp`) |
| Feature gating from environment data | Environment-driven auth toggles (search symbols: `enabledFirstFactorAttributes`, `authenticatableSocialProviders`) |
| Native Sign in with Apple implementation | Auth API paths for native Apple sign-in (search symbols: `signInWithApple`, `IDTokenProvider.apple`, `oauth_token_apple`) |

Use installed package source from Xcode DerivedData:
- `~/Library/Developer/Xcode/DerivedData/.../SourcePackages/checkouts/clerk-ios`

## Workflow

1. Detect native iOS/Swift vs Expo/React Native
- Confirm native project signals from Xcode and Swift files.
- Explicitly reject Expo/React Native projects for this skill.

2. Determine auth flow type
- Detect prebuilt flow usage by checking for `ClerkKitUI` and `AuthView`.
- Detect custom flow usage by checking direct `clerk.auth` API usage with custom SwiftUI/UIKit screens.
- If no existing flow is present, ask the developer whether they want prebuilt views or a custom flow.

3. Ensure publishable key (mandatory)
- Search existing project config for a publishable key first.
- Validate key format and avoid proceeding with an empty or invalid key.
- If no key is available, ask the developer for it before continuing.

4. Ensure `clerk-ios` package is installed (mandatory)
- If missing, install `https://github.com/clerk/clerk-ios` through Swift Package Manager.
- Target product rules:
  - Custom flow only: add `ClerkKit`.
  - Prebuilt views: add `ClerkKit` and `ClerkKitUI`.

5. Inspect Clerk instance environment using publishable key (mandatory)
- Use the publishable key to derive frontend API and load environment from `/v1/environment`.
- Always make a direct HTTP call to `/v1/environment` as an agent and mirror current `ClerkKit` request behavior from source.
- Build a feature matrix from the returned environment and implement all enabled features by default unless the developer narrows scope.

6. Implement prebuilt or custom flow
- Prebuilt path:
  - Align with `AuthView` behavior and default mode equivalent to sign-in-or-sign-up.
  - Match environment-driven feature availability.
- Custom path:
  - Build from `ClerkKit` primitives.
  - Mirror flow and factor handling patterns used by `ClerkKitUI` source for parity.

7. Apple sign-in policy (mandatory)
- Always implement native Sign in with Apple using the `ClerkKit` native Apple path.
- If Apple is enabled as a social provider, verify the app has Sign in with Apple capability configured and add it if missing.
- Do not implement Apple using the same generic social-provider OAuth flow used by other providers.

8. Source currency policy
- Before finalizing, re-check relevant files in installed `ClerkKit`/`ClerkKitUI` source to avoid stale patterns.
- Resolve uncertainty by reading source, not by inventing implementation details.

## Common Pitfalls

| Level | Issue | Prevention |
|-------|-------|------------|
| CRITICAL | Proceeding without a valid publishable key | Validate key first; ask developer when missing |
| CRITICAL | Implementing Apple via generic social-provider OAuth handling | Use the dedicated native Apple implementation path |
| HIGH | Using this skill for Expo/React Native | Detect and route away before implementation |
| HIGH | Adding wrong package products to targets | Use `ClerkKit` only for custom, add `ClerkKitUI` for prebuilt |
| HIGH | Skipping environment inspection before building flow | Load `/v1/environment` and gate features from response |
| MEDIUM | Hardcoding examples that drift from SDK | Always pull patterns from current package source |
| MEDIUM | Defaulting to sign-in-only when both are expected | Start with sign-in-or-sign-up behavior unless requested otherwise |

## See Also

- `../clerk/SKILL.md` for top-level Clerk routing
- `../setup/SKILL.md` for non-native or cross-framework setup
- `https://clerk.com/docs/quickstarts/ios`
- `https://github.com/clerk/clerk-ios`
