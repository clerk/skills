/**
 * Admin-Only API Route Template
 * 
 * Example of an API route that requires org:admin role.
 * Place in app/api/admin/route.ts
 */
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId, orgId, orgRole } = await auth();

  // Check authentication
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check organization
  if (!orgId) {
    return NextResponse.json(
      { error: "Organization required" },
      { status: 403 }
    );
  }

  // Check admin role
  if (orgRole !== "org:admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  // Admin-only logic here
  const adminData = {
    message: "Admin-only data",
    orgId,
    // Example: Return sensitive org settings
  };

  return NextResponse.json(adminData);
}

export async function PATCH(request: Request) {
  const { userId, orgId, orgRole } = await auth();

  if (!userId || !orgId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (orgRole !== "org:admin") {
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();

    // Admin-only update logic
    // Example: Update organization settings
    const result = {
      success: true,
      updatedBy: userId,
      data: body,
    };

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

