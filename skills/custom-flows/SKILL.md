---
name: custom-flows
description: Build custom sign-in/sign-up flows with Clerk hooks. Use when pre-built components don't fit design requirements, for multi-step onboarding, or non-standard auth patterns.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "2.0.0"
---

# Custom Authentication Flows

> **Prerequisite**: Complete `setup/` first.

## Mental Model

`useSignIn` and `useSignUp` are state machines:

```
SignInStatus: needs_identifier | needs_first_factor | needs_second_factor | needs_new_password | complete
SignUpStatus: missing_requirements | abandoned | complete
```

## Decision Tree

| Auth Flow | Documentation |
|-----------|---------------|
| Email + Password | https://clerk.com/docs/custom-flows/email-password |
| OAuth | https://clerk.com/docs/custom-flows/oauth-connections |
| Magic Link | https://clerk.com/docs/custom-flows/email-link |
| Phone + SMS | https://clerk.com/docs/custom-flows/phone-number |
| Passkeys | https://clerk.com/docs/custom-flows/passkeys |
| MFA | https://clerk.com/docs/custom-flows/mfa |
| SAML SSO | https://clerk.com/docs/custom-flows/saml-connections |

## Best Practices

- Check `isLoaded` before accessing hook data
- Handle ALL status values with switch statement
- Call `setActive()` after `complete`
- Clear password from state after submission

## Anti-Patterns

| Pattern | Problem | Fix |
|---------|---------|-----|
| Access `signIn` before `isLoaded` | Runtime error | `if (!isLoaded) return null` |
| Only handle `complete` status | Breaks on MFA | Switch on all statuses |
| Clerk call on every keystroke | Rate limits | Submit on button click |

## Error Handling

```typescript
import { isClerkAPIResponseError } from '@clerk/nextjs/errors';
```

## See Also

- [Custom Flows Overview](https://clerk.com/docs/custom-flows/overview)
- [useSignIn](https://clerk.com/docs/references/react/use-sign-in)
- [useSignUp](https://clerk.com/docs/references/react/use-sign-up)
