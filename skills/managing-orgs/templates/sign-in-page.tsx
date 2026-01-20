/**
 * Sign-In Page
 *
 * Required when middleware uses redirectToSignIn().
 * Place at: app/sign-in/[[...sign-in]]/page.tsx
 */
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
        // Redirect to dashboard after sign-in (or use NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL)
        forceRedirectUrl="/dashboard"
      />
    </div>
  );
}
