# Prebuilt Flow Reference (ClerkKitUI)

Use this file for prebuilt flows.

## Purpose

Implement native iOS auth with prebuilt ClerkKitUI components, defaulting to combined auth in a sheet.

## Prerequisites

Clerk must already be set up through the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) (or the [manual iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1) when the CLI can't set up the project). Then check only what this flow adds, and make targeted changes for anything missing:

1. Package products

- The app target needs `ClerkKitUI` in addition to `ClerkKit`. If only `ClerkKit` is linked, run `npx -y clerk@latest init --mode agent --apple-sdk ui --json` from the project directory. It runs the CLI's full native setup on the Clerk application's development instance, not only the package change: it links `ClerkKitUI` (keeping the `clerk-ios` version requirement), registers the app's native identity, turns on the Native API, and adds the Associated Domain and, when Apple is enabled in Clerk, the Sign in with Apple entitlement, unless the signing team can't use them. The result's handoff says what was left out. If the CLI isn't available, add the product in Xcode.

2. Sign in with Apple

- If native Sign in with Apple is enabled for this app, the target needs the Sign in with Apple capability, which needs a paid Apple Developer Program team. `npx -y clerk@latest doctor` reports the Apple connection and the entitlement for Debug and Release; for another configuration, pass `--xcode-configuration <name>` to both `doctor` and `init`.
- To enable it, run `npx -y clerk@latest init --mode agent --sign-in-with-apple --json` from the project directory. It turns on Apple in the Clerk application's development instance and adds the entitlement, along with the rest of the native setup (the app's registration, the Native API, and the Associated Domain). If the CLI isn't available, add the capability in Xcode. The capability alone doesn't turn on Apple sign-in in Clerk. Unless the user says Apple sign-in is already set up in Clerk, have them follow the manual steps in [Sign in with Apple](https://clerk.com/docs/ios/guides/configure/auth-strategies/sign-in-with-apple.md) for the Clerk instance whose key the app uses. For a production key, use the guide's production section:
  - On [**Native applications**](https://dashboard.clerk.com/~/native-applications), turn on the Native API and add the app's App ID Prefix and Bundle ID if they aren't there.
  - On [**SSO connections**](https://dashboard.clerk.com/~/user-authentication/sso-connections), enable Apple.

These `init` commands need a linked project. With `--json`, an unlinked project returns `status: "application-required"`: rerun with `--app <application_id>` for the application whose `publishable_key` matches the app's existing key, from `npx -y clerk@latest apps list --json`.

With `--json`, they can also return `status: "input-required"` before setting up the project. When the response has an `identity` object, handle its `issues` in this order:

1. Registrations conflict: if the run included `--app-id-prefix`, confirm that prefix with the user and rerun without it if they aren't sure. If they confirm it, the run didn't include one, or the conflict remains, have the user review the matching registrations in the Clerk Dashboard, then rerun; don't ask for the App ID Prefix. Do the same when a registration's prefix is invalid.
2. The Bundle ID is missing: ask the user for only the Bundle ID and rerun with `--bundle-id <bundle_id>`, even if the App ID Prefix is reported too.
3. The App ID Prefix is still missing: ask the user for it and rerun with the same flags plus `--app-id-prefix <app_id_prefix>`.

The App ID Prefix is usually the Team ID in Xcode › Settings › Accounts, and setup takes it from a matching Clerk registration or else the signing team. If the user gives one, pass it with `--app-id-prefix` on every run unless step 1 dropped it.

If setup stops with `selection-required`, `setup-interrupted`, or an `input-required` without `identity`, follow the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md). Otherwise, read the JSON result, even on a nonzero exit (report the printed error when there's none), and finish any step in `handoff.remaining` this flow needs before continuing.

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
