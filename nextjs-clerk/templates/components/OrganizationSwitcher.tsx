/**
 * Organization Switcher Component (Client Component)
 * 
 * Allows users to switch between organizations or create new ones.
 * Use this in B2B/multi-tenant applications.
 */
"use client";

import { OrganizationSwitcher as ClerkOrgSwitcher } from "@clerk/nextjs";

interface OrgSwitcherProps {
  /** Hide personal workspace option (recommended for B2B) */
  hidePersonal?: boolean;
  /** URL to redirect after selecting an org */
  afterSelectUrl?: string;
  /** URL to redirect after creating an org */
  afterCreateUrl?: string;
  /** URL to redirect after leaving an org */
  afterLeaveUrl?: string;
}

export function OrganizationSwitcher({
  hidePersonal = false,
  afterSelectUrl = "/dashboard",
  afterCreateUrl = "/dashboard",
  afterLeaveUrl = "/",
}: OrgSwitcherProps) {
  return (
    <ClerkOrgSwitcher
      hidePersonal={hidePersonal}
      afterSelectOrganizationUrl={afterSelectUrl}
      afterCreateOrganizationUrl={afterCreateUrl}
      afterLeaveOrganizationUrl={afterLeaveUrl}
      appearance={{
        elements: {
          rootBox: "w-full",
          organizationSwitcherTrigger:
            "w-full justify-between px-3 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800",
        },
      }}
    />
  );
}

/**
 * Example usage in a header:
 * 
 * <header className="flex items-center justify-between p-4">
 *   <Logo />
 *   <div className="flex items-center gap-4">
 *     <OrganizationSwitcher hidePersonal />
 *     <UserButton />
 *   </div>
 * </header>
 */

