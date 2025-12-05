import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface OrderConfirmationEmailProps {
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

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function OrderConfirmationEmail({
  firstName,
  orderId,
  orderDate,
  totalAmount,
  status,
  items,
  shippingAddress,
}: OrderConfirmationEmailProps) {
  const formattedTotal = (totalAmount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });

  const formatPrice = (price: number) => {
    return (price / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  };

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-amber-50 font-serif text-[#5a4a3e]">
          <Preview>Your Order Confirmation</Preview>
          <Container className="mx-auto bg-amber-50 p-5">
            <Section className="overflow-hidden rounded-t-2xl bg-white shadow-lg">
              <Section
                className="flex items-center justify-center py-8"
                style={{ backgroundColor: "#10b981" }}
              >
                <Section className="text-center">
                  <Heading className="m-0 mb-2 text-[32px] font-bold text-white">
                    Order Confirmed
                  </Heading>
                  <Text className="m-0 text-[14px] text-emerald-200 italic">
                    Thank you for your purchase
                  </Text>
                </Section>
              </Section>

              <Section className="px-[35px] py-[30px]">
                <Heading
                  className="mb-[20px] text-center text-[28px] font-light"
                  style={{ color: "#5a4a3e" }}
                >
                  Thank You for Your Order, {firstName}!
                </Heading>

                <Text
                  className="mb-[20px] text-center text-[16px] leading-[26px]"
                  style={{ color: "#7a6a5a" }}
                >
                  Your order has been received and is being processed. We'll
                  notify you once it ships.
                </Text>

                {/* Order Confirmation Section */}
                <Section className="my-[30px] rounded-xl border border-amber-200 bg-amber-50 p-6">
                  <Text
                    className="m-0 mb-[15px] text-center text-[18px] font-semibold"
                    style={{ color: "#10b981" }}
                  >
                    Order Confirmed!
                  </Text>

                  <Text
                    className="m-0 mb-[20px] text-center text-[15px] leading-[24px]"
                    style={{ color: "#7a6a5a" }}
                  >
                    Your order has been received and is being processed. Here
                    are your order details:
                  </Text>

                  <Section className="my-[25px] text-center">
                    <Text
                      className="m-0 mb-[10px] text-[14px] font-medium"
                      style={{ color: "#5a4a3e" }}
                    >
                      Order Number
                    </Text>

                    <Text
                      className="mx-0 my-[15px] text-[32px] font-bold tracking-widest"
                      style={{ color: "#d1b68e" }}
                    >
                      {orderId}
                    </Text>

                    <Text
                      className="m-0 text-[13px] italic"
                      style={{ color: "#7a6a5a" }}
                    >
                      Ordered on{" "}
                      {new Date(orderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </Section>
                </Section>

                {/* Order Details */}
                <Section className="mb-6">
                  <Text
                    className="m-0 mb-4 text-center text-[18px] font-semibold"
                    style={{ color: "#5a4a3e" }}
                  >
                    Order Summary
                  </Text>

                  {items.map((item, index) => (
                    <Section
                      key={index}
                      className={`flex items-center justify-between py-3 ${index < items.length - 1 ? "border-b border-amber-200" : ""}`}
                    >
                      <Section>
                        <Text
                          className="m-0 mb-1 text-[15px] font-semibold"
                          style={{ color: "#5a4a3e" }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          className="m-0 text-[13px]"
                          style={{ color: "#7a6a5a" }}
                        >
                          Quantity: {item.quantity}
                        </Text>
                      </Section>
                      <Text
                        className="m-0 text-[15px] font-bold"
                        style={{ color: "#10b981" }}
                      >
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </Section>
                  ))}

                  <Section className="mt-4 flex items-center justify-between border-t border-amber-300 py-4">
                    <Text
                      className="m-0 text-[16px] font-semibold"
                      style={{ color: "#5a4a3e" }}
                    >
                      Total Amount
                    </Text>
                    <Text
                      className="m-0 text-[20px] font-bold"
                      style={{ color: "#10b981" }}
                    >
                      {formattedTotal}
                    </Text>
                  </Section>
                </Section>

                {/* Shipping Address */}
                {shippingAddress && (
                  <Section className="mb-6 rounded-lg border border-stone-200 bg-white p-4">
                    <Text
                      className="m-0 mb-2 text-[16px] font-semibold"
                      style={{ color: "#5a4a3e" }}
                    >
                      Delivery To
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: "#7a6a5a" }}
                    >
                      {shippingAddress.recipientName}
                      <br />
                      {shippingAddress.address}
                      <br />
                      {shippingAddress.city}, {shippingAddress.region}
                    </Text>
                  </Section>
                )}

                <Section className="mb-6 rounded-lg border border-stone-200 bg-white p-4 text-center">
                  <Text
                    className="m-0 mb-1 text-[14px] font-medium"
                    style={{ color: "#7a6a5a" }}
                  >
                    CURRENT STATUS
                  </Text>
                  <Text
                    className="m-0 text-[18px] font-semibold capitalize"
                    style={{ color: "#10b981" }}
                  >
                    {status.toLowerCase()}
                  </Text>
                </Section>

                <Section className="my-[30px] grid grid-cols-1 gap-4">
                  <Section className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4">
                    <Text
                      className="m-0 text-[36px]"
                      style={{ color: "#d1b68e" }}
                    >
                      📧
                    </Text>
                    <Section>
                      <Text
                        className="m-0 mb-1 text-[16px] font-semibold"
                        style={{ color: "#5a4a3e" }}
                      >
                        Order Processing
                      </Text>
                      <Text
                        className="m-0 text-[14px]"
                        style={{ color: "#7a6a5a" }}
                      >
                        Your order is being prepared
                      </Text>
                    </Section>
                  </Section>

                  <Section className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4">
                    <Text
                      className="m-0 text-[36px]"
                      style={{ color: "#10b981" }}
                    >
                      🔍
                    </Text>
                    <Section>
                      <Text
                        className="m-0 mb-1 text-[16px] font-semibold"
                        style={{ color: "#5a4a3e" }}
                      >
                        Quality Check
                      </Text>
                      <Text
                        className="m-0 text-[14px]"
                        style={{ color: "#7a6a5a" }}
                      >
                        Ensuring your items meet quality standards
                      </Text>
                    </Section>
                  </Section>

                  <Section className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4">
                    <Text
                      className="m-0 text-[36px]"
                      style={{ color: "#d1b68e" }}
                    >
                      🚚
                    </Text>
                    <Section>
                      <Text
                        className="m-0 mb-1 text-[16px] font-semibold"
                        style={{ color: "#5a4a3e" }}
                      >
                        Delivery Preparation
                      </Text>
                      <Text
                        className="m-0 text-[14px]"
                        style={{ color: "#7a6a5a" }}
                      >
                        Items are being packaged for shipping
                      </Text>
                    </Section>
                  </Section>
                </Section>

                {/* Call to Action */}
                <Section className="mt-[30px] text-center">
                  <Text
                    className="m-0 mb-[15px] text-[16px] font-semibold"
                    style={{ color: "#5a4a3e" }}
                  >
                    Want to track your order or make another purchase?
                  </Text>
                  <Section className="flex flex-col justify-center gap-3">
                    <Link
                      href={`${baseUrl}/orders`}
                      className="inline-block rounded-xl bg-[#10b981] px-8 py-3 text-center text-[16px] font-semibold text-white no-underline"
                    >
                      View Order Details
                    </Link>
                    <Link
                      href={`${baseUrl}/shop`}
                      className="inline-block rounded-xl bg-[#d1b68e] px-8 py-3 text-center text-[16px] font-semibold text-white no-underline"
                    >
                      Continue Shopping
                    </Link>
                  </Section>
                </Section>
              </Section>

              <Hr className="border-stone-200" />

              {/* Security Notice */}
              <Section className="bg-amber-50 px-[35px] py-[25px]">
                <Text
                  className="m-0 text-center text-[14px] leading-[20px]"
                  style={{ color: "#7a6a5a" }}
                >
                  <strong>Security Notice:</strong> We will never email you and
                  ask you to disclose or verify your password, credit card, or
                  banking account number.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="mt-[20px] text-center">
              <Text
                className="m-0 mb-2 text-[12px] leading-[18px]"
                style={{ color: "#7a6a5a" }}
              >
                Thank you for shopping with us. We appreciate your business.
              </Text>

              <Text
                className="m-0 text-[11px] leading-[16px]"
                style={{ color: "#7a6a5a" }}
              >
                © {new Date().getFullYear()} All rights reserved.{" "}
                <Link
                  href={`${baseUrl}/contact`}
                  className="underline"
                  style={{ color: "#10b981" }}
                >
                  Contact Support
                </Link>{" "}
                •{" "}
                <Link
                  href={`${baseUrl}/faq`}
                  className="underline"
                  style={{ color: "#10b981" }}
                >
                  FAQ
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

OrderConfirmationEmail.PreviewProps = {
  firstName: "Helen",
  orderId: "ORD-789456123",
  orderDate: new Date().toISOString(),
  totalAmount: 27500,
  status: "CONFIRMED",
  items: [
    {
      name: "Sample Product",
      quantity: 1,
      price: 27500,
    },
    {
      name: "Another Product",
      quantity: 2,
      price: 9500,
    },
  ],
  shippingAddress: {
    recipientName: "John Doe",
    address: "123 Main Street",
    city: "New York",
    region: "NY",
  },
} satisfies OrderConfirmationEmailProps;
