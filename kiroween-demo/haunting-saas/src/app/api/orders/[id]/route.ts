import { NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId } = await params;
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get order with items and product details
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return Response.json({ error: "Order not found" }, { status: 404 });
    }

    return Response.json(order);
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch order details" },
      { status: 500 },
    );
  }
}
