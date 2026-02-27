---
name: clerk-swift
description: Implement Clerk authentication for native Swift and iOS apps using ClerkKit and ClerkKitUI source-guided patterns. Use for prebuilt AuthView or custom native flows. Do not use for Expo or React Native projects.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Clerk Swift (Native iOS)

This skill implements Clerk in native Swift/iOS projects by reading installed package source and mirroring current ClerkKit/ClerkKitUI behavior.

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
| 2 | Determine flow type (`prebuilt` or `custom`) and load the matching reference file |
| 3 | Ensure a valid publishable key exists (or ask developer) and wire it directly in configuration |
| 4 | Ensure `clerk-ios` package is installed with correct products for selected flow |
| 5 | Implement flow by following only the selected reference checklist |

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
    |     +-- Prebuilt views detected -> Load references/prebuilt.md
    |     |
    |     +-- Custom flow detected -> Load references/custom.md
    |     |
    |     +-- New implementation -> Ask developer prebuilt/custom, then load matching reference
    |
    +-- Ensure publishable key and direct wiring
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
- a real Clerk publishable key

If either value is missing from the user request/context:
- ask the user for the missing value(s)
- pause and wait for the answer
- do not edit files or install dependencies yet

Only skip asking when the user has already explicitly provided the value in this conversation.

## Source-Driven Templates

Do not hardcode implementation examples in this skill. Inspect current installed package source before implementing.

| Use Case | Source of Truth in Installed Package |
|----------|--------------------------------------|
| SDK package products and platform support | Package manifest and target product definitions for `ClerkKit` and `ClerkKitUI` |
| Publishable key validation and frontend API derivation | Clerk configuration logic (search symbols: `configure(publishableKey`, `frontendApiUrl`, `invalidPublishableKeyFormat`) |
| Native Sign in with Apple implementation | Apple capability and native sign-in behavior in selected flow reference |

## Execution Gates (Do Not Skip)

1. No implementation edits before prerequisites
- Do not edit project files until flow type is confirmed and a valid publishable key is available.

2. Missing flow or key must trigger a question
- If flow choice is missing, explicitly ask: prebuilt views or custom flow.
- If publishable key is missing/placeholder/invalid, explicitly ask for a real key.
- Do not continue until both answers are provided.

3. Publishable key wiring mode is mandatory
- Use the developer-provided publishable key plainly in app configuration passed to `Clerk.configure`.
- Do not introduce plist/local-secrets/env-file/build-setting indirection unless explicitly requested.

4. Reference-file discipline is mandatory
- Once flow is selected, follow only that flow reference file for implementation and verification.

## Workflow

1. Detect native iOS/Swift vs Expo/React Native.
2. If flow type is not explicitly provided, ask user for `prebuilt` or `custom`.
3. If publishable key is not explicitly provided, ask user for it.
4. Wait for both answers before changing files.
5. Load matching flow reference file.
6. Ensure publishable key is valid and directly wired in `Clerk.configure`.
7. Ensure package install/products match selected flow.
8. Implement using selected reference checklist.
9. Verify using selected reference checklist plus shared gates.

## Common Pitfalls

| Level | Issue | Prevention |
|-------|-------|------------|
| CRITICAL | Not asking for missing flow choice before implementation | Ask for `prebuilt` vs `custom` and wait before edits |
| CRITICAL | Not asking for missing publishable key before implementation | Ask for key and wait before edits |
| CRITICAL | Starting implementation before flow type is confirmed | Confirm flow first and load matching reference |
| CRITICAL | Using plist/local/env indirection for publishable key without request | Wire key directly in configuration by default |
| HIGH | Using this skill for Expo/React Native | Detect and route away before implementation |

## See Also

- `../clerk/SKILL.md` for top-level Clerk routing
- `../setup/SKILL.md` for non-native or cross-framework setup
- `https://clerk.com/docs/quickstarts/ios`
- `https://github.com/clerk/clerk-ios`
