import { EmailTemplate } from "../../_components/email/email-template";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRequest {
  email: string;
  firstName: string;
  verificationCode?: string;
  type?: "otp" | "reset-password" | "welcome";
  resetUrl?: string;
}

export async function POST(request: Request) {
  try {
    const { email, firstName, verificationCode, type, resetUrl }: EmailRequest =
      await request.json();

    if (!email || !firstName) {
      return Response.json(
        { error: "Email and firstName are required" },
        { status: 400 },
      );
    }

    let subject = "";

    // Determine email subject based on type
    switch (type) {
      case "reset-password":
        subject = "Reset Your  Password";
        break;
      case "otp":
        subject = "Verify Your  Account";
        break;
      default:
        subject = "Welcome to Skipsetup !";
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_EMAIL_FROM!,
      to: [email],
      subject,
      react: EmailTemplate({
        firstName,
        verificationCode,
        type,
        resetUrl,
      }),
    });

    if (error) {
      console.error("Resend error:", error);
      return Response.json({ error }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Email sent successfully",
      data,
    });
  } catch (error) {
    console.error("Email sending error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
