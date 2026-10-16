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
- If native Sign in with Apple is enabled for this app, the target needs the Sign in with Apple capability. `npx -y clerk@latest doctor` reports the Apple connection and whether each configuration has the entitlement.
- To enable it, run `npx -y clerk@latest init --sign-in-with-apple --json` from the project directory. It configures Clerk and adds the entitlement. If the CLI isn't available, add the capability in Xcode.

These `init` commands need a linked project. With `--json`, an unlinked project returns `status: "application-required"`: rerun with `--app <application_id>` for the application whose `publishable_key` matches the app's existing key, from `npx -y clerk@latest apps list --json`.

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
