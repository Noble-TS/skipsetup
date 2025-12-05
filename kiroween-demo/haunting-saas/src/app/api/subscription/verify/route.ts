import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = (await request.json()) as { sessionId: string };

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status === "paid") {
      const subscription = await stripe.subscriptions.retrieve(
        checkoutSession.subscription as string,
      );

      await db.user.update({
        where: { id: session.user.id },
        data: {
          subscriptionTier: checkoutSession.metadata?.tier || "spooky",
          subscriptionStatus: "active",
          subscriptionStartDate: new Date(subscription.current_period_start * 1000),
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
        },
      });

      return Response.json({ success: true });
    }

    return Response.json({ error: "Payment not completed" }, { status: 400 });
  } catch (error) {
    console.error("Verification error:", error);
    return Response.json(
      { error: "Failed to verify subscription" },
      { status: 500 },
    );
  }
}
