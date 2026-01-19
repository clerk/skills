#!/bin/bash
# Add Clerk to existing React SPA (Vite)
# Usage: bash setup-react.sh

set -e

echo "Installing @clerk/clerk-react..."
npm install @clerk/clerk-react

echo "Creating .env..."
cat >> .env << 'EOF'
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
EOF

echo ""
echo "Done! Next steps:"
echo "  1. Get your publishable key from: https://dashboard.clerk.com/last-active?path=api-keys"
echo "  2. Wrap your App with ClerkProvider"
echo "  3. npm run dev"
echo ""
echo "See: https://clerk.com/docs/quickstarts/react"
