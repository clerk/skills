/**
 * Organization Dashboard Component (Client Component)
 * 
 * Displays organization info and manages members.
 * Use this as a starting point for org management features.
 */
"use client";

import { useOrganization, useOrganizationList } from "@clerk/nextjs";
import { useState } from "react";

export function OrgDashboard() {
  const { isLoaded, organization, membership, memberships } = useOrganization({
    memberships: { infinite: true },
  });

  if (!isLoaded) {
    return <div className="animate-pulse">Loading organization...</div>;
  }

  if (!organization) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">No Organization Selected</h2>
        <p className="text-gray-600">
          Please select or create an organization to continue.
        </p>
      </div>
    );
  }

  const isAdmin = membership?.role === "org:admin";

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="flex items-center gap-4">
        {organization.imageUrl && (
          <img
            src={organization.imageUrl}
            alt={organization.name}
            className="w-16 h-16 rounded-lg"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-gray-600">
            {organization.membersCount} member{organization.membersCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="ml-auto">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              isAdmin
                ? "bg-purple-100 text-purple-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {membership?.role?.replace("org:", "")}
          </span>
        </div>
      </div>

      {/* Members List */}
      <div className="border rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-4">Team Members</h2>
        <div className="space-y-3">
          {memberships?.data?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.publicUserData.imageUrl}
                  alt={member.publicUserData.firstName || "Member"}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium">
                    {member.publicUserData.firstName} {member.publicUserData.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {member.publicUserData.identifier}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-600">
                {member.role.replace("org:", "")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Admin Actions */}
      {isAdmin && (
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Admin Actions</h2>
          <InviteMemberForm organizationId={organization.id} />
        </div>
      )}
    </div>
  );
}

function InviteMemberForm({ organizationId }: { organizationId: string }) {
  const { organization } = useOrganization();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"org:admin" | "org:member">("org:member");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !email) return;

    setLoading(true);
    setMessage("");

    try {
      await organization.inviteMember({
        emailAddress: email,
        role,
      });
      setMessage("Invitation sent!");
      setEmail("");
    } catch (error: any) {
      setMessage(error.errors?.[0]?.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleInvite} className="space-y-4">
      <div className="flex gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as typeof role)}
          className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="org:member">Member</option>
          <option value="org:admin">Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Invite"}
        </button>
      </div>
      {message && (
        <p className={message.includes("Failed") ? "text-red-600" : "text-green-600"}>
          {message}
        </p>
      )}
    </form>
  );
}

