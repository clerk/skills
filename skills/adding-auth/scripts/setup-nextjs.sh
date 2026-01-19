#!/bin/bash
# Add Clerk to existing Next.js project
# Usage: bash setup-nextjs.sh

set -e

echo "Installing @clerk/nextjs..."
npm install @clerk/nextjs

echo "Creating middleware.ts..."
cat > middleware.ts << 'EOF'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher(['/dashboard(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
EOF

echo "Creating .env.local..."
cat >> .env.local << 'EOF'
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
EOF

echo ""
echo "Done! Next steps:"
echo "  1. Get keys from: https://dashboard.clerk.com/last-active?path=api-keys"
echo "  2. Add ClerkProvider to app/layout.tsx"
echo "  3. npm run dev"
