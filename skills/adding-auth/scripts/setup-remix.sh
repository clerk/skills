#!/bin/bash
# Add Clerk to existing Remix project
# Usage: bash setup-remix.sh

set -e

echo "Installing @clerk/remix..."
npm install @clerk/remix

echo "Creating .env..."
cat >> .env << 'EOF'
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
EOF

echo ""
echo "Done! Next steps:"
echo "  1. Get keys from: https://dashboard.clerk.com/last-active?path=api-keys"
echo "  2. Wrap your app/root.tsx with ClerkApp HOC"
echo "  3. Add rootAuthLoader to your loader"
echo "  4. npm run dev"
echo ""
echo "See: https://clerk.com/docs/quickstarts/remix"
