# Prebuilt Flow Reference (ClerkKitUI)

Use this file only when flow type is `prebuilt`.

## Purpose

Implement native iOS auth with prebuilt ClerkKitUI components, defaulting to combined auth in a sheet.

## Required Patterns

1. Package products
- Add `ClerkKit` and `ClerkKitUI`.

2. Signed-out entry pattern
- Prefer `UserButton` with `signedOutContent` for signed-out entry affordance.
- Use signed-out content action to open the auth sheet.

3. Auth presentation pattern
- Present `AuthView()` in a sheet by default.
- Keep default combined behavior from `AuthView()` (no sign-in-only/sign-up-only override by default).
- Do not use full-screen replacement or push navigation by default unless explicitly requested.

4. Apple capability requirement
- If Apple is enabled in the environment and the app is missing Sign in with Apple capability, add it.

## Verification Checklist

1. Default entry is prebuilt + sheet
- Signed-out state uses `UserButton(signedOutContent:)` (or explicitly approved alternative).
- `AuthView()` is presented in `.sheet`.

2. No default sign-in-only/sign-up-only prebuilt mode
- Default entry uses `AuthView()` behavior (combined).

3. Apple capability when enabled
- If environment enables Apple and capability was missing, Sign in with Apple capability is added.
