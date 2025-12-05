import Stripe from "stripe";
export { auth } from "~/server/better-auth/config";

// Helper function to get session in API routes
export async function getServerAuthSession({
  req,
  res,
}: {
  req: any;
  res: any;
}) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    return session;
  } catch (error) {
    console.error("Session error:", error);
    return null;
  }
}
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-09-30.acacia",
});
