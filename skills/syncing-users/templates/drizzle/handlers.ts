import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { UserJSON } from '@clerk/nextjs/server';

// Schema (db/schema.ts):
// export const users = pgTable('users', {
//   id: text('id').primaryKey(),
//   email: text('email').notNull().unique(),
//   firstName: text('first_name'),
//   lastName: text('last_name'),
//   imageUrl: text('image_url'),
//   createdAt: timestamp('created_at').defaultNow(),
//   updatedAt: timestamp('updated_at').defaultNow(),
// });

export async function createUser(data: UserJSON) {
  await db.insert(users).values({
    id: data.id,
    email: data.email_addresses[0]?.email_address ?? '',
    firstName: data.first_name,
    lastName: data.last_name,
    imageUrl: data.image_url,
  });
}

export async function updateUser(data: UserJSON) {
  await db
    .update(users)
    .set({
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    })
    .where(eq(users.id, data.id));
}

export async function deleteUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
