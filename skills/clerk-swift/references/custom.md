# Custom Flow Reference (ClerkKit)

Use this file only when flow type is `custom`.

## Purpose

Implement native iOS auth with ClerkKit primitives while keeping flow and layout very close to ClerkKitUI `AuthView` by default.

## Prerequisites

Clerk must already be set up through the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md) (or the [manual iOS quickstart](https://clerk.com/docs/ios/getting-started/quickstart.md?manual=1) when the CLI can't set up the project). Then check only what this flow adds, and make targeted changes for anything missing:

1. Package products

- The app target needs `ClerkKit`. Leave an already linked `ClerkKitUI` in place, and don't add it unless the developer asks for mixed prebuilt and custom composition.
- Don't change the existing `clerk-ios` version requirement.

2. Sign in with Apple

- If native Sign in with Apple is enabled for this app, the target needs the Sign in with Apple capability. `npx -y clerk@latest doctor` reports the Apple connection and whether each inspected configuration has the entitlement: Debug and Release, unless `--xcode-configuration <name>` names another.
- To enable it, run `npx -y clerk@latest init --mode agent --sign-in-with-apple --json` from the project directory. It configures the Clerk application's development instance and adds the entitlement, and it also registers the app's native identity with that instance if it isn't registered yet, turns on its Native API if it's off, and adds its Associated Domain for passkeys and password AutoFill unless the signing team can't use it (the result's handoff says what was left out). If the CLI isn't available, add the capability in Xcode, and have the user follow the manual steps in [Sign in with Apple](https://clerk.com/docs/ios/guides/configure/auth-strategies/sign-in-with-apple.md): register the app and turn on the Native API on the Clerk Dashboard's Native applications page, and enable Apple as an SSO connection. The capability alone doesn't turn on Apple sign-in in Clerk.

These `init` commands need a linked project. With `--json`, an unlinked project returns `status: "application-required"`: rerun with `--app <application_id>` for the application whose `publishable_key` matches the app's existing key, from `npx -y clerk@latest apps list --json`.

With `--json`, they can also return `status: "input-required"` before linking Clerk products, editing entitlements, or changing the Clerk instance (the CLI may already have saved the project's link to the application). When the response has an `identity` object, read its `issues` and handle them in this order:

1. If one says registrations conflict and the run included `--app-id-prefix`, confirm that prefix with the user, and rerun without it if they aren't sure of it. If they confirm it, or the run didn't include it, tell the user to review the matching registrations in the Clerk Dashboard, then rerun; for a conflict without `--app-id-prefix`, don't ask for the App ID Prefix. If one says a registration's prefix is invalid, tell the user to fix it in the Clerk Dashboard, then rerun.
2. Otherwise, if one asks for the Bundle ID, ask the user for only the Bundle ID and rerun the same command with `--bundle-id <bundle_id>`, even when the App ID Prefix is reported too.
3. If the App ID Prefix is still reported, ask the user for it and rerun with the same flags plus `--app-id-prefix <app_id_prefix>`.

The App ID Prefix comes from Apple Developer and is usually the Team ID shown in Xcode › Settings › Accounts, but it can differ. Once setup knows the Bundle ID, it reads the prefix from a matching Clerk registration or the target's signing team, so the prefix is only reported missing when more than one registration matches, or when none matches and the target has no single signing team. If the user has given an App ID Prefix, pass it with `--app-id-prefix <app_id_prefix>` on every run, the first included, unless step 1 dropped it, because setup otherwise uses a matching registration's prefix, or else the signing team's, without asking.

If setup stops with `selection-required`, `setup-interrupted`, or an `input-required` that has no `identity` object, follow its handling in the [iOS setup prompt](https://clerk.com/docs/ios/getting-started/quickstart.md). Read the JSON result even when the command exits with an error; if it prints no JSON, report the error it printed. When it has a `handoff`, finish any step in `handoff.remaining` that this flow needs, such as linking a missing product in Xcode, before continuing with this flow.

Keep the existing `Clerk.configure` call, its key loading, and existing capabilities.

## Source-Driven Requirements

When flow details are unclear, read the installed package source from Xcode DerivedData:

- `~/Library/Developer/Xcode/DerivedData/.../SourcePackages/checkouts/clerk-ios`

Source priority rules for custom flow:

- Primary source: installed `ClerkKitUI` source for auth UI behavior and gating parity.
- Secondary source: installed `ClerkKit` source for core auth/network/config behavior.
- Fallback only: example apps (local or GitHub) when behavior is unclear from library source.

For custom flows, treat `ClerkKitUI` `AuthView` as a strict parity target for:

- step progression/sequencing
- field visibility and hidden-state rules per step
- branching between factors/strategies
- screen structure and layout composition per step
- view hierarchy and section ordering per step

## Required Patterns

1. Runtime environment gating

- Read the instance's settings at runtime from the injected Clerk instance's `environment`, as `AuthView` does: `@Environment(Clerk.self) private var clerk`, then `clerk.environment` (for example `clerk.environment?.userSettings`).
- Gate identifiers, factors, social and Apple sign-in, and required sign-up fields on those values, using the same fields and semantics as `ClerkKitUI`.
- Don't hardcode the instance's current settings into the flow, and don't call `/v1/environment` directly. Settings can change in the Clerk Dashboard without an app update.

2. Combined-entry default

- Keep a combined sign-in-or-sign-up entry by default.
- Do not add a local sign-in/sign-up mode switcher unless explicitly requested.

3. AuthView progression parity

- Follow `ClerkKitUI` `AuthView` progression logic for advancing/regressing steps.
- Show/hide inputs exactly according to the active step requirements instead of static form layouts.
- Keep factor/strategy branching aligned with how `AuthView` gates transitions.
- Keep screen layout and component structure very close to `AuthView` defaults unless the developer explicitly requests a different UX.
- Keep view hierarchy and section ordering close to `AuthView` on each step; do not redesign the information architecture unless explicitly requested.
- Break the custom flow into multiple step screens/states similar to `AuthView`; do not try to gather all signup/signin requirements in one view.
- If proposed custom layout materially deviates from `AuthView`, stop and ask for explicit developer approval before implementing.

4. Multi-file organization and separation of concerns

- Break custom auth flow into focused files/modules instead of one large screen file.
- Separate UI step views, flow/state orchestration, and Clerk/network integration responsibilities.
- Keep per-file responsibilities narrow and composable so new factors/steps can be added without rewriting a monolithic view.

5. Required-field coverage

- Collect every sign-up field the environment marks as required, at the step where `AuthView` collects it.
- Handle missing requirements the sign-up reports after each step instead of assuming a fixed field list.

6. Apple sign-in policy

- Implement Apple via native Clerk Apple path.
- Do not implement Apple through generic social-provider OAuth handling.

7. Source parity

- Follow installed `ClerkKitUI` and `ClerkKit` source patterns for sequencing, factor handling, and verification steps.
- When unsure about custom-flow implementation details, sequencing, gating, or `Environment` usage/semantics, stop guessing and reference installed `ClerkKitUI` implementation behavior.
- Resolve ambiguity by mirroring `ClerkKitUI` behavior unless the developer explicitly asks for a different approach.

## Verification Checklist

1. Prerequisites are in place

- `ClerkKit` is linked to the app target.
- If native Sign in with Apple is enabled, the target has the Sign in with Apple capability.
- Existing setup and custom key loading are unchanged.

2. No unrequested mode switcher

- No local toggle/segmented control/tabs for sign-in vs sign-up unless explicitly requested.

3. Runtime gating

- Available identifiers, factors, and providers come from the injected Clerk instance's `environment` at runtime, not hardcoded values.
- Environment fields used for gating and requirements match the set and semantics used by installed `ClerkKitUI`.

4. AuthView flow parity

- Step transitions follow `AuthView` progression rules.
- Inputs shown at each step match `AuthView` step-level visibility behavior.
- Step layouts and component grouping are materially close to `AuthView`; do not introduce major layout redesign unless explicitly requested.
- View hierarchy/section ordering remain close to `AuthView` across steps unless explicitly requested otherwise.
- Flow is split across multiple steps like `AuthView`; required data is not collected in one monolithic screen.
- When implementation ambiguity appears, final behavior matches installed `ClerkKitUI` rather than an inferred/custom interpretation.

5. Flow organization quality

- Custom flow code is split into multiple focused files/modules (not a single monolithic auth view file).
- UI, state/flow orchestration, and integration logic are separated with clear boundaries.

6. Required fields covered

- Every sign-up field the environment marks as required is collected.

7. Apple path correctness

- Apple flow uses native path, not generic provider OAuth path.

8. No unrequested prebuilt dependency

- `ClerkKitUI` is not added unless explicitly needed.
