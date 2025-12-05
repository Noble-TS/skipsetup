import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/server/better-auth/config";
export async function POST(request: NextRequest) {
  try {
    const { userId, permissions } = await request.json();

    if (!userId || !permissions) {
      return NextResponse.json(
        { error: "userId and permissions are required" },
        { status: 400 },
      );
    }

    const result = await auth.api.userHasPermission({
      body: {
        userId,
        permissions,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Permission check error:", error);
    return NextResponse.json(
      { error: "Failed to check permissions" },
      { status: 500 },
    );
  }
}
