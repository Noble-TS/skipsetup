import { type NextApiRequest, type NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/stripe/stripe";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";
import { syncStripeDataToKV } from "~/server/stripe/sync";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerAuthSession({ req, res });

  if (!session) return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const { sessionId, orderId } = req.body;

    // Retrieve checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(
      sessionId as string,
    );

    if (checkoutSession.payment_status === "paid") {
      // Update order status
      await db.order.update({
        where: { id: orderId as string },
        data: {
          status: "COMPLETED",
          stripePaymentIntentId: checkoutSession.payment_intent as string,
        },
      });

      // THEO'S KEY INSIGHT: Sync Stripe data eagerly
      if (session.user.stripeCustomerId) {
        await syncStripeDataToKV(session.user.stripeCustomerId);
      }

      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Payment not completed" });
    }
  } catch (error) {
    console.error("Sync success error:", error);
    res.status(500).json({ error: "Failed to sync payment" });
  }
}
