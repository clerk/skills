/**
 * User Greeting Component (Client Component)
 * 
 * Displays a greeting message for the current user.
 * Uses the useUser hook to access user data on the client side.
 */
"use client";

import { useUser } from "@clerk/nextjs";

export function UserGreeting() {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (!isSignedIn) {
    return <p>Please sign in to continue</p>;
  }

  return (
    <div className="flex items-center gap-3">
      {user.imageUrl && (
        <img
          src={user.imageUrl}
          alt={user.fullName || "User avatar"}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="font-medium">
          Hello, {user.firstName || user.username || "there"}!
        </p>
        <p className="text-sm text-gray-600">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </div>
  );
}

