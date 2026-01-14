---
name: custom-auth-ui
description: Build custom sign-in and sign-up UIs with Clerk hooks. Use when you need full control over auth UI, custom forms, multi-step flows, or want your own design instead of prebuilt components.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Custom Auth UI Skill

Build completely custom authentication flows with Clerk hooks.

## Quick Start: Custom Sign-In

```tsx
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export function CustomSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Sign-in failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

## Quick Start: Custom Sign-Up

```tsx
'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export function CustomSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'form' | 'verify'>('form');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    await signUp.create({ emailAddress: email, password });
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    setStep('verify');
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    const result = await signUp.attemptEmailAddressVerification({ code });
    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
      router.push('/dashboard');
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify}>
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code" />
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## Common Gotchas

### 1. Forgetting `setActive`

```typescript
// WRONG - User signed in but no session set
const result = await signIn.create({ identifier, password });
if (result.status === 'complete') {
  router.push('/dashboard'); // User won't be authenticated!
}

// RIGHT - Set active session
if (result.status === 'complete') {
  await setActive({ session: result.createdSessionId });
  router.push('/dashboard');
}
```

### 2. Not handling all statuses

```typescript
// WRONG - Only handling 'complete'
if (result.status === 'complete') { ... }

// RIGHT - Handle all statuses
switch (result.status) {
  case 'complete':
    await setActive({ session: result.createdSessionId });
    break;
  case 'needs_first_factor':
    setStep('verify');
    break;
  case 'needs_second_factor':
    setStep('mfa');
    break;
}
```

### 3. Missing 'use client' directive

Custom auth UIs use hooks - they must be client components:

```tsx
// WRONG - Server component can't use hooks
import { useSignIn } from '@clerk/nextjs';

// RIGHT - Add directive
'use client';
import { useSignIn } from '@clerk/nextjs';
```

### 4. Not checking `isLoaded`

```typescript
// WRONG - May fail if Clerk not loaded
async function handleSubmit() {
  await signIn.create({ ... }); // signIn might be undefined!
}

// RIGHT - Check isLoaded first
async function handleSubmit() {
  if (!isLoaded) return;
  await signIn.create({ ... });
}
```

## Templates

Copy-paste templates for common patterns:

| Template | Description |
|----------|-------------|
| `templates/sign-in-password.tsx` | Full sign-in with password |
| `templates/sign-up-verify.tsx` | Sign-up with email verification |
| `templates/oauth-buttons.tsx` | OAuth (Google, GitHub) buttons |
| `templates/mfa-totp.tsx` | MFA with TOTP codes |

## API Reference

Detailed API documentation:

| Reference | Contents |
|-----------|----------|
| `references/sign-in-api.md` | SignIn methods, strategies, multi-step, MFA |
| `references/sign-up-api.md` | SignUp methods, verification, password validation |

## Documentation

- [useSignIn Reference](https://clerk.com/docs/reference/react/use-sign-in)
- [useSignUp Reference](https://clerk.com/docs/reference/react/use-sign-up)
- [Custom Sign-In Flow](https://clerk.com/docs/custom-flows/sign-in)
- [Custom Sign-Up Flow](https://clerk.com/docs/custom-flows/sign-up)
- [OAuth with Custom UI](https://clerk.com/docs/custom-flows/oauth-connections)
