/**
 * Sign-In Page Template
 * 
 * Place in app/sign-in/[[...sign-in]]/page.tsx
 * 
 * The [[...sign-in]] catch-all route handles:
 * - /sign-in
 * - /sign-in/factor-one
 * - /sign-in/factor-two
 * - etc.
 */
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        // Optional: redirect after sign-in
        // forceRedirectUrl="/dashboard"
      />
    </div>
  );
}

