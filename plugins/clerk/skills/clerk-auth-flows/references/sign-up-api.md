# SignUp API Reference

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

## Documentation

- [useSignUp Reference](https://clerk.com/docs/reference/react/use-sign-up)
- [Custom Sign-Up Flow](https://clerk.com/docs/custom-flows/sign-up)
