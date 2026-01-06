#!/bin/bash
# Generate Clerk webhook handler for existing Next.js project
# Usage: bash webhook.sh

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

echo "🔗 Generating Clerk webhook handler..."
echo ""

# Check if svix is installed
if ! grep -q '"svix"' package.json 2>/dev/null; then
  echo "📦 Installing svix package for webhook verification..."
  npm install svix
fi

# Create webhook route
echo "Creating webhook route..."
mkdir -p "$APP_DIR/api/webhooks/clerk"
cat > "$APP_DIR/api/webhooks/clerk/route.ts" << 'EOF'
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Verify the webhook
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  // Handle the event
  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      );
      
      console.log("User created:", {
        clerkId: id,
        email: primaryEmail?.email_address,
        firstName: first_name,
        lastName: last_name,
      });
      
      // TODO: Create user in your database
      // await db.user.create({ ... });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name } = evt.data;
      console.log("User updated:", id);
      
      // TODO: Update user in your database
      // await db.user.update({ ... });
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      console.log("User deleted:", id);
      
      // TODO: Delete user from your database
      // await db.user.delete({ ... });
      break;
    }

    case "organization.created": {
      const { id, name, slug, created_by } = evt.data;
      console.log("Organization created:", { id, name, slug });
      
      // TODO: Create organization in your database
      break;
    }

    case "organizationMembership.created": {
      const { organization, public_user_data, role } = evt.data;
      console.log("Member added:", {
        orgId: organization.id,
        userId: public_user_data.user_id,
        role,
      });
      
      // TODO: Add member to organization in your database
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  return new Response("Webhook received", { status: 200 });
}
EOF

echo ""
echo "✅ Webhook handler created at $APP_DIR/api/webhooks/clerk/route.ts"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Add CLERK_WEBHOOK_SECRET to .env.local:"
echo "   CLERK_WEBHOOK_SECRET=whsec_xxxxx"
echo ""
echo "2. Create a webhook endpoint in Clerk Dashboard:"
echo "   - Go to https://dashboard.clerk.com"
echo "   - Navigate to Webhooks"
echo "   - Add endpoint: https://your-domain.com/api/webhooks/clerk"
echo ""
echo "3. Subscribe to events:"
echo "   - user.created"
echo "   - user.updated"
echo "   - user.deleted"
echo "   - organization.created (if using organizations)"
echo "   - organizationMembership.created (if using organizations)"
echo ""
echo "4. For local development, use ngrok or similar:"
echo "   ngrok http 3000"
echo "   Then use the ngrok URL in Clerk Dashboard"

