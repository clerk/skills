---
name: custom-auth-ui
description: Build custom sign-in and sign-up UIs with Clerk hooks. Use when you need full control over auth UI, custom forms, multi-step flows, or want your own design instead of prebuilt components.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Custom Auth UI Skill

Build completely custom authentication flows with Clerk hooks. This is Bryce's #2 priority - customization that lives in YOUR codebase.

> **Note**: Clerk Elements is deprecated. Use the hooks-based approach shown here.

## Why Custom UI?

The shadcn model won - developers want:
- Source in their codebase
- Full control over styling
- Ability to iterate with their dev flow
- Custom validation and UX

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
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // Create sign-in attempt with password strategy
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        // Set the active session
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      } else {
        // Handle other statuses (MFA, etc.)
        console.log('Sign-in status:', result.status);
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={isLoading || !isLoaded}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
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
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      // Create sign-up attempt
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setStep('verify');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Sign-up failed');
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Verification failed');
    }
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p>Check your email for a verification code</p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter code"
          required
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

## SignIn Resource Methods

The `signIn` object from `useSignIn()`:

```typescript
interface SignInResource {
  status: 'needs_identifier' | 'needs_first_factor' | 'needs_second_factor' | 'complete' | null;

  // Create sign-in attempt
  create(params: SignInCreateParams): Promise<SignInResource>;

  // First factor (email code, phone code, password)
  prepareFirstFactor(params: PrepareFirstFactorParams): Promise<SignInResource>;
  attemptFirstFactor(params: AttemptFirstFactorParams): Promise<SignInResource>;

  // Second factor (MFA)
  prepareSecondFactor(params: PrepareSecondFactorParams): Promise<SignInResource>;
  attemptSecondFactor(params: AttemptSecondFactorParams): Promise<SignInResource>;

  // OAuth
  authenticateWithRedirect(params): Promise<void>;

  // Passkeys
  authenticateWithPasskey(params?): Promise<SignInResource>;

  // Password reset
  resetPassword(params): Promise<SignInResource>;
}
```

## SignIn Create Strategies

```typescript
// Password (most common)
await signIn.create({
  identifier: 'user@example.com',
  password: 'password123',
});

// Email code (passwordless)
await signIn.create({
  strategy: 'email_code',
  identifier: 'user@example.com',
});
// Then: prepareFirstFactor + attemptFirstFactor

// Phone code
await signIn.create({
  strategy: 'phone_code',
  identifier: '+15551234567',
});

// OAuth
await signIn.create({
  strategy: 'oauth_google',
  redirectUrl: '/sso-callback',
});

// Passkey
await signIn.create({
  strategy: 'passkey',
});
```

## Multi-Step Sign-In (Email Code)

```tsx
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';

export function EmailCodeSignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');

  async function handleEmailSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    // Create sign-in with email code strategy
    const result = await signIn.create({
      identifier: email,
    });

    // Prepare the email code factor
    await signIn.prepareFirstFactor({
      strategy: 'email_code',
      emailAddressId: result.supportedFirstFactors?.find(
        (f) => f.strategy === 'email_code'
      )?.emailAddressId!,
    });

    setStep('code');
  }

  async function handleCodeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    const result = await signIn.attemptFirstFactor({
      strategy: 'email_code',
      code,
    });

    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
    }
  }

  // ... render forms based on step
}
```

## MFA (Two-Factor Authentication)

```tsx
async function handleMFA(totpCode: string) {
  const { signIn, setActive } = useSignIn();

  // After first factor succeeds with status 'needs_second_factor'
  const result = await signIn.attemptSecondFactor({
    strategy: 'totp',
    code: totpCode,
  });

  if (result.status === 'complete') {
    await setActive({ session: result.createdSessionId });
  }
}
```

## OAuth Sign-In

```tsx
'use client';

import { useSignIn } from '@clerk/nextjs';

export function OAuthButtons() {
  const { signIn, isLoaded } = useSignIn();

  async function handleOAuth(provider: 'oauth_google' | 'oauth_github') {
    if (!isLoaded) return;

    await signIn.authenticateWithRedirect({
      strategy: provider,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  }

  return (
    <div className="space-y-2">
      <button onClick={() => handleOAuth('oauth_google')}>
        Continue with Google
      </button>
      <button onClick={() => handleOAuth('oauth_github')}>
        Continue with GitHub
      </button>
    </div>
  );
}
```

Create the SSO callback page:

```tsx
// app/sso-callback/page.tsx
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}
```

## SignUp Resource Methods

The `signUp` object from `useSignUp()`:

```typescript
interface SignUpResource {
  status: 'missing_requirements' | 'complete' | null;

  // Create sign-up
  create(params: SignUpCreateParams): Promise<SignUpResource>;

  // Email verification
  prepareEmailAddressVerification(params): Promise<SignUpResource>;
  attemptEmailAddressVerification(params): Promise<SignUpResource>;

  // Phone verification
  preparePhoneNumberVerification(params): Promise<SignUpResource>;
  attemptPhoneNumberVerification(params): Promise<SignUpResource>;

  // OAuth
  authenticateWithRedirect(params): Promise<void>;
}
```

## Complete Sign-Up Flow

```tsx
'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Step = 'form' | 'verify-email' | 'verify-phone' | 'complete';

export function CompleteSignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<Step>('form');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [code, setCode] = useState('');

  async function handleInitialSubmit() {
    if (!isLoaded) return;

    await signUp.create({
      emailAddress: formData.email,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
    });

    await signUp.prepareEmailAddressVerification({
      strategy: 'email_code',
    });

    setStep('verify-email');
  }

  async function handleEmailVerify() {
    if (!isLoaded) return;

    const result = await signUp.attemptEmailAddressVerification({
      code,
    });

    if (result.status === 'complete') {
      await setActive({ session: result.createdSessionId });
      router.push('/dashboard');
    } else if (result.status === 'missing_requirements') {
      // Need more verification (e.g., phone)
      setStep('verify-phone');
    }
  }

  // ... render based on step
}
```

## Password Validation

```tsx
import { useSignUp } from '@clerk/nextjs';

export function PasswordInput() {
  const { signUp } = useSignUp();
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  function handlePasswordChange(value: string) {
    setPassword(value);

    // Real-time validation
    signUp?.validatePassword(value, {
      onValidation: (result) => {
        if (result.complexity) {
          setErrors(result.complexity.map((c) => c.message));
        }
      },
    });
  }

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => handlePasswordChange(e.target.value)}
      />
      {errors.map((err) => (
        <p key={err} className="text-red-600 text-sm">{err}</p>
      ))}
    </div>
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
const result = await signIn.create({ identifier, password });
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
  default:
    console.log('Unhandled status:', result.status);
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

## Documentation

- [useSignIn Reference](https://clerk.com/docs/reference/react/use-sign-in)
- [useSignUp Reference](https://clerk.com/docs/reference/react/use-sign-up)
- [Custom Sign-In Flow](https://clerk.com/docs/custom-flows/sign-in)
- [Custom Sign-Up Flow](https://clerk.com/docs/custom-flows/sign-up)
- [OAuth with Custom UI](https://clerk.com/docs/custom-flows/oauth-connections)
