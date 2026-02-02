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

## Rules

Individual best practices are documented in the [`rules/`](rules/) directory, organized by category. See [`rules/_sections.md`](rules/_sections.md) for the full list of categories and impact levels.

| Category | Impact | Rules |
|----------|--------|-------|
| Password validation | CRITICAL | [Strength requirements](rules/password-strength.md), [Breach detection](rules/password-breach-detection.md) |
| Email verification | CRITICAL | [OTP lifecycle](rules/email-otp-lifecycle.md) |
| Bot protection | CRITICAL | [CAPTCHA integration](rules/bot-captcha.md) |
| Session management | CRITICAL | [Short-lived tokens](rules/session-short-lived-tokens.md) |
| Multi-factor auth | HIGH | [MFA enforcement](rules/mfa-enforcement.md) |
| OAuth flows | HIGH | [PKCE and state validation](rules/oauth-pkce.md) |
| Error handling | HIGH | [Generic error messages](rules/error-generic-messages.md) |
| Brute-force protection | HIGH | [Lockout messaging](rules/brute-lockout.md) |
| Input sanitization | HIGH | [XSS prevention](rules/input-xss-prevention.md) |
| Accessibility | MEDIUM | [Auth form patterns](rules/a11y-form-patterns.md) |
| Loading states | MEDIUM | [Submit state handling](rules/loading-submit-states.md) |
| Redirect safety | MEDIUM | [URL validation](rules/redirect-url-validation.md) |

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

## See Also

- `clerk-custom-ui` - Building custom sign-in/sign-up components
- `clerk-setup` - Initial Clerk setup with prebuilt components
- `clerk-nextjs-patterns` - Server-side auth patterns
- [Clerk Security Docs](https://clerk.com/docs/security/overview)
