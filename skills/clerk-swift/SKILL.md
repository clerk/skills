---
name: clerk-swift
description: Implement Clerk authentication UI in native Swift apps on iOS and macOS with ClerkKitUI prebuilt views or custom ClerkKit flows. Set up Clerk first with the iOS setup prompt, which uses the Clerk CLI. Do not use for Expo or React Native projects.
license: MIT
allowed-tools: WebFetch
metadata:
  author: clerk
  version: 1.2.0
compatibility: Requires Xcode and ClerkKit Swift package
---

# Clerk Swift (Native iOS and macOS)

This skill builds Clerk authentication UI in native Swift projects: prebuilt ClerkKitUI views or custom flows on ClerkKit. Setup (SDK, capabilities, native registration, and Clerk initialization) comes first and has its own workflow.

## Activation Rules

Activate this skill when either condition is true:
- The user explicitly asks for Swift, SwiftUI, UIKit, or native iOS or macOS Clerk implementation.
- The project appears to be native Swift (for example `.xcodeproj`, `.xcworkspace`, `Package.swift`, Swift targets).

Do not activate this skill when either condition is true:
- The project is Expo.
- The project is React Native.

If Expo/React Native signals are present, route to the general setup skill instead of this one.

## Set up Clerk first

If Clerk isn't set up yet (no `clerk-ios` package, no `Clerk.configure` call, or no Clerk application chosen), follow the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) before any UI work. It uses the Clerk CLI to choose a Clerk application, install the SDK, configure capabilities, register the native app, and hand off the remaining Swift integration. The CLI also supplies the publishable key, so don't ask the user to paste one.

If the CLI can't set up the project (for example, Xcode isn't available or the project isn't supported), follow the [manual iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1) instead.

If the user already asked for sign-in UI, such as a custom flow, continue here once setup's build check passes. Otherwise, return to this skill when the user wants sign-in UI added or changed.

## What Do You Need?

| Task | Reference |
|------|-----------|
| Prebuilt AuthView / UserButton (fastest) | references/prebuilt.md |
| Custom API-driven auth flows (full control) | references/custom.md |

## Quick Start

| Step | Action |
|------|--------|
| 1 | Confirm the project is native Swift and not Expo/React Native |
| 2 | If Clerk isn't set up, follow the iOS setup prompt first (see above) |
| 3 | Determine the flow type (`prebuilt` or `custom`); ask if it's undecided, then load the matching reference |
| 4 | Check the prerequisites the selected flow needs, such as a package product or capability, and make only the targeted changes that are missing |
| 5 | Implement the flow by following the selected reference |
| 6 | Build the target and report what remains unverified |

## Decision Tree

```text
User asks for Clerk in Swift
    |
    +-- Expo/React Native project detected?
    |     |
    |     +-- YES -> Do not use this skill
    |     |
    |     +-- NO -> Continue
    |
    +-- Clerk set up in this project?
    |     |
    |     +-- NO -> Follow the iOS setup prompt (manual quickstart if the CLI can't)
    |     |
    |     +-- YES -> Continue
    |
    +-- Existing auth UI detected?
    |     |
    |     +-- Prebuilt views detected -> Load references/prebuilt.md
    |     |
    |     +-- Custom flow detected -> Load references/custom.md
    |     |
    |     +-- New implementation -> Ask developer prebuilt/custom, then load matching reference
    |
    +-- Make targeted prerequisite changes for the selected flow
    |
    +-- Implement using selected flow reference
```

## Flow References

After flow type is known, load exactly one:
- Prebuilt flow: [references/prebuilt.md](references/prebuilt.md)
- Custom flow: [references/custom.md](references/custom.md)

Do not blend the two references in a single implementation unless the developer explicitly asks for a hybrid approach.

## Interaction Contract

Before UI implementation edits, the agent must have a flow choice: `prebuilt` or `custom`. If it's missing, ask the user and wait for the answer. Only skip asking when the user has already chosen in this conversation or the existing UI makes the choice clear.

## Preserve Completed Setup

- Keep the existing `Clerk.configure` call and how the app loads its publishable key, including plist, build-setting, or other custom key loading. Don't replace it with a hardcoded key.
- Keep existing package requirements, capabilities, and entitlements. Add only what the selected flow needs and is missing.
- To check Clerk and project setup without changing anything, run `npx -y clerk@latest doctor`. It reports SDK linkage, capabilities, native registration, and the Apple connection.

## Source-Driven Implementation

Use the installed `clerk-ios` package source as the reference for UI behavior, especially for custom flows.

| Use Case | Source of Truth in Installed Package |
|----------|--------------------------------------|
| SDK products, platform support, and dependency constraints | Package manifest and target product definitions for `ClerkKit` and `ClerkKitUI` |
| Auth flow sequencing and gating | `ClerkKitUI` `AuthView` implementation and how it reads the injected Clerk instance's `environment` |
| Native Sign in with Apple | Apple sign-in behavior in the selected flow reference |

## Workflow

1. Detect native Swift vs Expo/React Native.
2. If Clerk isn't set up, follow the iOS setup prompt (or the manual quickstart when the CLI can't set up the project), then continue.
3. If the flow type isn't known, ask for `prebuilt` or `custom`.
4. Load the matching flow reference.
5. Check that flow's prerequisites and make only the missing, targeted changes, preserving completed setup and custom key loading.
6. Implement using the selected reference.
7. Verify using the selected reference, then build the target.

## Common Pitfalls

| Level | Issue | Prevention |
|-------|-------|------------|
| CRITICAL | Doing setup by hand when Clerk isn't set up | Follow the iOS setup prompt; it runs the Clerk CLI. Use the manual quickstart only when the CLI can't set up the project |
| CRITICAL | Asking the user to paste a publishable key | The CLI provides it during setup; keep an existing app's own key loading |
| CRITICAL | Replacing custom key loading or existing setup | Keep the existing `Clerk.configure`, packages, and capabilities; add only what's missing |
| CRITICAL | Starting UI implementation before the flow type is confirmed | Confirm the flow first and load the matching reference |
| CRITICAL | Custom flow layout diverges from `AuthView` without explicit request | Keep custom screens materially close to `AuthView` structure and step composition by default |
| CRITICAL | Collapsing custom auth into a single all-fields screen | Follow `AuthView`-style multi-step progression and step-specific field collection |
| CRITICAL | Guessing custom sequencing or gating when uncertain | Reference installed `ClerkKitUI` behavior and mirror it |
| HIGH | Hardcoding this instance's current settings into custom flow code | Gate steps at runtime from the injected Clerk instance's `environment`, as `AuthView` does |
| HIGH | Using this skill for Expo/React Native | Detect and route away before implementation |

## See Also

- [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) for setting up Clerk with the Clerk CLI
- `clerk` skill for top-level Clerk routing
- `clerk-setup` skill for non-native or cross-framework setup
- `https://github.com/clerk/clerk-ios`
