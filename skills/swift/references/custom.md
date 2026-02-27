# Custom Flow Reference (ClerkKit)

Use this file only when flow type is `custom`.

## Purpose

Implement native iOS auth with ClerkKit primitives while mirroring ClerkKitUI behavior where applicable.

## Source-Driven Requirements

Use installed package source from Xcode DerivedData:
- `~/Library/Developer/Xcode/DerivedData/.../SourcePackages/checkouts/clerk-ios`

Source priority rules for custom flow:
- Primary source: installed `ClerkKitUI` source for auth UI behavior and gating parity.
- Secondary source: installed `ClerkKit` source for core auth/network/config behavior.
- Fallback only: example apps (local or GitHub) when behavior is unclear from library source.

For custom flows, treat `ClerkKitUI` `AuthView` flow behavior as the parity target for:
- step progression/sequencing
- field visibility and hidden-state rules per step
- branching between factors/strategies

## Required Patterns

1. Quickstart prerequisite audit
- Resolve the iOS quickstart URL from the sibling `clerk-ios` README.
- Build a checklist from the quickstart and verify the current project completed all required setup.
- If required setup is missing (for example associated domains or required capabilities), add it before finishing custom auth implementation.

2. Package products
- Add `ClerkKit` by default.
- Add `ClerkKitUI` only if the developer explicitly asks for mixed prebuilt/custom composition.

3. Environment inspection + normalization
- Make a direct HTTP call to `/v1/environment` before implementation.
- Build and surface:
  - normalized ClerkKitUI-style capability matrix
  - required-field matrix
- Drive custom-flow implementation decisions from these matrices.

4. Combined-entry default
- Keep a combined sign-in-or-sign-up entry by default.
- Do not add a local sign-in/sign-up mode switcher unless explicitly requested.

5. AuthView progression parity
- Follow `ClerkKitUI` `AuthView` progression logic for advancing/regressing steps.
- Show/hide inputs exactly according to the active step requirements instead of static form layouts.
- Keep factor/strategy branching aligned with how `AuthView` gates transitions.

6. Capability-matrix-driven implementation
- Drive custom flow behavior from normalized ClerkKitUI-style capability mapping.
- Do not rely on one-off raw environment checks.

7. Required-field coverage
- Implement all required fields from required-field matrix.
- Do not ship flow with missing required fields.

8. Apple sign-in policy
- Implement Apple via native Clerk Apple path.
- If Apple capability is required for this app and missing, add it.
- Do not implement Apple through generic social-provider OAuth handling.

9. Source parity
- Follow installed `ClerkKitUI` and `ClerkKit` source patterns for sequencing, factor handling, and verification steps.

## Verification Checklist

1. Quickstart prerequisites are complete
- Quickstart link was sourced from sibling `clerk-ios` README.
- Required project setup from quickstart is present (including associated domains/capabilities when required).

2. No unrequested mode switcher
- No local toggle/segmented control/tabs for sign-in vs sign-up unless explicitly requested.

3. Environment call completed
- Direct `/v1/environment` call succeeded before coding.

4. AuthView flow parity
- Step transitions follow `AuthView` progression rules.
- Inputs shown at each step match `AuthView` step-level visibility behavior.

5. Matrices created and used
- Capability matrix and required-field matrix exist and drive the implementation.

6. Required fields covered
- Required-field matrix has full coverage in custom UI.

7. Capability-map parity
- Feature availability and branching use normalized capability map.

8. Apple path correctness
- Apple flow uses native path, not generic provider OAuth path.

9. No unrequested prebuilt dependency
- `ClerkKitUI` is not added unless explicitly needed.
