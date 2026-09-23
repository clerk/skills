# Prebuilt Flow Reference (ClerkKitUI)

Use this file when the developer asks for `AuthView`, `UserButton`, or another prebuilt ClerkKitUI component in a native iOS or macOS app. Do not interpret a general “add Clerk” request as permission to replace existing UI.

## Start with the project's setup state

Use the native-aware CLI workflow in [../SKILL.md](../SKILL.md) when available. Include `--prebuilt-auth-ui` in the read-only dry-run plan and the eventual apply. For an untouched, safely inspectable SwiftUI starter, `clerk init --prebuilt-auth-ui` can generate a `UserButton` signed-out entry that presents `AuthView` in a sheet. In agent mode, native mutation also requires `--yes`. The flag is an explicit opt-in; ClerkKitUI linkage or `--yes` alone does not generate a screen.

For an app with existing navigation, state, or custom UI, expect the CLI to preserve that UI. Integrate the requested components manually after inspecting the installed `ClerkKitUI` API and the selected target's app root. Do not work around a blocked CLI plan by overwriting a customized screen.

## Implementation

1. Confirm `ClerkKit` and `ClerkKitUI` are linked to the selected application target. If the native-aware CLI completed setup, verify its result instead of installing the package again. Otherwise use the installed package manifest and current [Clerk iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart) for a manual installation.
2. Confirm `Clerk.configure` runs in the shipping app and `Clerk.shared` is injected into the mounted SwiftUI root. Preserve existing custom configuration and key loading.
3. For a basic new entry, prefer `UserButton(signedOutContent:)` with an action that presents `AuthView()` in a sheet. Keep the app's existing content and navigation unless the developer asks to change them.
4. Let `AuthView` display methods enabled for the linked Clerk instance. Do not enable Sign in with Apple or any other provider merely because the UI supports it. If native Apple sign-in is explicitly requested or already enabled, verify the selected target's Apple entitlement and connection; use the CLI's `--sign-in-with-apple` path only for an explicit opt-in. The local-only dry run cannot inspect remote provider state, so the authenticated CLI preview may add an Apple entitlement for an already enabled `AuthView` method. Review that plan before approving it.
5. Check iOS Associated Domains or macOS sandbox network access as applicable to the selected target. Do not require an iOS-only capability in a macOS-only target.

No direct `/v1/environment` request is required for ordinary prebuilt setup. If a provider-specific concern requires knowing the current instance state, inspect the linked instance or the installed SDK's behavior and avoid exposing keys or raw responses.

## Verification

- The signed-out action opens `AuthView()` and an authenticated user returns to the existing app experience.
- The selected target links the needed products and has proven runtime configuration and root environment injection.
- Native-aware `clerk doctor` reports the relevant configuration state when available; an Xcode build and launch are separate verification steps.
- Any blocked or manually completed capability is reported accurately rather than called complete based on UI code alone.
