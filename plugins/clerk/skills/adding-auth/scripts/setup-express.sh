#!/bin/bash
# Add Clerk to existing Express project
# Usage: bash setup-express.sh

set -e

echo "Installing @clerk/express..."
npm install @clerk/express dotenv

echo "Creating src/server.ts..."
mkdir -p src
cat > src/server.ts << 'EOF'
import 'dotenv/config'
import express from 'express'
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express'

const app = express()
app.use(clerkMiddleware())

app.get('/', (req, res) => res.send('Public route'))

app.get('/protected', requireAuth(), (req, res) => {
  const { userId } = getAuth(req)
  res.json({ userId })
})

app.listen(3000, () => console.log('Server running on port 3000'))
EOF

echo "Creating .env..."
cat >> .env << 'EOF'
CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
EOF

echo ""
echo "Done! Next steps:"
echo "  1. Get keys from: https://dashboard.clerk.com/last-active?path=api-keys"
echo "  2. npm run dev (or ts-node src/server.ts)"
