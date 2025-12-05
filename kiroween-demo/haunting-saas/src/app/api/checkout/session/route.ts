import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function POST(request: NextRequest) {
  try {
    // Get the user session using Better Auth
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session || !session.user) {
      return Response.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 },
      );
    }

    const { items } = (await request.json()) as {
      items: Array<{ productId: string; quantity: number }>;
    };

    // Validate request body
    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "No items provided" }, { status: 400 });
    }

    // Get products from database
    const productIds = items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    // Validate products and calculate total
    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        return Response.json(
          { error: `Product not found: ${item.productId}` },
          { status: 400 },
        );
      }
      if (!product.stripePriceId) {
        return Response.json(
          { error: `Product not configured for payments: ${product.name}` },
          { status: 400 },
        );
      }

      totalAmount += product.price * item.quantity;
      lineItems.push({
        price: product.stripePriceId,
        quantity: item.quantity,
      });
    }

    // Get or create Stripe customer
    let stripeCustomerId = (session.user as any).stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name:
          session.user.name ||
          `${(session.user as any).firstName || ""} ${(session.user as any).lastName || ""}`.trim() ||
          "Customer",
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store the relationship in database
      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    // Create order in database (PENDING status)
    const order = await db.order.create({
      data: {
        userId: session.user.id,
        amount: totalAmount,
        status: "PENDING",
        items: {
          create: items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product.price,
            };
          }),
        },
      },
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.BETTER_AUTH_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/checkout/cancel`,
      metadata: {
        userId: session.user.id,
        orderId: order.id,
      },
      shipping_address_collection: {
        allowed_countries: ["ET", "US", "CA", "GB"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      custom_text: {
        shipping_address: {
          message:
            "For delivery to Tigray, please ensure address is accurate and complete.",
        },
      },
    });

    // Update order with Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    // Return the checkout URL
    return Response.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
      orderId: order.id,
    });
  } catch (error) {
    console.error("❌ Checkout error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to create checkout session";
    if (error instanceof Error) {
      if (error.message.includes("Stripe")) {
        errorMessage = "Payment service error. Please try again.";
      } else {
        errorMessage = error.message;
      }
    }

    return Response.json(
      {
        error: errorMessage,
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 },
    );
  }
}

// Add GET method for testing
export async function GET() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
