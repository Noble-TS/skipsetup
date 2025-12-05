import { type NextRequest } from "next/server";
import { stripe } from "~/server/stripe/stripe";
import { db } from "~/server/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await request.headers;
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("❌ No Stripe signature found");
      return Response.json({ error: "No signature" }, { status: 400 });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!,
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return Response.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Process event asynchronously (don't block response)
    processEvent(event).catch(console.error);

    return Response.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function processEvent(event: Stripe.Event) {
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(event.data.object as any);
        break;

      case "payment_intent.succeeded":
        break;

      case "charge.succeeded":
        break;

      case "charge.updated":
        break;

      default:
        break;
    }
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error);
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("No order ID in session metadata");
    return;
  }

  try {
    // Get the order with user and product details
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error("Order not found:", orderId);
      return;
    }

    // Update order status based on payment status
    const paymentStatus = session.payment_status;
    let newStatus = "PENDING";

    if (paymentStatus === "paid") {
      newStatus = "PAID";
    } else {
      newStatus = "PENDING";
    }

    // Update order in database
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        stripePaymentIntentId: session.payment_intent,
        // Store shipping details if available
        ...(session.shipping_details && {
          shippingName: session.shipping_details.name,
          shippingAddress: JSON.stringify(session.shipping_details.address),
        }),
      },
    });

    // Send confirmation email for paid orders using the new API route
    if (newStatus === "PAID") {
      await sendOrderConfirmationEmail(order, session.shipping_details);
    } else {
      console.log(`Order ${orderId} payment status: ${paymentStatus}`);
    }
  } catch (error) {
    console.error("Error handling checkout session completion:", error);
  }
}

async function handleCheckoutSessionExpired(session: any) {
  const orderId = session.metadata?.orderId;
  if (orderId) {
    try {
      await db.order.update({
        where: { id: orderId },
        data: { status: "EXPIRED" },
      });
      console.log(`Order ${orderId} marked as expired`);
    } catch (error) {
      console.error("Error updating expired order:", error);
    }
  }
}

async function sendOrderConfirmationEmail(order: any, shippingDetails: any) {
  try {
    let shippingAddress = null;
    if (shippingDetails?.address) {
      shippingAddress = {
        recipientName: shippingDetails.name || "Recipient",
        address: `${shippingDetails.address.line1}${shippingDetails.address.line2 ? `, ${shippingDetails.address.line2}` : ""}`,
        city: shippingDetails.address.city || "",
        region: shippingDetails.address.state || "",
      };
    }

    // Prepare the email data for the API route
    const emailPayload = {
      email: order.user.email!,
      firstName: order.user.firstName || order.user.name || "Valued Customer",
      orderId: order.id,
      orderDate: order.createdAt.toISOString(),
      totalAmount: order.amount,
      status: "CONFIRMED",
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: shippingAddress,
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/order-confirmation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailPayload),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to send order confirmation email:", result.error);
      return;
    }

    console.log(`Order confirmation email sent for order ${order.id}`);
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    console.error("Error details:", error);
  }
}
