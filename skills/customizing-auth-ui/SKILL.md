---
name: customizing-auth-ui
description: Build custom sign-in and sign-up UIs with Clerk hooks. Use when you need full control over auth UI, custom forms, multi-step flows, or branded authentication experiences.
license: MIT
metadata:
  author: clerk
  version: '1.0.0'
---

# Customizing Authentication UI

Build fully custom sign-in and sign-up experiences using Clerk's hooks, also known as [custom flows](https://clerk.com/docs/guides/development/custom-flows/overview).

## When to Customize

If [prebuilt components](https://clerk.com/docs/reference/components/overview) don't meet your specific needs or if you require more control over the logic, this skill will help you rebuild the existing Clerk flows using the Clerk API.

> [!IMPORTANT]
> Custom flows are considered **advanced** and are generally not recommended for most use cases. They require more development effort and are not as easy to maintain as the prebuilt components.

| Use Pre-built Components | Use Custom UI                |
| ------------------------ | ---------------------------- |
| Quick setup              | Specific design requirements |
| Standard auth flows      | Multi-step onboarding        |
| `appearance` prop works  | Full brand control           |

## Templates

| Template                         | Use Case                        |
| -------------------------------- | ------------------------------- |
| `templates/sign-in-password.tsx` | Email + password sign-in        |
| `templates/sign-up-verify.tsx`   | Sign-up with email verification |
| `templates/oauth-buttons.tsx`    | Google, GitHub OAuth buttons    |
| `templates/multi-step-flow.tsx`  | Multi-step onboarding           |

## Key Hooks

The [`useSignUp`](https://clerk.com/docs/docs/reference/javascript/hooks/use-sign-up) and [`useSignIn`](https://clerk.com/docs/docs/reference/javascript/hooks/use-sign-in) hooks are used to build the custom sign-in and sign-up flows.

```tsx
const { signIn, setActive, isLoaded } = useSignIn()
const { signUp, setActive, isLoaded } = useSignUp()
```

## Common Pitfalls

- **Check `isLoaded` before using hooks**: `signIn`/`signUp` are undefined until loaded.
- **Call `setActive()` after sign-in**: Session won't activate without it.
- **Handle all statuses**: `complete`, `needs_first_factor`, `needs_second_factor`
- **Import error helper**: `import { isClerkAPIResponseError } from '@clerk/nextjs/errors'`

## See Also

- `adding-auth/` - Basic auth setup (start here first)
- `nextjs-patterns/` - Advanced Next.js patterns

## Documentation

- [Custom flows overview](https://clerk.com/docs/guides/development/custom-flows/overview)
- [`useSignIn()` hook](https://clerk.com/docs/reference/hooks/use-sign-in)
- [`useSignUp()` hook](https://clerk.com/docs/reference/hooks/use-sign-up)
