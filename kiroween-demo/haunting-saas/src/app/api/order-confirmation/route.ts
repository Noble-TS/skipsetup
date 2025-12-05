import { OrderConfirmationEmail } from "~/app/_components/email/OrderConfirmationEmail";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderConfirmationRequest {
  email: string;
  firstName: string;
  orderId: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress?: {
    recipientName: string;
    address: string;
    city: string;
    region: string;
  };
}

export async function POST(request: Request) {
  try {
    const {
      email,
      firstName,
      orderId,
      orderDate,
      totalAmount,
      status,
      items,
      shippingAddress,
    }: OrderConfirmationRequest = await request.json();

    if (
      !email ||
      !firstName ||
      !orderId ||
      !orderDate ||
      !totalAmount ||
      !status ||
      !items
    ) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: "Acme <noreply@acme.com>",
      to: [email],
      subject: `Your Order Confirmation - ${orderId}`,
      react: OrderConfirmationEmail({
        firstName,
        orderId,
        orderDate,
        totalAmount,
        status,
        items,
        shippingAddress,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Order confirmation email sent successfully",
      data,
    });
  } catch (error) {
    console.error("Order confirmation email sending error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
