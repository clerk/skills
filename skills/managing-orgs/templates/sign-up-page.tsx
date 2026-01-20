/**
 * Sign-Up Page
 *
 * Required when middleware uses redirectToSignUp().
 * Place at: app/sign-up/[[...sign-up]]/page.tsx
 */
import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-md",
          },
        }}
        // Redirect to org selection after sign-up
        forceRedirectUrl="/select-org"
      />
    </div>
  );
}
