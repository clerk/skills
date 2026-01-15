/**
 * Server Actions Template
 * 
 * Examples of authenticated server actions for forms and mutations.
 * Place in app/actions.ts or similar.
 */
"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * Example: Create an item (requires authentication)
 */
export async function createItem(formData: FormData) {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  // TODO: Create item in your database
  // const item = await db.item.create({
  //   data: {
  //     name,
  //     description,
  //     userId,
  //     organizationId: orgId,
  //   },
  // });

  // Revalidate the page that shows the list
  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Example: Update user profile
 */
export async function updateProfile(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;

  // TODO: Update profile in your database
  // await db.profile.upsert({
  //   where: { userId },
  //   create: { userId, displayName, bio },
  //   update: { displayName, bio },
  // });

  revalidatePath("/profile");

  return { success: true };
}

/**
 * Example: Admin-only action
 */
export async function deleteResource(resourceId: string) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized");
  }

  if (orgRole !== "org:admin") {
    throw new Error("Admin access required");
  }

  // TODO: Delete resource from database
  // await db.resource.delete({
  //   where: { id: resourceId, organizationId: orgId },
  // });

  revalidatePath("/dashboard");

  return { success: true };
}

/**
 * Example: Organization-scoped action
 */
export async function inviteTeamMember(formData: FormData) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    throw new Error("Unauthorized - organization required");
  }

  if (orgRole !== "org:admin") {
    throw new Error("Admin access required to invite members");
  }

  const email = formData.get("email") as string;
  const role = formData.get("role") as string || "org:member";

  if (!email) {
    throw new Error("Email is required");
  }

  // Note: For actual invitations, use Clerk's organization.inviteMember() 
  // in a client component, or use the Clerk Backend API
  // This is just an example of checking permissions in a server action

  return { success: true, message: "Use Clerk's invite API for actual invitations" };
}

/**
 * Example: Get current user data for server action
 */
export async function getCurrentUserData() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };
}

