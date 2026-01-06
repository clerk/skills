/**
 * Clerk Webhook Handler Template
 * 
 * Handles webhook events from Clerk for syncing users/orgs to your database.
 * Place in app/api/webhooks/clerk/route.ts
 * 
 * Setup:
 * 1. Create a webhook endpoint in Clerk Dashboard
 * 2. Add CLERK_WEBHOOK_SECRET to your environment variables
 * 3. Subscribe to relevant events (user.created, user.deleted, etc.)
 * 
 * Required package: npm install svix
 */
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

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
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

  // Handle the webhook event
  const eventType = evt.type;

  switch (eventType) {
    case "user.created": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      );

      // TODO: Create user in your database
      console.log("User created:", {
        clerkId: id,
        email: primaryEmail?.email_address,
        firstName: first_name,
        lastName: last_name,
        imageUrl: image_url,
      });

      // Example with Prisma:
      // await prisma.user.create({
      //   data: {
      //     clerkId: id,
      //     email: primaryEmail?.email_address,
      //     firstName: first_name,
      //     lastName: last_name,
      //   },
      // });
      break;
    }

    case "user.updated": {
      const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      const primaryEmail = email_addresses.find(
        (e) => e.id === evt.data.primary_email_address_id
      );

      // TODO: Update user in your database
      console.log("User updated:", id);

      // Example with Prisma:
      // await prisma.user.update({
      //   where: { clerkId: id },
      //   data: {
      //     email: primaryEmail?.email_address,
      //     firstName: first_name,
      //     lastName: last_name,
      //   },
      // });
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;

      // TODO: Delete user from your database
      console.log("User deleted:", id);

      // Example with Prisma:
      // await prisma.user.delete({
      //   where: { clerkId: id },
      // });
      break;
    }

    case "organization.created": {
      const { id, name, slug, image_url, created_by } = evt.data;

      // TODO: Create organization in your database
      console.log("Organization created:", {
        clerkId: id,
        name,
        slug,
        createdBy: created_by,
      });

      // Example with Prisma:
      // await prisma.organization.create({
      //   data: {
      //     clerkId: id,
      //     name,
      //     slug,
      //     createdByClerkId: created_by,
      //   },
      // });
      break;
    }

    case "organization.updated": {
      const { id, name, slug } = evt.data;

      // TODO: Update organization in your database
      console.log("Organization updated:", id);
      break;
    }

    case "organization.deleted": {
      const { id } = evt.data;

      // TODO: Delete organization from your database
      console.log("Organization deleted:", id);
      break;
    }

    case "organizationMembership.created": {
      const { organization, public_user_data, role } = evt.data;

      // TODO: Add member to organization in your database
      console.log("Member added:", {
        orgId: organization.id,
        userId: public_user_data.user_id,
        role,
      });
      break;
    }

    case "organizationMembership.deleted": {
      const { organization, public_user_data } = evt.data;

      // TODO: Remove member from organization in your database
      console.log("Member removed:", {
        orgId: organization.id,
        userId: public_user_data.user_id,
      });
      break;
    }

    default:
      console.log(`Unhandled webhook event: ${eventType}`);
  }

  return new Response("Webhook received", { status: 200 });
}

