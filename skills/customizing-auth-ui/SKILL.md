---
name: customizing-auth-ui
description: Build custom sign-in and sign-up UIs with Clerk hooks. Use when you need full control over auth UI, custom forms, multi-step flows, or branded authentication experiences.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Customizing Authentication UI

Build fully custom sign-in and sign-up experiences using Clerk's hooks.

## When to Customize

| Use Pre-built Components | Use Custom UI |
|-------------------------|---------------|
| Quick setup | Specific design requirements |
| Standard auth flows | Multi-step onboarding |
| `appearance` prop works | Full brand control |

## Templates

| Template | Use Case |
|----------|----------|
| `templates/sign-in-password.tsx` | Email + password sign-in |
| `templates/sign-up-verify.tsx` | Sign-up with email verification |
| `templates/oauth-buttons.tsx` | Google, GitHub OAuth buttons |
| `templates/multi-step-flow.tsx` | Multi-step onboarding |

## Key Hooks

```tsx
import { useSignIn, useSignUp } from '@clerk/nextjs';

const { signIn, setActive } = useSignIn();
const { signUp, setActive } = useSignUp();
```

## Common Pitfalls

- **Check `isLoaded` before using hooks** - `signIn`/`signUp` are undefined until loaded
- **Call `setActive()` after sign-in** - session won't activate without it
- **Handle all statuses** - `complete`, `needs_first_factor`, `needs_second_factor`
- **Import error helper**: `import { isClerkAPIResponseError } from '@clerk/nextjs/errors'`

## See Also

- `adding-auth/` - Basic auth setup (start here first)
- `nextjs-patterns/` - Advanced Next.js patterns

## Documentation

- [Custom Flows](https://clerk.com/docs/custom-flows/overview)
- [useSignIn Hook](https://clerk.com/docs/references/react/use-sign-in)
- [useSignUp Hook](https://clerk.com/docs/references/react/use-sign-up)
