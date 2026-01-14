'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, FormEvent } from 'react';

export function MFAVerification() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;

    setIsLoading(true);
    setError('');

    try {
      // After first factor succeeds with status 'needs_second_factor'
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'MFA verification failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code">Enter your authenticator code</label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="000000"
          required
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <button type="submit" disabled={isLoading || !isLoaded}>
        {isLoading ? 'Verifying...' : 'Verify'}
      </button>
    </form>
  );
}
