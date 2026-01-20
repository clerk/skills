'use client';

import { useOrganization } from '@clerk/nextjs';
import { useState } from 'react';

export function InviteForm() {
  const { organization } = useOrganization();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('org:member');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!organization) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    try {
      await organization.inviteMember({
        emailAddress: email,
        role,
      });
      setEmail('');
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    }
  }

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <h3>Invite Member</h3>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        className="border rounded px-3 py-2 w-full"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="border rounded px-3 py-2 w-full"
      >
        <option value="org:member">Member</option>
        <option value="org:admin">Admin</option>
      </select>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="bg-black text-white px-4 py-2 rounded"
      >
        {status === 'sending' ? 'Sending...' : 'Send Invite'}
      </button>
      {status === 'sent' && <p className="text-green-600">Invitation sent!</p>}
      {status === 'error' && <p className="text-red-600">Failed to send invite</p>}
    </form>
  );
}
