'use client';

import { useOrganization } from '@clerk/nextjs';

export function MemberList() {
  const { memberships, organization } = useOrganization({
    memberships: { infinite: true },
  });

  if (!organization) return <div>Select an organization</div>;

  async function updateRole(userId: string, role: string) {
    await organization.updateMember({ userId, role });
  }

  async function removeMember(userId: string) {
    await organization.removeMember(userId);
  }

  return (
    <div>
      <h2>Members of {organization.name}</h2>
      <ul className="space-y-2">
        {memberships?.data?.map((m) => (
          <li key={m.id} className="flex items-center gap-4">
            <span>{m.publicUserData.firstName ?? m.publicUserData.identifier}</span>
            <span className="text-gray-500">{m.role}</span>
            <select
              value={m.role}
              onChange={(e) => updateRole(m.publicUserData.userId!, e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="org:member">Member</option>
              <option value="org:admin">Admin</option>
            </select>
            <button
              onClick={() => removeMember(m.publicUserData.userId!)}
              className="text-red-500"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
