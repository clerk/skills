import { prisma } from '@/lib/prisma';
import type { UserJSON } from '@clerk/nextjs/server';

// Schema:
// model User {
//   id        String   @id // Clerk user ID
//   email     String   @unique
//   firstName String?
//   lastName  String?
//   imageUrl  String?
//   createdAt DateTime @default(now())
//   updatedAt DateTime @updatedAt
// }

export async function createUser(data: UserJSON) {
  await prisma.user.create({
    data: {
      id: data.id,
      email: data.email_addresses[0]?.email_address ?? '',
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    },
  });
}

export async function updateUser(data: UserJSON) {
  await prisma.user.update({
    where: { id: data.id },
    data: {
      email: data.email_addresses[0]?.email_address,
      firstName: data.first_name,
      lastName: data.last_name,
      imageUrl: data.image_url,
    },
  });
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}
