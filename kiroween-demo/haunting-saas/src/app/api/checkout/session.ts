import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/stripe/stripe";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });

  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body as {
      items: Array<{ productId: string; quantity: number }>;
    };

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No items provided" });
    }

    // Get products and calculate total
    const productIds = items.map((item) => item.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    let totalAmount = 0;
    const lineItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product || !product.stripePriceId) {
        return res
          .status(400)
          .json({ error: `Product not configured: ${item.productId}` });
      }
      totalAmount += product.price * item.quantity;
      lineItems.push({
        price: product.stripePriceId,
        quantity: item.quantity,
      });
    }

    // Create customer BEFORE checkout
    let stripeCustomerId = session.user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name:
          session.user.name ||
          `${session.user.firstName} ${session.user.lastName}`.trim(),
        metadata: {
          userId: session.user.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store the relationship
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

    // Create checkout session WITH customer
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
    });

    // Update order with Stripe session ID
    await db.order.update({
      where: { id: order.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    res.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
}
