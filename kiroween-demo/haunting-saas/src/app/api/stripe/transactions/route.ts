import { NextRequest, NextResponse } from "next/server";
import { db } from "~/server/db";
import { stripe } from "~/server/stripe/stripe";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch payment intents which contain transaction details
    const paymentIntents = await stripe.paymentIntents.list({
      limit: Math.min(limit, 100),
      expand: [
        "data.charges.data.balance_transaction",
        "data.customer",
        "data.shipping",
      ],
    });

    // Get all Stripe customer IDs and order IDs for batch querying
    const stripeCustomerIds: string[] = [];
    const orderIds: string[] = [];

    paymentIntents.data.forEach((pi) => {
      if (pi.customer && typeof pi.customer === "string") {
        stripeCustomerIds.push(pi.customer);
      } else if (pi.customer && typeof pi.customer === "object") {
        stripeCustomerIds.push(pi.customer.id);
      }

      if (pi.metadata?.orderId) {
        orderIds.push(pi.metadata.orderId);
      }
    });

    // Fetch users by stripeCustomerId
    let users: any[] = [];
    if (stripeCustomerIds.length > 0) {
      users = await db.user.findMany({
        where: {
          stripeCustomerId: {
            in: stripeCustomerIds,
          },
        },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          stripeCustomerId: true,
        },
      });
    }

    // Fetch orders from database
    let orders: any[] = [];
    if (orderIds.length > 0) {
      orders = await db.order.findMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              stripeCustomerId: true,
            },
          },
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
      });
    }

    // Create maps for quick lookup
    const userMapByStripeId = new Map();
    users.forEach((user) => {
      if (user.stripeCustomerId) {
        userMapByStripeId.set(user.stripeCustomerId, user);
      }
    });

    const orderMap = new Map();
    orders.forEach((order) => {
      orderMap.set(order.id, order);
    });

    // Transform Stripe data to include local customer data
    const transactions = await Promise.all(
      paymentIntents.data.map(async (pi) => {
        // Get customer details from Stripe
        let customerEmail = pi.receipt_email;
        let customerName = null;
        let stripeCustomerId = null;
        let stripeCustomer = null;
        let stripeShipping = pi.shipping;

        if (pi.customer) {
          if (typeof pi.customer === "string") {
            stripeCustomerId = pi.customer;
            try {
              const customer = await stripe.customers.retrieve(pi.customer);
              if (!customer.deleted) {
                stripeCustomer = customer;
                customerEmail = customerEmail || (customer as any).email;
                customerName = (customer as any).name;
              }
            } catch (error) {
              // Silent fail - customer might be deleted
            }
          } else {
            // Customer is already expanded
            stripeCustomer = pi.customer;
            stripeCustomerId = pi.customer.id;
            customerEmail = customerEmail || pi.customer.email;
            customerName = pi.customer.name;
          }
        }

        // Get charge details
        const charge = pi.charges?.data[0];
        const balanceTransaction = charge?.balance_transaction;

        let fee = 0;
        if (balanceTransaction && typeof balanceTransaction !== "string") {
          fee = balanceTransaction.fee || 0;
        }

        // Get local user data by stripeCustomerId
        const localUser = stripeCustomerId
          ? userMapByStripeId.get(stripeCustomerId)
          : null;

        // Get local order data
        const orderId = pi.metadata?.orderId;
        const localOrder = orderId ? orderMap.get(orderId) : null;

        // Parse shipping address from local order if available
        let parsedShippingAddress = null;
        if (localOrder?.shippingAddress) {
          try {
            parsedShippingAddress = JSON.parse(localOrder.shippingAddress);
          } catch (e) {
            // If it's not JSON, use as string
            parsedShippingAddress = localOrder.shippingAddress;
          }
        }

        // Build product description from order items
        let productDescription = "";
        if (localOrder?.items && localOrder.items.length > 0) {
          const productNames = localOrder.items.map(
            (item: any) => `${item.product.name} (x${item.quantity})`,
          );
          productDescription = productNames.join(", ");
        }

        // If we have local user but no customer name/email from Stripe, use local user data
        if (localUser && !customerName) {
          customerName =
            localUser.name ||
            (localUser.firstName && localUser.lastName
              ? `${localUser.firstName} ${localUser.lastName}`
              : null);
          customerEmail = customerEmail || localUser.email;
        }

        // If we have local order user but no customer data yet, use order user data
        if (!localUser && localOrder?.user) {
          const orderUser = localOrder.user;
          customerName =
            orderUser.name ||
            (orderUser.firstName && orderUser.lastName
              ? `${orderUser.firstName} ${orderUser.lastName}`
              : null);
          customerEmail = customerEmail || orderUser.email;
        }

        // Format shipping address for display
        const formatShippingAddress = () => {
          // Prefer local order shipping address
          if (parsedShippingAddress) {
            if (typeof parsedShippingAddress === "object") {
              return `${parsedShippingAddress.line1 || ""}${parsedShippingAddress.line2 ? `, ${parsedShippingAddress.line2}` : ""}, ${parsedShippingAddress.city || ""}, ${parsedShippingAddress.state || ""} ${parsedShippingAddress.postal_code || ""}`.trim();
            }
            return parsedShippingAddress;
          }

          // Fall back to Stripe shipping
          if (stripeShipping) {
            return `${stripeShipping.address.line1}${stripeShipping.address.line2 ? `, ${stripeShipping.address.line2}` : ""}, ${stripeShipping.address.city}, ${stripeShipping.address.state} ${stripeShipping.address.postal_code}`;
          }

          return null;
        };

        const shippingAddress = formatShippingAddress();

        return {
          id: pi.id,
          paymentIntentId: pi.id,
          chargeId: charge?.id,
          amount: pi.amount,
          amountCaptured: pi.amount_captured || pi.amount,
          currency: pi.currency.toUpperCase(),
          status: pi.status,
          created: new Date(pi.created * 1000).toISOString(),

          // Stripe customer data
          customerId: stripeCustomerId,
          customerEmail: customerEmail,
          customerName: customerName,
          stripeCustomer: stripeCustomer,
          stripeShipping: stripeShipping,

          // Local database data
          orderId: orderId,
          localOrder: localOrder
            ? {
                id: localOrder.id,
                status: localOrder.status,
                createdAt: localOrder.createdAt,
                shippingName: localOrder.shippingName,
                shippingAddress: parsedShippingAddress,
                rawShippingAddress: localOrder.shippingAddress,
              }
            : null,
          localUser:
            localUser ||
            (localOrder?.user
              ? {
                  id: localOrder.user.id,
                  name: localOrder.user.name,
                  firstName: localOrder.user.firstName,
                  lastName: localOrder.user.lastName,
                  email: localOrder.user.email,
                  stripeCustomerId: localOrder.user.stripeCustomerId,
                }
              : null),
          productDescription: productDescription,
          shippingAddress: shippingAddress,

          description: pi.description,
          paymentMethod: pi.payment_method_types?.[0] || "card",
          receiptUrl: charge?.receipt_url,
          fee: fee,
          netAmount: pi.amount - fee,
          metadata: pi.metadata || {},
        };
      }),
    );

    return NextResponse.json({
      transactions,
      hasMore: paymentIntents.has_more,
      summary: {
        totalTransactions: transactions.length,
        withLocalData: transactions.filter((t) => t.localOrder || t.localUser)
          .length,
        withStripeCustomer: transactions.filter((t) => t.customerId).length,
        withLocalUser: transactions.filter((t) => t.localUser).length,
        withShipping: transactions.filter((t) => t.shippingAddress).length,
      },
    });
  } catch (error) {
    console.error(" Error fetching Stripe transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
