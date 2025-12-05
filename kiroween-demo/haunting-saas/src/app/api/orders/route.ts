import { NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's orders
    const orders = await db.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(orders);
  } catch (error) {
    console.error("Orders fetch error:", error);
    return Response.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
