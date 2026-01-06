#!/bin/bash
# Generate common Clerk components for existing Next.js project
# Usage: bash components.sh [component]
# Components: all (default), auth-buttons, user-greeting, protected, org-switcher

set -e

COMPONENT=${1:-"all"}

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this from your Next.js project root."
  exit 1
fi

# Determine components directory
COMPONENTS_DIR="components"
if [ -d "src/components" ]; then
  COMPONENTS_DIR="src/components"
elif [ -d "src" ]; then
  COMPONENTS_DIR="src/components"
  mkdir -p "$COMPONENTS_DIR"
fi

echo "🧩 Generating Clerk components..."
echo "   Directory: $COMPONENTS_DIR"
echo ""

create_auth_buttons() {
  echo "Creating AuthButtons component..."
  cat > "$COMPONENTS_DIR/AuthButtons.tsx" << 'EOF'
"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

interface AuthButtonsProps {
  showSignUp?: boolean;
}

export function AuthButtons({ showSignUp = true }: AuthButtonsProps) {
  return (
    <>
      <SignedOut>
        <div className="flex items-center gap-3">
          <SignInButton mode="modal">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors font-medium">
              Sign In
            </button>
          </SignInButton>
          {showSignUp && (
            <SignUpButton mode="modal">
              <button className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-100 transition-colors font-medium">
                Sign Up
              </button>
            </SignUpButton>
          )}
        </div>
      </SignedOut>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </>
  );
}
EOF
}

create_user_greeting() {
  echo "Creating UserGreeting component..."
  cat > "$COMPONENTS_DIR/UserGreeting.tsx" << 'EOF'
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
          alt={user.fullName || "User"}
          className="w-10 h-10 rounded-full"
        />
      )}
      <div>
        <p className="font-medium">Hello, {user.firstName || "there"}!</p>
        <p className="text-sm text-gray-600">
          {user.primaryEmailAddress?.emailAddress}
        </p>
      </div>
    </div>
  );
}
EOF
}

create_protected_content() {
  echo "Creating ProtectedContent component..."
  cat > "$COMPONENTS_DIR/ProtectedContent.tsx" << 'EOF'
"use client";

import { Protect, useAuth } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ProtectedContentProps {
  children: ReactNode;
  role?: string;
  permission?: string;
  fallback?: ReactNode;
}

export function ProtectedContent({
  children,
  role,
  permission,
  fallback = <p>You don't have access to this content.</p>,
}: ProtectedContentProps) {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <div className="animate-pulse">Loading...</div>;
  }

  if (role || permission) {
    return (
      <Protect role={role} permission={permission} fallback={fallback}>
        {children}
      </Protect>
    );
  }

  return <Protect fallback={fallback}>{children}</Protect>;
}

export function AdminContent({
  children,
  fallback = <p>Admin access required.</p>,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ProtectedContent role="org:admin" fallback={fallback}>
      {children}
    </ProtectedContent>
  );
}
EOF
}

create_org_switcher() {
  echo "Creating OrganizationSwitcher component..."
  cat > "$COMPONENTS_DIR/OrganizationSwitcher.tsx" << 'EOF'
"use client";

import { OrganizationSwitcher as ClerkOrgSwitcher } from "@clerk/nextjs";

interface OrgSwitcherProps {
  hidePersonal?: boolean;
  afterSelectUrl?: string;
  afterCreateUrl?: string;
}

export function OrganizationSwitcher({
  hidePersonal = false,
  afterSelectUrl = "/dashboard",
  afterCreateUrl = "/dashboard",
}: OrgSwitcherProps) {
  return (
    <ClerkOrgSwitcher
      hidePersonal={hidePersonal}
      afterSelectOrganizationUrl={afterSelectUrl}
      afterCreateOrganizationUrl={afterCreateUrl}
      appearance={{
        elements: {
          organizationSwitcherTrigger:
            "px-3 py-2 border rounded-lg hover:bg-gray-50",
        },
      }}
    />
  );
}
EOF
}

case $COMPONENT in
  "all")
    create_auth_buttons
    create_user_greeting
    create_protected_content
    create_org_switcher
    ;;
  "auth-buttons")
    create_auth_buttons
    ;;
  "user-greeting")
    create_user_greeting
    ;;
  "protected")
    create_protected_content
    ;;
  "org-switcher")
    create_org_switcher
    ;;
  *)
    echo "❌ Unknown component: $COMPONENT"
    echo "   Available: all, auth-buttons, user-greeting, protected, org-switcher"
    exit 1
    ;;
esac

echo ""
echo "✅ Components created in $COMPONENTS_DIR"
echo ""
echo "📝 Usage examples:"
echo ""
echo "  import { AuthButtons } from '@/components/AuthButtons';"
echo "  import { UserGreeting } from '@/components/UserGreeting';"
echo "  import { ProtectedContent, AdminContent } from '@/components/ProtectedContent';"
echo "  import { OrganizationSwitcher } from '@/components/OrganizationSwitcher';"

