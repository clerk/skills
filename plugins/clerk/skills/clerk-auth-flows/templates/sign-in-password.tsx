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
