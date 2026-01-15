---
name: customizing-auth-ui
description: Build custom sign-in and sign-up UIs with Clerk hooks. Use when you need full control over auth UI, custom forms, multi-step flows, or branded authentication experiences.
license: MIT
metadata:
  author: clerk
  version: "1.0.0"
---

# Customizing Authentication UI

Build fully custom sign-in and sign-up experiences using Clerk's hooks and headless APIs. Perfect for when the pre-built components don't match your design system.

## When to Customize

| Use Pre-built Components | Use Custom UI |
|-------------------------|---------------|
| Quick setup | Specific design requirements |
| Standard auth flows | Multi-step onboarding |
| `appearance` prop is enough | Complex form logic |
| Time-constrained | Full brand control |

## Quick Start: Custom Sign-In

```tsx
'use client';

import { useSignIn } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  if (!isLoaded) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

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
      setError(err.errors?.[0]?.message ?? 'Sign in failed');
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  );
}
```

---

## Sign-In Strategies

### Email + Password

```tsx
const result = await signIn.create({
  identifier: email,
  password,
});
```

### Email Code (Passwordless)

```tsx
// Step 1: Start sign-in
const { supportedFirstFactors } = await signIn.create({
  identifier: email,
});

const emailFactor = supportedFirstFactors.find(
  (f) => f.strategy === 'email_code'
);

await signIn.prepareFirstFactor({
  strategy: 'email_code',
  emailAddressId: emailFactor.emailAddressId,
});

// Step 2: Verify code
const result = await signIn.attemptFirstFactor({
  strategy: 'email_code',
  code: userEnteredCode,
});
```

### OAuth (Google, GitHub, etc.)

```tsx
'use client';

import { useSignIn } from '@clerk/nextjs';

export function OAuthButtons() {
  const { signIn } = useSignIn();

  const signInWith = (strategy: 'oauth_google' | 'oauth_github') => {
    signIn?.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/dashboard',
    });
  };

  return (
    <div>
      <button onClick={() => signInWith('oauth_google')}>
        Continue with Google
      </button>
      <button onClick={() => signInWith('oauth_github')}>
        Continue with GitHub
      </button>
    </div>
  );
}
```

---

## Custom Sign-Up

### Basic Sign-Up

```tsx
'use client';

import { useSignUp } from '@clerk/nextjs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function CustomSignUp() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const router = useRouter();

  if (!isLoaded) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch (err: any) {
      console.error(err.errors?.[0]?.message);
    }
  }

  async function handleVerification(e: React.FormEvent) {
    e.preventDefault();

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error(err.errors?.[0]?.message);
    }
  }

  if (pendingVerification) {
    return (
      <form onSubmit={handleVerification}>
        <p>Check your email for a verification code</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Verification code"
        />
        <button type="submit">Verify</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### With Name Fields

```tsx
await signUp.create({
  firstName: 'John',
  lastName: 'Doe',
  emailAddress: email,
  password,
});
```

### With Metadata

```tsx
await signUp.create({
  emailAddress: email,
  password,
  unsafeMetadata: {
    plan: 'pro',
    referralCode: 'FRIEND10',
  },
});
```

---

## Multi-Step Onboarding

```tsx
'use client';

import { useSignUp } from '@clerk/nextjs';
import { useState } from 'react';

type Step = 'account' | 'verify' | 'profile' | 'complete';

export function MultiStepSignUp() {
  const { signUp, setActive } = useSignUp();
  const [step, setStep] = useState<Step>('account');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
    firstName: '',
    lastName: '',
    company: '',
  });

  async function handleAccountSubmit() {
    await signUp?.create({
      emailAddress: formData.email,
      password: formData.password,
    });
    await signUp?.prepareEmailAddressVerification({ strategy: 'email_code' });
    setStep('verify');
  }

  async function handleVerification() {
    const result = await signUp?.attemptEmailAddressVerification({
      code: formData.code,
    });
    if (result?.status === 'complete') {
      setStep('profile');
    }
  }

  async function handleProfileSubmit() {
    await signUp?.update({
      firstName: formData.firstName,
      lastName: formData.lastName,
      unsafeMetadata: { company: formData.company },
    });
    await setActive?.({ session: signUp?.createdSessionId });
    setStep('complete');
  }

  switch (step) {
    case 'account':
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleAccountSubmit(); }}>
          <h2>Step 1: Create Account</h2>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit">Continue</button>
        </form>
      );

    case 'verify':
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleVerification(); }}>
          <h2>Step 2: Verify Email</h2>
          <input
            placeholder="Verification code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />
          <button type="submit">Verify</button>
        </form>
      );

    case 'profile':
      return (
        <form onSubmit={(e) => { e.preventDefault(); handleProfileSubmit(); }}>
          <h2>Step 3: Profile</h2>
          <input
            placeholder="First name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
          <input
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
          <input
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          />
          <button type="submit">Complete</button>
        </form>
      );

    case 'complete':
      return <div>Welcome! Redirecting...</div>;
  }
}
```

---

## Styling with Appearance Prop

If you want to customize pre-built components instead:

```tsx
<SignIn
  appearance={{
    variables: {
      colorPrimary: '#000',
      colorBackground: '#fafafa',
      borderRadius: '0.5rem',
    },
    elements: {
      card: 'shadow-xl border-2 border-gray-200',
      headerTitle: 'text-2xl font-bold',
      formButtonPrimary: 'bg-black hover:bg-gray-800 text-sm',
      footerActionLink: 'text-blue-600 hover:text-blue-800',
      formFieldInput: 'rounded-lg border-gray-300',
    },
  }}
/>
```

---

## SSO Callback Handler

For OAuth flows, create a callback page:

```tsx
// app/sso-callback/page.tsx
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallback() {
  return <AuthenticateWithRedirectCallback />;
}
```

---

## Error Handling

```tsx
try {
  await signIn.create({ identifier: email, password });
} catch (err: any) {
  const clerkError = err.errors?.[0];

  switch (clerkError?.code) {
    case 'form_identifier_not_found':
      setError('No account found with this email');
      break;
    case 'form_password_incorrect':
      setError('Incorrect password');
      break;
    case 'form_password_pwned':
      setError('Password has been compromised, please choose another');
      break;
    default:
      setError(clerkError?.message ?? 'Something went wrong');
  }
}
```

## Documentation

- [Custom Flows](https://clerk.com/docs/custom-flows/overview)
- [useSignIn Hook](https://clerk.com/docs/references/react/use-sign-in)
- [useSignUp Hook](https://clerk.com/docs/references/react/use-sign-up)
- [Appearance Prop](https://clerk.com/docs/customization/overview)
