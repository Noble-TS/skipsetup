import { type NextRequest } from "next/server";
import { auth } from "~/server/better-auth/config";
import { stripe } from "~/server/stripe/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(request.headers),
    });

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stripeCustomerId = (session.user as any).stripeCustomerId;

    if (!stripeCustomerId) {
      return Response.json(
        { error: "No subscription found" },
        { status: 400 },
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.BETTER_AUTH_URL}/subscription`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal error:", error);
    return Response.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
