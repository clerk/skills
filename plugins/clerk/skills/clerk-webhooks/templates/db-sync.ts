// Generic database sync pattern - works with any ORM
// Replace `db` with your ORM client (Prisma, Drizzle, etc.)

import type { WebhookEvent } from '@clerk/nextjs/webhooks';

/**
 * Your users table schema:
 *
 * | Column    | Type   | Notes                    |
 * |-----------|--------|--------------------------|
 * | id        | string | Your primary key         |
 * | clerk_id  | string | Unique, from evt.data.id |
 * | email     | string | Primary email            |
 * | name      | string | Full name                |
 * | image_url | string | Profile image            |
 */

export async function createUserInDB(data: WebhookEvent['data']) {
  if (data.type !== 'user') return;

  const primaryEmail = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address;

  await db.users.create({
    clerk_id: data.id,           // Always store this
    email: primaryEmail,
    first_name: data.first_name,
    last_name: data.last_name,
    image_url: data.image_url,
  });
}

export async function updateUserInDB(data: WebhookEvent['data']) {
  if (data.type !== 'user') return;

  const primaryEmail = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address;

  await db.users.update({
    where: { clerk_id: data.id },
    data: {
      email: primaryEmail,
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url,
    },
  });
}

export async function deleteUserFromDB(clerkId: string) {
  await db.users.delete({
    where: { clerk_id: clerkId },
  });
}

// RECOMMENDED: Use upsert for idempotency
export async function upsertUserInDB(data: WebhookEvent['data']) {
  if (data.type !== 'user') return;

  const primaryEmail = data.email_addresses?.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address;

  await db.users.upsert({
    where: { clerk_id: data.id },
    create: {
      clerk_id: data.id,
      email: primaryEmail,
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url,
    },
    update: {
      email: primaryEmail,
      first_name: data.first_name,
      last_name: data.last_name,
      image_url: data.image_url,
    },
  });
}
