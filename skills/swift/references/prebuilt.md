# Prebuilt Flow Reference (ClerkKitUI)

Use this file only when flow type is `prebuilt`.

## Purpose

Implement native iOS auth with prebuilt ClerkKitUI components, defaulting to combined auth in a sheet.

## Required Patterns

1. Quickstart prerequisite audit
- Find the iOS quickstart URL in the installed `clerk-ios` package README, append `.md`, then visit and read that markdown URL.
- Build a checklist from the visited markdown quickstart and verify the current project completed all required setup.
- If required setup is missing, add it before finishing prebuilt auth implementation.
- Always add any missing Associated Domains entries and any other capabilities required by the quickstart.

2. Package products
- If `clerk-ios` is not installed, add it using the latest available release with an up-to-next-major package requirement.
- Do not pin an exact package version unless the developer explicitly requests version pinning.
- Add `ClerkKit` and `ClerkKitUI`.

3. Environment check for Apple capability
- Use `/v1/environment` response to determine whether Apple is enabled.
- In prebuilt flow, do not build capability matrices; only use environment here for Apple capability handling.

4. Signed-out entry pattern
- Prefer `UserButton` with `signedOutContent` for signed-out entry affordance.
- Use signed-out content action to open the auth sheet.

5. Auth presentation pattern
- Present `AuthView()` in a sheet by default.
- Keep default combined behavior from `AuthView()` (no sign-in-only/sign-up-only override by default).
- Do not use full-screen replacement or push navigation by default unless explicitly requested.

6. Apple capability requirement
- If Apple is enabled in the environment and the app is missing Sign in with Apple capability, add it.

## Verification Checklist

1. Quickstart prerequisites are complete
- Quickstart link was sourced from installed `clerk-ios` package README, `.md` was appended, and the markdown page was visited/read.
- Required project setup from quickstart is present.
- Any missing quickstart-required Associated Domains/capabilities were added, not just reported.

2. Default entry is prebuilt + sheet
- Signed-out state uses `UserButton(signedOutContent:)` (or explicitly approved alternative).
- `AuthView()` is presented in `.sheet`.

3. Environment check used for Apple enablement
- `/v1/environment` response was used to determine Apple-enabled state.

4. No default sign-in-only/sign-up-only prebuilt mode
- Default entry uses `AuthView()` behavior (combined).

5. Apple capability when enabled
- If environment enables Apple and capability was missing, Sign in with Apple capability is added.
