/**
 * User Profile Page Template
 * 
 * Displays the Clerk UserProfile component for account management.
 * Place in app/user-profile/[[...user-profile]]/page.tsx
 */
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "shadow-lg",
            },
          }}
          // Optional: Custom pages/links
          // path="/user-profile"
          // routing="path"
        />
      </div>
    </div>
  );
}

