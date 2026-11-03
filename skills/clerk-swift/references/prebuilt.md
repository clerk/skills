# Prebuilt Flow Reference (ClerkKitUI)

Use this file only when flow type is `prebuilt`.

## Purpose

Implement native iOS auth with prebuilt ClerkKitUI components, defaulting to combined auth in a sheet.

## Prerequisites

Clerk must already be set up through the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) (or the [manual iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1) when the CLI can't set up the project). Then check only what this flow adds, and make targeted changes for anything missing:

1. Package products
- The app target needs `ClerkKitUI` in addition to `ClerkKit`. If only `ClerkKit` is linked, run `npx -y clerk@latest init --apple-sdk ui --json` from the project directory. It links `ClerkKitUI` from the existing `clerk-ios` package without changing its version requirement. It also matches the Sign in with Apple entitlement to the Clerk instance's Apple setting. If the CLI isn't available, add the product in Xcode.

2. Sign in with Apple
- If native Sign in with Apple is enabled for this app, the target needs the Sign in with Apple capability. `npx -y clerk@latest doctor` reports the Apple connection and whether each configuration has the entitlement.
- To enable it, run `npx -y clerk@latest init --sign-in-with-apple --json` from the project directory. It configures Clerk and adds the entitlement. If the CLI isn't available, add the capability in Xcode.

These `init` commands need a linked project. With `--json`, an unlinked project returns `status: "application-required"`: rerun with `--app <application_id>` for the application whose `publishable_key` matches the app's existing key, from `npx -y clerk@latest apps list --json`.

Keep the existing `Clerk.configure` call, its key loading, and existing capabilities.

## Required Patterns

1. Signed-out entry pattern
- Prefer `UserButton` with `signedOutContent` for signed-out entry affordance.
- Use signed-out content action to open the auth sheet.

2. Auth presentation pattern
- Present `AuthView()` in a sheet by default.
- Keep default combined behavior from `AuthView()` (no sign-in-only/sign-up-only override by default).
- Do not use full-screen replacement or push navigation by default unless explicitly requested.

3. Placement
- Work the sign-in entry into the existing navigation or toolbar instead of replacing the app's content.
- Keep existing previews working. Give them a Clerk instance with `.environment(Clerk.preview())`.

## Verification Checklist

1. Prerequisites are in place
- `ClerkKitUI` is linked to the app target.
- If native Sign in with Apple is enabled, the target has the Sign in with Apple capability.
- Existing setup and custom key loading are unchanged.

2. Default entry is prebuilt + sheet
- Signed-out state uses `UserButton(signedOutContent:)` (or explicitly approved alternative).
- `AuthView()` is presented in `.sheet`.

3. No default sign-in-only/sign-up-only prebuilt mode
- Default entry uses `AuthView()` behavior (combined).

4. Existing app intact
- The app's content, navigation, and previews still work.
