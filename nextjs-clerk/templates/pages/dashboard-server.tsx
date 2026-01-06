/**
 * Dashboard Page Template (Server Component)
 * 
 * Example of a protected page using server-side auth.
 * Place in app/dashboard/page.tsx
 */
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Get auth state on the server
  const { userId, orgId, orgRole } = await auth();

  // Redirect if not authenticated
  if (!userId) {
    redirect("/sign-in");
  }

  // Get full user object if needed
  const user = await currentUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {user?.firstName || "there"}!
          </p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Profile</h2>
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt={user.fullName || "Profile"}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{user?.fullName}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Organization Info (if applicable) */}
        {orgId && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Organization</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600 dark:text-gray-400">ID: </span>
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-sm">
                  {orgId}
                </code>
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Role: </span>
                <span className="capitalize">{orgRole?.replace("org:", "")}</span>
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">User ID</p>
            <p className="font-mono text-sm truncate">{userId}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Created</p>
            <p className="text-sm">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Last Sign In</p>
            <p className="text-sm">
              {user?.lastSignInAt
                ? new Date(user.lastSignInAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

