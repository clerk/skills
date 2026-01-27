---
name: custom-flows
description: Build custom sign-in/sign-up flows with Clerk hooks. Use when pre-built components don't fit design requirements, for multi-step onboarding, or non-standard auth patterns.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.1.0"
---

# Custom Authentication Flows

> **Prerequisite**: Ensure `ClerkProvider` wraps your app. See `setup/`.

## Mental Model

`useSignIn` and `useSignUp` are state machines:

```
SignInStatus: needs_identifier | needs_first_factor | needs_second_factor | needs_new_password | complete
SignUpStatus: missing_requirements | abandoned | complete
```

## Imports

```typescript
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
import type { EmailCodeFactor, PhoneCodeFactor } from '@clerk/types';
```

## Decision Tree

| Auth Flow | Documentation |
|-----------|---------------|
| Email + Password | https://clerk.com/docs/guides/development/custom-flows/authentication/email-password |
| Sign Up | https://clerk.com/docs/guides/development/custom-flows/authentication/sign-in-or-up |
| OAuth | https://clerk.com/docs/guides/development/custom-flows/authentication/oauth-connections |
| Magic Link | https://clerk.com/docs/guides/development/custom-flows/authentication/email-links |
| Phone + SMS | https://clerk.com/docs/guides/development/custom-flows/authentication/email-sms-otp |
| Passkeys | https://clerk.com/docs/guides/development/custom-flows/authentication/passkeys |
| MFA | https://clerk.com/docs/guides/development/custom-flows/authentication/email-password-mfa |
| Enterprise SSO | https://clerk.com/docs/guides/development/custom-flows/authentication/enterprise-connections |

## Status Switch Template

```typescript
switch (signInAttempt.status) {
  case 'complete':
    await setActive({ session: signInAttempt.createdSessionId });
    break;
  case 'needs_second_factor':
    // Handle 2FA (TOTP, SMS, etc.)
    break;
  case 'needs_first_factor':
    // Handle additional verification
    break;
  case 'needs_identifier':
    // Request email/phone
    break;
  case 'needs_new_password':
    // Password reset flow
    break;
}
```

## Best Practices

- Check `isLoaded` before accessing hook data: `if (!isLoaded) return null`
- Handle ALL status values with switch statement
- Call `setActive()` after `complete`
- Clear password from state after submission

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Access `signIn` before `isLoaded` | Runtime error | `if (!isLoaded) return null` |
| Only handle `complete` status | Breaks on MFA | Switch on all statuses |
| Clerk call on every keystroke | Rate limits | Submit on button click |

## See Also

- [Custom Flows Overview](https://clerk.com/docs/guides/development/custom-flows/overview)
- [useSignIn](https://clerk.com/docs/reference/hooks/use-sign-in)
- [useSignUp](https://clerk.com/docs/reference/hooks/use-sign-up)
