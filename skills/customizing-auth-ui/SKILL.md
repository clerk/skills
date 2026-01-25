---
name: customizing-auth-ui
description: Build custom sign-in/sign-up UIs with Clerk hooks.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Custom Authentication UI

Use custom UI when pre-built components don't meet design requirements or you need multi-step onboarding.

## Templates

| Template | Use Case |
|----------|----------|
| `templates/sign-in-password.tsx` | Email + password |
| `templates/sign-up-verify.tsx` | Sign-up with verification |
| `templates/oauth-buttons.tsx` | OAuth buttons |
| `templates/multi-step-flow.tsx` | Multi-step onboarding |

## Key Hooks

```tsx
import { useSignIn, useSignUp } from '@clerk/nextjs';
const { signIn, setActive } = useSignIn();
const { signUp, setActive } = useSignUp();
```

## Common Pitfalls

- **Check `isLoaded`** before accessing `signIn`/`signUp`
- **Call `setActive()`** after sign-in to activate session
- **Handle all statuses**: `complete`, `needs_first_factor`, `needs_second_factor`
- **Error handling**: `import { isClerkAPIResponseError } from '@clerk/nextjs/errors'`

## See Also

- `setup/` (start here)
- `nextjs-patterns/`

## Docs

[Custom Flows](https://clerk.com/docs/custom-flows/overview) | [useSignIn](https://clerk.com/docs/references/react/use-sign-in) | [useSignUp](https://clerk.com/docs/references/react/use-sign-up)
