import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

const TIER_PRICES = {
  spooky: { priceId: process.env.STRIPE_SPOOKY_PRICE_ID, amount: 900 },
  haunting: { priceId: process.env.STRIPE_HAUNTING_PRICE_ID, amount: 2900 },
  kiroween: { priceId: process.env.STRIPE_KIROWEEN_PRICE_ID, amount: 9900 },
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = (await request.json()) as { tier: string };

    if (!TIER_PRICES[tier as keyof typeof TIER_PRICES]) {
      return Response.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId = (session.user as any).stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: session.user.email!,
        name: session.user.name || `${(session.user as any).firstName || ""} ${(session.user as any).lastName || ""}`.trim(),
        metadata: { userId: session.user.id },
      });

      stripeCustomerId = customer.id;

      await db.user.update({
        where: { id: session.user.id },
        data: { stripeCustomerId },
      });
    }

    // Create Stripe checkout session for subscription
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: TIER_PRICES[tier as keyof typeof TIER_PRICES].priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.BETTER_AUTH_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/pricing`,
      metadata: {
        userId: session.user.id,
        tier,
      },
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Subscription error:", error);
    return Response.json(
      { error: "Failed to create subscription" },
      { status: 500 },
    );
  }
}
