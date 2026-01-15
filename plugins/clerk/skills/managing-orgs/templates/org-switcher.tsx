// Option 1: Pre-built component
import { OrganizationSwitcher } from '@clerk/nextjs';

export function OrgSwitcherPrebuilt() {
  return (
    <OrganizationSwitcher
      afterCreateOrganizationUrl="/org/:slug"
      afterSelectOrganizationUrl="/org/:slug"
    />
  );
}

// Option 2: Custom switcher
'use client';

import { useOrganizationList } from '@clerk/nextjs';

export function CustomOrgSwitcher() {
  const { userMemberships, setActive, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  if (!isLoaded) return null;

  return (
    <select
      onChange={(e) => setActive({ organization: e.target.value })}
      className="border rounded px-2 py-1"
    >
      <option value="">Select organization</option>
      {userMemberships.data?.map((mem) => (
        <option key={mem.organization.id} value={mem.organization.id}>
          {mem.organization.name}
        </option>
      ))}
    </select>
  );
}
