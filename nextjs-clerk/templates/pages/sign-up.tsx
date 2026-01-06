/**
 * Sign-Up Page Template
 * 
 * Place in app/sign-up/[[...sign-up]]/page.tsx
 * 
 * The [[...sign-up]] catch-all route handles:
 * - /sign-up
 * - /sign-up/verify-email-address
 * - etc.
 */
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        // Optional: redirect after sign-up
        // forceRedirectUrl="/onboarding"
      />
    </div>
  );
}

