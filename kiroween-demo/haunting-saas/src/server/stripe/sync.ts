import { stripe } from "./stripe";
import { db } from "~/server/db";

export type StripeCustomerCache =
  | {
      customerId: string;
      payments?: {
        totalOrders: number;
        totalSpent: number;
        lastPaymentDate: number | null;
      };
    }
  | {
      status: "none";
    };

export async function syncStripeDataToKV(
  customerId: string,
): Promise<StripeCustomerCache> {
  try {
    // Get payment intents for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit: 100,
    });

    const successfulPayments = paymentIntents.data.filter(
      (pi) => pi.status === "succeeded",
    );

    // Verify customer exists
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) {
      return { status: "none" };
    }

    // Calculate payment stats
    const totalSpent = successfulPayments.reduce(
      (sum, pi) => sum + (pi.amount || 0),
      0,
    );
    const lastPayment = successfulPayments[0];

    // Get database orders for this customer
    const dbOrders = await db.order.findMany({
      where: {
        user: { stripeCustomerId: customerId },
        status: "COMPLETED",
      },
    });

    const cacheData: StripeCustomerCache = {
      customerId,
      payments: {
        totalOrders: dbOrders.length,
        totalSpent: totalSpent / 100, // Convert from cents
        lastPaymentDate: lastPayment ? lastPayment.created : null,
      },
    };

    // Update user metadata with latest Stripe state
    await db.user.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        metadata: {
          ...cacheData,
          lastSyncedAt: new Date().toISOString(),
        },
      },
    });

    return cacheData;
  } catch (error) {
    console.error(
      `Failed to sync Stripe data for customer ${customerId}:`,
      error,
    );
    throw error;
  }
}
