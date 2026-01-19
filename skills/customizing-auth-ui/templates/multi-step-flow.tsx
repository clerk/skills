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

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

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
            onChange={(e) => update('email', e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => update('password', e.target.value)}
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
            onChange={(e) => update('code', e.target.value)}
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
            onChange={(e) => update('firstName', e.target.value)}
          />
          <input
            placeholder="Last name"
            value={formData.lastName}
            onChange={(e) => update('lastName', e.target.value)}
          />
          <input
            placeholder="Company"
            value={formData.company}
            onChange={(e) => update('company', e.target.value)}
          />
          <button type="submit">Complete</button>
        </form>
      );

    case 'complete':
      return <div>Welcome! Redirecting...</div>;
  }
}
