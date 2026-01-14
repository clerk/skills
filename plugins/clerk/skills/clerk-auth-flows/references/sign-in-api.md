# SignIn API Reference

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

## Documentation

- [useSignIn Reference](https://clerk.com/docs/reference/react/use-sign-in)
- [Custom Sign-In Flow](https://clerk.com/docs/custom-flows/sign-in)
- [OAuth with Custom UI](https://clerk.com/docs/custom-flows/oauth-connections)
