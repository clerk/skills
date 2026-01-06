#!/bin/bash
# Setup script for Next.js with Clerk authentication
# Usage: bash setup.sh [project-name]

set -e

PROJECT_NAME=${1:-"my-clerk-app"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Creating Next.js project with Clerk authentication..."
echo ""

# Create Next.js project
npx create-next-app@latest "$PROJECT_NAME" \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --use-npm

cd "$PROJECT_NAME"

# Install Clerk
echo ""
echo "📦 Installing @clerk/nextjs..."
npm install @clerk/nextjs

# Create environment file template
echo ""
echo "📝 Creating .env.local template..."
cat > .env.local << 'EOF'
# Clerk API Keys
# Get these from https://dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Optional: Custom auth URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Optional: Webhook secret (for syncing users to your database)
# CLERK_WEBHOOK_SECRET=whsec_xxxxx
EOF

# Update root layout with ClerkProvider
echo ""
echo "🔧 Configuring ClerkProvider in layout..."
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Clerk App",
  description: "Next.js app with Clerk authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
EOF

# Create middleware
echo ""
echo "🛡️ Creating middleware for route protection..."
cat > src/middleware.ts << 'EOF'
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/protected(.*)",
]);

// Define which routes are public (no auth required)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  // Protect routes that match isProtectedRoute
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
EOF

# Create sign-in page
echo ""
echo "📄 Creating sign-in page..."
mkdir -p src/app/sign-in/[[...sign-in]]
cat > src/app/sign-in/[[...sign-in]]/page.tsx << 'EOF'
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
EOF

# Create sign-up page
echo ""
echo "📄 Creating sign-up page..."
mkdir -p src/app/sign-up/[[...sign-up]]
cat > src/app/sign-up/[[...sign-up]]/page.tsx << 'EOF'
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
EOF

# Create dashboard page
echo ""
echo "📄 Creating protected dashboard page..."
mkdir -p src/app/dashboard
cat > src/app/dashboard/page.tsx << 'EOF'
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
          <p className="text-lg">
            Welcome, <span className="font-semibold">{user?.firstName || "User"}</span>!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Email: {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          This page is protected. Only authenticated users can see it.
        </p>
      </div>
    </div>
  );
}
EOF

# Update home page with auth buttons
echo ""
echo "📄 Updating home page with authentication..."
cat > src/app/page.tsx << 'EOF'
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <main className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-bold">Welcome to My Clerk App</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md">
          A Next.js application with Clerk authentication.
        </p>

        <SignedOut>
          <div className="flex gap-4">
            <SignInButton mode="modal">
              <button className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="flex flex-col items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-12 h-12",
                },
              }}
            />
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}
EOF

# Create a protected API route example
echo ""
echo "📄 Creating protected API route..."
mkdir -p src/app/api/protected
cat > src/app/api/protected/route.ts << 'EOF'
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "This is protected data",
    userId,
    orgId,
  });
}
EOF

echo ""
echo "✅ Project setup complete!"
echo ""
echo "📋 Next steps:"
echo "  1. cd $PROJECT_NAME"
echo "  2. Add your Clerk keys to .env.local"
echo "     - Get them from https://dashboard.clerk.com"
echo "  3. npm run dev"
echo "  4. Open http://localhost:3000"
echo ""
echo "📚 Resources:"
echo "  - Clerk Docs: https://clerk.com/docs"
echo "  - Next.js Quickstart: https://clerk.com/docs/quickstarts/nextjs"
echo ""

