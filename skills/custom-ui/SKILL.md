---
name: custom-ui
description: Build custom sign-in/sign-up flows and customize component appearance. Use for custom auth flows, appearance styling, non-standard patterns.
allowed-tools: WebFetch
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Custom UI

> **Prerequisite**: Ensure `ClerkProvider` wraps your app. See `setup/`.

## Decision Tree

### Custom Flows

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

### Appearance

| Task | Documentation |
|------|---------------|
| Overview | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview |
| Layout options | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/layout |
| Variables (colors, fonts) | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables |
| Themes | https://clerk.com/docs/guides/customizing-clerk/appearance-prop/themes |

## Custom Flow Mental Model

`useSignIn` and `useSignUp` are state machines:

```
SignInStatus: needs_identifier | needs_first_factor | needs_second_factor | needs_new_password | complete
SignUpStatus: missing_requirements | abandoned | complete
```

## Custom Flow Pattern

```typescript
// Full sign-in flow (from official docs)
const handleSubmit = async () => {
  if (!isLoaded) return

  try {
    const signInAttempt = await signIn.create({
      identifier: email,
      password,
    })

    if (signInAttempt.status === 'complete') {
      await setActive({ session: signInAttempt.createdSessionId })
      router.push('/')
    } else if (signInAttempt.status === 'needs_second_factor') {
      // Handle 2FA - see MFA docs
    } else {
      console.error('Unhandled status:', signInAttempt.status)
    }
  } catch (err) {
    // See error-handling docs
    console.error(err)
  }
}
```

## Appearance Pattern

```typescript
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#0000ff',
      borderRadius: '0.5rem',
    },
    layout: {
      logoImageUrl: '/logo.png',
      socialButtonsVariant: 'iconButton',
    },
  }}
/>
```

### variables (colors, typography, borders)

| Property | Description |
|----------|-------------|
| `colorPrimary` | Primary color throughout |
| `colorBackground` | Background color |
| `borderRadius` | Border radius (default: `0.375rem`) |

### layout (structure, logo, social buttons)

| Property | Description |
|----------|-------------|
| `logoImageUrl` | URL to custom logo |
| `socialButtonsVariant` | `'blockButton'` \| `'iconButton'` \| `'auto'` |
| `socialButtonsPlacement` | `'top'` \| `'bottom'` |

## Workflow

1. Identify auth method from user requirements
2. WebFetch the appropriate URL from decision tree above
3. Follow official code examples from the docs
4. Handle ALL status values (not just `complete`)
5. Call `setActive()` after successful auth

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
| Colors not applying | Wrong property | Use `colorPrimary` not `primaryColor` |
| Logo not showing | Missing wrapper | Put `logoImageUrl` inside `layout: {}` |
| Social buttons wrong | Missing variant | Add `socialButtonsVariant: 'iconButton'` in `layout` |
| Catch-all 404 | Wrong folder | Use `[[...sign-in]]` folder naming |

## See Also

- [Custom Flows Overview](https://clerk.com/docs/guides/development/custom-flows/overview)
- [useSignIn](https://clerk.com/docs/reference/hooks/use-sign-in)
- [useSignUp](https://clerk.com/docs/reference/hooks/use-sign-up)
- [Appearance Prop Overview](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/overview)
- [Layout Options](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/layout)
- [Variables Reference](https://clerk.com/docs/guides/customizing-clerk/appearance-prop/variables)
