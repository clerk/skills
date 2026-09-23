# Custom Flow Reference (ClerkKit)

Use this file when the developer asks for a custom Swift authentication experience in a native iOS or macOS app. Use the native-aware setup path in [../SKILL.md](../SKILL.md) first when available; custom UI is separate from project provisioning. By default, keep the custom flow's step structure and layout close to ClerkKitUI's `AuthView` unless the developer requests a different UX.

## Source of truth

Inspect the version of `ClerkKit` actually linked by the Xcode target. Use its public API and installed source for authentication, verification, and session behavior. `ClerkKitUI`'s `AuthView` is a useful behavioral reference for step sequencing and feature gates, even when the custom app does not link ClerkKitUI. Example apps are a fallback when library source leaves a question unanswered.

Do not assume a package checkout lives at one fixed DerivedData path. Resolve the package from the selected project's Swift Package Manager dependencies or Xcode's current source checkout.

## Setup boundary

1. Confirm the selected target is configured and links `ClerkKit`. Do not reinstall or rewrite setup that the native-aware CLI already completed. On a fresh target, native `clerk init` currently links both `ClerkKit` and `ClerkKitUI` even without UI scaffolding; do not remove the latter merely to make the graph look core-only. A source-proven existing custom integration can remain `ClerkKit`-only. For manual setup, add `ClerkKitUI` only if the implementation uses a prebuilt component or the developer requests a hybrid flow.
2. Preserve existing `Clerk.configure(...)` calls and custom key sources. A manually chosen `--app` identifies the intended Clerk application for CLI reconciliation, but it does not prove a dynamic key matches that application.
3. Check only platform capabilities relevant to the requested flow: iOS Associated Domains where needed, macOS outgoing-network access for sandboxed apps, and the Sign in with Apple entitlement when native Apple sign-in is requested or already enabled. Do not enable a provider merely because custom UI could display it.
4. If the installed CLI cannot safely handle the target, use the current SDK source and native quickstart for focused manual changes. Report uncertain ownership or configuration instead of editing a generated or ambiguous project.

The SDK obtains its environment at runtime. A direct `/v1/environment` call and a hand-built capability matrix are not universal prerequisites for custom UI work. When a requested feature depends on instance settings, inspect the SDK's gating semantics and obtain only the configuration evidence needed for that feature. Never write environment responses or private credentials into project source.

## Implementation patterns

- Keep a combined sign-in-or-sign-up entry by default. Add a local mode switch only when requested or when the chosen UX requires one.
- Model the actual supported strategies and required fields of the linked Clerk instance. Show inputs for the active step rather than collecting every possible factor on one screen.
- Use `AuthView` as a behavioral parity reference for step transitions, factor branching, verification, and recovery. Keep the step layouts and hierarchy materially close to its defaults unless the developer explicitly requests a different design.
- Split a substantial flow into focused UI, state/orchestration, and Clerk integration components. Avoid a monolithic view that mixes every step and network operation.
- For native Sign in with Apple, use Clerk's native Apple path, not a generic web social-OAuth flow. Verify its entitlement and native connection independently of the button's presence.
- When the installed SDK API or instance behavior is unclear, investigate before inventing method names, field requirements, or transition semantics.

## Verification

- The selected app target's startup path configures Clerk and injects `Clerk.shared` into the mounted root.
- The custom flow handles the enabled methods and required fields it claims to support, including verification and error/retry states.
- Step transitions and default layouts remain close to `AuthView` unless a different UX was requested.
- iOS/macOS capabilities match the features actually used, without unrequested provider changes.
- Native-aware `clerk doctor` reports configuration findings when available. Build and exercise the custom flow in Xcode separately; Doctor does not run the app.
