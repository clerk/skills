#!/bin/bash
# Generate authentication pages for existing Next.js project
# Usage: bash auth-pages.sh

set -e

# Check if we're in a Next.js project
if [ ! -f "package.json" ]; then
  echo "❌ Error: No package.json found. Run this from your Next.js project root."
  exit 1
fi

# Determine app directory
APP_DIR="app"
if [ -d "src/app" ]; then
  APP_DIR="src/app"
fi

echo "📄 Generating authentication pages..."
echo "   Directory: $APP_DIR"
echo ""

# Create sign-in page
echo "Creating sign-in page..."
mkdir -p "$APP_DIR/sign-in/[[...sign-in]]"
cat > "$APP_DIR/sign-in/[[...sign-in]]/page.tsx" << 'EOF'
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignIn />
    </div>
  );
}
EOF

# Create sign-up page
echo "Creating sign-up page..."
mkdir -p "$APP_DIR/sign-up/[[...sign-up]]"
cat > "$APP_DIR/sign-up/[[...sign-up]]/page.tsx" << 'EOF'
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <SignUp />
    </div>
  );
}
EOF

# Create user profile page
echo "Creating user profile page..."
mkdir -p "$APP_DIR/user-profile/[[...user-profile]]"
cat > "$APP_DIR/user-profile/[[...user-profile]]/page.tsx" << 'EOF'
import { UserProfile } from "@clerk/nextjs";

export default function UserProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <UserProfile />
    </div>
  );
}
EOF

echo ""
echo "✅ Authentication pages created:"
echo "   - $APP_DIR/sign-in/[[...sign-in]]/page.tsx"
echo "   - $APP_DIR/sign-up/[[...sign-up]]/page.tsx"
echo "   - $APP_DIR/user-profile/[[...user-profile]]/page.tsx"
echo ""
echo "📝 Add these environment variables to .env.local:"
echo "   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in"
echo "   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up"

