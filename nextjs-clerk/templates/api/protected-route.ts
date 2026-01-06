/**
 * Protected API Route Template
 * 
 * Example of a protected API route that requires authentication.
 * Place in app/api/protected/route.ts
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

  // Your protected logic here
  const data = {
    message: "This is protected data",
    userId,
    orgId,
    orgRole,
  };

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // Your protected logic here
    // Example: Create a resource
    const result = {
      success: true,
      data: body,
      createdBy: userId,
      organizationId: orgId,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

