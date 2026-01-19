---
name: ios
description: iOS and watchOS authentication with ClerkKit and ClerkKitUI. Use when building iOS apps with Clerk, implementing SwiftUI auth flows, or syncing auth with watchOS.
license: MIT
metadata:
  author: mike-pitre
  version: "1.0.0"
---

# Clerk iOS Skill

> **Coming Soon**: This skill is being contributed by Mike Pitre.
>
> For now, see the source repository: [clerk-ios-skill](https://github.com/clerk/clerk-ios-skill)

## What's Coming

This skill will cover:

- **ClerkKit**: Low-level SDK for custom auth flows
- **ClerkKitUI**: Pre-built components (AuthView, UserButton)
- **Watch Connectivity**: Sync auth state with watchOS companion apps
- **Authentication Methods**: Password, OTP, OAuth, Apple, Passkeys, Enterprise SSO
- **MFA**: Phone code, email code, TOTP, backup codes
- **Session Management**: Multi-session support, token retrieval

## Workflow Chooser (Preview)

```
iOS approach?
├─ Prebuilt UI (fast) → ClerkKitUI: AuthView, UserButton
├─ Custom flows (branded) → ClerkKit: clerk.auth.*
└─ Watch sync → watchConnectivityEnabled: true
```

## Contribute

Want to help bring this skill to life? Check out:
- [clerk-ios-skill](https://github.com/clerk/clerk-ios-skill) - Source repository
- [Clerk iOS SDK Docs](https://clerk.com/docs/references/ios/overview)

## See Also

- `adding-auth/` - Web framework setup (Next.js, React, Express)
- `customizing-auth-ui/` - Custom auth UI patterns (web)
