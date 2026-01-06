/**
 * Organization Selection Page Template
 * 
 * Use this page when requiring users to select an organization.
 * Place in app/select-org/page.tsx
 * 
 * Configure middleware to redirect here when orgId is required but missing.
 */
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { OrganizationList } from "@clerk/nextjs";

export default async function SelectOrgPage() {
  const { userId, orgId } = await auth();

  // If not signed in, redirect to sign-in
  if (!userId) {
    redirect("/sign-in");
  }

  // If already has an org selected, redirect to dashboard
  if (orgId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Select an Organization</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose an organization to continue or create a new one.
        </p>
      </div>

      <OrganizationList
        hidePersonal={true}
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full max-w-md",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}

