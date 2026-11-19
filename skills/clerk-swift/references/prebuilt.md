# Prebuilt Flow Reference (ClerkKitUI)

Use this file only when flow type is `prebuilt`.

## Purpose

Implement native iOS auth with prebuilt ClerkKitUI components, defaulting to combined auth in a sheet.

## Prerequisites

Clerk must already be set up through the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) (or the [manual iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1) when the CLI can't set up the project). Then check only what this flow adds, and make targeted changes for anything missing:

1. Package products

- The app target needs `ClerkKitUI` in addition to `ClerkKit`. If only `ClerkKit` is linked, run `npx -y clerk@latest init --mode agent --apple-sdk ui --json` from the project directory. It runs the CLI's full native setup, not only the package change: it links `ClerkKitUI` from the existing `clerk-ios` package without changing its version requirement, registers the app's native identity with the Clerk application's development instance if it isn't registered yet, turns on that instance's Native API if it's off, adds that instance's Associated Domain for passkeys and password AutoFill to the target's entitlements unless the signing team can't use it (the result's handoff says what was left out), and matches the Sign in with Apple entitlement to the Clerk instance's Apple setting. If the CLI isn't available, add the product in Xcode.

2. Sign in with Apple

- If native Sign in with Apple is enabled for this app, the target needs the Sign in with Apple capability. `npx -y clerk@latest doctor` reports the Apple connection and whether each configuration has the entitlement.
- To enable it, run `npx -y clerk@latest init --mode agent --sign-in-with-apple --json` from the project directory. It configures the Clerk application's development instance and adds the entitlement, and it also registers the app's native identity with that instance if it isn't registered yet, turns on its Native API if it's off, and adds its Associated Domain for passkeys and password AutoFill unless the signing team can't use it (the result's handoff says what was left out). If the CLI isn't available, add the capability in Xcode.

These `init` commands need a linked project. With `--json`, an unlinked project returns `status: "application-required"`: rerun with `--app <application_id>` for the application whose `publishable_key` matches the app's existing key, from `npx -y clerk@latest apps list --json`.

With `--json`, they can also return `status: "input-required"` before linking Clerk products, editing entitlements, or changing the Clerk instance (the CLI may already have saved the project's link to the application). When the response has an `identity` object, read its `issues` and handle them in this order:

1. If one says registrations conflict and the run included `--app-id-prefix`, confirm that prefix with the user, and rerun without it if they aren't sure of it. If they confirm it, or the run didn't include it, tell the user to review the matching registrations in the Clerk Dashboard, then rerun; for a conflict without `--app-id-prefix`, don't ask for the App ID Prefix. If one says a registration's prefix is invalid, tell the user to fix it in the Clerk Dashboard, then rerun.
2. Otherwise, if one asks for the Bundle ID, ask the user for only the Bundle ID and rerun the same command with `--bundle-id <bundle_id>`, even when the App ID Prefix is reported too.
3. If the App ID Prefix is still reported, ask the user for it and rerun with the same flags plus `--app-id-prefix <app_id_prefix>`.

The App ID Prefix comes from Apple Developer and is usually the Team ID shown in Xcode › Settings › Accounts, but it can differ. Once setup knows the Bundle ID, it reads the prefix from a matching Clerk registration or the target's signing team, so the prefix is only reported missing when more than one registration matches, or when none matches and the target has no single signing team. If the user has given an App ID Prefix, pass it with `--app-id-prefix <app_id_prefix>` on every run, the first included, unless step 1 dropped it, because setup otherwise uses a matching registration's prefix, or else the signing team's, without asking.

If setup stops with `selection-required`, `setup-interrupted`, or an `input-required` that has no `identity` object, follow its handling in the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md). Read the JSON result even when the command exits with an error; if it prints no JSON, report the error it printed. When it has a `handoff`, finish any step in `handoff.remaining` that this flow needs, such as linking a missing product in Xcode, before continuing with this flow.

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
