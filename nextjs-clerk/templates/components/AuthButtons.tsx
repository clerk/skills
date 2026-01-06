/**
 * Auth Buttons Component (Client Component)
 * 
 * Shows sign-in/sign-up buttons when signed out,
 * and user button when signed in.
 */
"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

interface AuthButtonsProps {
  /** Style variant */
  variant?: "default" | "compact";
  /** Show sign up button when signed out */
  showSignUp?: boolean;
}

export function AuthButtons({
  variant = "default",
  showSignUp = true,
}: AuthButtonsProps) {
  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button
              className={`
                rounded-lg bg-blue-600 text-white hover:bg-blue-700 
                transition-colors font-medium
                ${variant === "compact" ? "px-3 py-1.5 text-sm" : "px-4 py-2"}
              `}
            >
              Sign In
            </button>
          </SignInButton>
          {showSignUp && (
            <SignUpButton mode="modal">
              <button
                className={`
                  rounded-lg border border-gray-300 dark:border-gray-600
                  hover:bg-gray-100 dark:hover:bg-gray-800 
                  transition-colors font-medium
                  ${variant === "compact" ? "px-3 py-1.5 text-sm" : "px-4 py-2"}
                `}
              >
                Sign Up
              </button>
            </SignUpButton>
          )}
        </div>
      </SignedOut>

      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: variant === "compact" ? "w-8 h-8" : "w-10 h-10",
            },
          }}
          afterSignOutUrl="/"
        />
      </SignedIn>
    </>
  );
}

