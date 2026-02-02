---
name: clerk-best-practices
description: Auth best practices codified in Clerk's prebuilt UI components. Use when building custom auth flows to match the security and UX standards Clerk handles automatically.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Auth Best Practices

> Clerk's prebuilt components (`<SignIn />`, `<SignUp />`, `<UserProfile />`, etc.) implement dozens of auth best practices automatically. When you build custom auth flows, use this skill to ensure you match those same standards.

## When to Use This Skill

- Building custom sign-in/sign-up forms instead of using prebuilt components
- Reviewing an existing auth implementation for gaps
- Deciding between prebuilt vs custom flows (start here to understand what you'd need to replicate)

## Quick Reference

| Category | Impact | What Clerk Handles Automatically |
|----------|--------|----------------------------------|
| Password validation | CRITICAL | Strength requirements, breach detection, zxcvbn scoring |
| Email verification | CRITICAL | OTP delivery, expiration, retry limits |
| Bot protection | CRITICAL | CAPTCHA integration, rate limiting on attempts |
| Session management | CRITICAL | Short-lived JWTs, automatic refresh, revocation |
| Multi-factor auth | HIGH | TOTP, SMS, backup codes, recovery flows |
| OAuth flows | HIGH | PKCE, state parameter, nonce validation, token exchange |
| Error handling | HIGH | Generic messages that don't leak user existence |
| Brute-force protection | HIGH | Account lockout after failed attempts, progressive delays |
| Input sanitization | HIGH | XSS prevention in all user-supplied fields |
| Accessibility | MEDIUM | ARIA labels, focus management, keyboard navigation, screen reader support |
| Loading states | MEDIUM | Disabled buttons during submission, progress indicators |
| Redirect safety | MEDIUM | Allowlisted redirect URLs, open-redirect prevention |

<!-- TODO: Add detailed section for each category below. Each should include:
     - What the prebuilt component does automatically
     - Code examples showing the correct custom implementation
     - Clerk SDK helpers that make it easier (e.g. useSignIn, useSignUp hooks)
     - Links to relevant Clerk docs -->

### Password Validation

<!-- TODO: Document password strength rules Clerk enforces by default (min length,
     breach detection via zxcvbn). Show how to replicate with custom forms using
     Clerk's password settings API or client-side validation. -->

### Email Verification

<!-- TODO: Document OTP flow lifecycle — delivery, expiration window, retry/resend
     limits. Show prepareEmailAddressVerification / attemptEmailAddressVerification
     usage in custom flows. -->

### Bot Protection

<!-- TODO: Document CAPTCHA integration options (Turnstile, etc.), how Clerk gates
     sign-up/sign-in attempts, and how to configure bot protection in Dashboard. -->

### Session Management

<!-- TODO: Document short-lived JWT strategy, token refresh lifecycle, session
     revocation. Cover getToken(), session.touch(), and multi-session handling. -->

### Multi-Factor Auth

<!-- TODO: Document TOTP enrollment flow, SMS fallback, backup codes generation
     and redemption. Show how to check MFA status in sessionClaims and enforce
     step-up auth in custom flows. -->

### OAuth Flows

<!-- TODO: Document PKCE flow, state/nonce validation, token exchange. Show
     authenticateWithRedirect usage and how Clerk handles the callback. Cover
     social connection configuration and account linking. -->

### Error Handling

<!-- TODO: Document the principle of generic error messages that don't reveal
     user existence. Show Clerk's error object structure (clerkError.errors[])
     and how to map codes to user-friendly messages without leaking info. -->

### Brute-Force Protection

<!-- TODO: Document account lockout thresholds, progressive delays, and how
     Clerk signals lockout state. Show how to surface lockout messaging in
     custom UIs. -->

### Input Sanitization

<!-- TODO: Document XSS vectors in auth forms (name fields, OAuth profile data,
     error messages). Show safe rendering patterns for user-supplied content
     returned from Clerk APIs. -->

### Accessibility

<!-- TODO: Document ARIA patterns for auth forms — labels, live regions for
     errors, focus management after submission, keyboard navigation, screen
     reader announcements. Reference WCAG 2.1 AA requirements. -->

### Loading States

<!-- TODO: Document button disabled states during async operations, progress
     indicators, preventing double submission. Show patterns using isLoaded /
     status from Clerk hooks. -->

### Redirect Safety

<!-- TODO: Document open-redirect risks, how Clerk validates redirect URLs
     against allowlisted origins in Dashboard, and how to replicate that
     validation in custom redirect logic. -->

## Common Pitfalls

| Pitfall | Impact | What to Do |
|---------|--------|------------|
| Leaking whether an email is registered via error messages | CRITICAL | Use generic messages like "If an account exists, we sent a code" |
| Storing passwords with weak hashing | CRITICAL | Never store passwords client-side; rely on Clerk's backend |
| Skipping CSRF protection on auth endpoints | CRITICAL | Use Clerk's server-side auth helpers which handle this |
| Not validating redirect URLs after sign-in | HIGH | Only redirect to allowlisted origins |
| Missing rate limiting on OTP/password attempts | HIGH | Clerk enforces this; if custom, add server-side rate limits |
| Not enforcing MFA when enabled for the org/app | HIGH | Check `sessionClaims` for MFA status before granting access |
| Rendering auth errors with raw HTML | HIGH | Always text-encode error messages to prevent XSS |
| Long-lived sessions without refresh | MEDIUM | Use short-lived tokens with rotation; Clerk does this by default |
| Missing loading/disabled states on submit buttons | MEDIUM | Prevent double submissions and show feedback |
| No keyboard navigation in custom auth forms | MEDIUM | Test tab order, focus traps in modals, enter-to-submit |

<!-- TODO: Expand pitfalls table with more entries as individual sections above
     are fleshed out. Each section will likely surface additional pitfalls
     specific to that category. -->

## See Also

- `clerk-custom-ui` - Building custom sign-in/sign-up components
- `clerk-setup` - Initial Clerk setup with prebuilt components
- `clerk-nextjs-patterns` - Server-side auth patterns
- [Clerk Security Docs](https://clerk.com/docs/security/overview)
