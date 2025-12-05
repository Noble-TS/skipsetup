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
  Button as EmailButton,
} from "@react-email/components";

interface EmailTemplateProps {
  firstName: string;
  verificationCode?: string;
  type?: "otp" | "reset-password" | "welcome";
  resetUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

export function EmailTemplate({
  firstName,
  verificationCode,
  type = "welcome",
  resetUrl,
}: EmailTemplateProps) {
  // Aqua/Mint Cyan Theme Colors
  const aquaTheme = {
    primary: "#57E3E7", // Aqua / Mint Cyan (Bright)
    accent: "#41C1A6", // Teal Green
    background: {
      primary: "linear-gradient(135deg, #0A3442 0%, #083B4D 100%)",
      secondary: "rgba(10, 52, 66, 0.9)",
      card: "rgba(87, 227, 231, 0.1)",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#E0F7FA",
      muted: "#B2EBF2",
      dim: "#80DEEA",
    },
    border: "rgba(87, 227, 231, 0.3)",
  };

  const getEmailContent = () => {
    switch (type) {
      case "reset-password":
        return {
          preview: "Reset Your SKIPSETUP Password",
          title: "Reset Your Password",
          subtitle:
            "We received a request to reset your password for your SKIPSETUP account.",
          mainContent: (
            <>
              <Section className="bg-aqua-500/10 border-aqua-500/30 my-[30px] rounded-xl border p-6 backdrop-blur-sm">
                <Text
                  className="m-0 mb-[15px] text-center text-[18px] font-semibold"
                  style={{ color: aquaTheme.accent }}
                >
                  Reset Your Password
                </Text>

                <Text
                  className="m-0 mb-[20px] text-center text-[15px] leading-[24px]"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  Click the button below to reset your password and regain
                  access to your account.
                </Text>

                <Section className="my-[25px] text-center">
                  <EmailButton
                    href={resetUrl}
                    className="rounded-lg px-8 py-4 text-center text-[16px] font-semibold no-underline transition-colors"
                    style={{
                      background: aquaTheme.accent,
                      color: aquaTheme.text.primary,
                    }}
                  >
                    Reset Password
                  </EmailButton>
                </Section>

                <Text
                  className="m-0 mb-3 text-center text-[13px]"
                  style={{ color: aquaTheme.text.muted }}
                >
                  Or copy and paste this link in your browser:
                </Text>

                <Text
                  className="bg-aqua-500/10 border-aqua-500/20 m-0 rounded border p-3 text-center font-mono text-[12px] break-all"
                  style={{ color: aquaTheme.primary }}
                >
                  {resetUrl}
                </Text>

                <Text
                  className="m-0 mt-4 text-center text-[13px] italic"
                  style={{ color: aquaTheme.text.muted }}
                >
                  This link will expire in 1 hour for security reasons.
                </Text>
              </Section>

              <Text
                className="m-0 my-[20px] text-center text-[14px] leading-[22px]"
                style={{ color: aquaTheme.text.secondary }}
              >
                If you didn't request this password reset, please ignore this
                email. Your account remains secure.
              </Text>
            </>
          ),
        };

      case "otp":
        return {
          preview: "Verify Your SKIPSETUP Account",
          title: "Verify Your Email Address",
          subtitle:
            "Welcome to SKIPSETUP! Please verify your email to get started.",
          mainContent: (
            <>
              <Section className="bg-aqua-500/10 border-aqua-500/30 my-[30px] rounded-xl border p-6 backdrop-blur-sm">
                <Text
                  className="m-0 mb-[15px] text-center text-[18px] font-semibold"
                  style={{ color: aquaTheme.accent }}
                >
                  Verify Your Email Address
                </Text>

                <Text
                  className="m-0 mb-[20px] text-center text-[15px] leading-[24px]"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  Please use the following verification code to complete your
                  account setup.
                </Text>

                <Section className="my-[25px] text-center">
                  <Text
                    className="m-0 mb-[10px] text-[14px] font-medium"
                    style={{ color: aquaTheme.text.secondary }}
                  >
                    Your Verification Code
                  </Text>

                  <Text
                    className="mx-0 my-[15px] font-mono text-[42px] font-bold tracking-widest"
                    style={{ color: aquaTheme.primary }}
                  >
                    {verificationCode}
                  </Text>

                  <Text
                    className="m-0 text-[13px] italic"
                    style={{ color: aquaTheme.text.muted }}
                  >
                    (This code is valid for 15 minutes)
                  </Text>
                </Section>
              </Section>
            </>
          ),
        };

      default:
        return {
          preview: "Welcome to SKIPSETUP",
          title: "Welcome to SKIPSETUP!",
          subtitle: "Your production-ready fullstack foundation is ready.",
          mainContent: (
            <>
              <Text
                className="mb-[20px] text-center text-[16px] leading-[26px]"
                style={{ color: aquaTheme.text.secondary }}
              >
                Get ready to build faster with type-safe, zero-config
                scaffolding and AI-powered development.
              </Text>

              {/* Features Highlight */}
              <Section className="my-[30px] grid grid-cols-1 gap-4">
                <Section className="bg-aqua-500/10 border-aqua-500/30 flex items-center gap-4 rounded-lg border p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: aquaTheme.primary }}
                  >
                    ⚡
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      Zero-Config Setup
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Production-ready foundations in one command
                    </Text>
                  </Section>
                </Section>

                <Section className="bg-aqua-500/10 border-aqua-500/30 flex items-center gap-4 rounded-lg border p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: aquaTheme.accent }}
                  >
                    🤖
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      AI-Powered Development
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Build features faster with constrained AI
                    </Text>
                  </Section>
                </Section>

                <Section className="bg-aqua-500/10 border-aqua-500/30 flex items-center gap-4 rounded-lg border p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: aquaTheme.primary }}
                  >
                    🔧
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: aquaTheme.text.primary }}
                    >
                      Integrated Plugins
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: aquaTheme.text.secondary }}
                    >
                      Stripe, Auth, Database & more - ready to use
                    </Text>
                  </Section>
                </Section>
              </Section>

              {/* Call to Action */}
              <Section className="mt-[30px] text-center">
                <Text
                  className="m-0 mb-[15px] text-[16px] font-semibold"
                  style={{ color: aquaTheme.text.primary }}
                >
                  Ready to start building?
                </Text>
                <EmailButton
                  href={`${baseUrl}/dashboard`}
                  className="rounded-lg px-8 py-3 text-center text-[16px] font-semibold no-underline transition-colors"
                  style={{
                    background: aquaTheme.primary,
                    color: aquaTheme.text.primary,
                  }}
                >
                  Go to Dashboard
                </EmailButton>
              </Section>
            </>
          ),
        };
    }
  };

  const emailContent = getEmailContent();

  return (
    <Html>
      <Head />
      <Tailwind>
        <Body
          className="font-sans text-white"
          style={{ background: aquaTheme.background.primary }}
        >
          <Preview>{emailContent.preview}</Preview>
          <Container className="mx-auto p-5">
            {/* Header Section with KIPSETUP Styling */}
            <Section
              className="border-aqua-500/30 overflow-hidden rounded-xl border bg-white/10 shadow-2xl backdrop-blur-lg"
              style={{ background: aquaTheme.background.secondary }}
            >
              {/* Gradient Header */}
              <Section
                className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden py-12"
                style={{
                  background: `linear-gradient(135deg, ${aquaTheme.primary} 0%, ${aquaTheme.accent} 100%)`,
                }}
              >
                {/* Subtle Pattern Overlay */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                {/* Centered Content Container */}
                <Section className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4">
                  {/* Large S Logo */}
                  <Section className="mb-2 flex items-center justify-center">
                    <Img
                      src="https://raw.githubusercontent.com/Noble-TS/skipsetup/master/logo-skip.png"
                      width="120"
                      height="40"
                      alt="SkipSetup Logo"
                      className="mx-auto"
                    />
                  </Section>

                  {/* KIPSETUP Brand Name */}
                  <Heading
                    className="m-0 w-full text-center text-[32px] font-bold tracking-tight text-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    SKIPSETUP
                  </Heading>

                  {/* Tagline */}
                  <Text
                    className="m-0 w-full text-center text-[14px] font-light text-white/80"
                    style={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    Production-Ready Fullstack Foundations
                  </Text>
                </Section>
              </Section>

              {/* Main Content */}
              <Section className="bg-transparent px-[35px] py-[30px]">
                <Heading
                  className="mb-[20px] text-center text-[28px] font-bold tracking-tight"
                  style={{ color: aquaTheme.text.primary }}
                >
                  {emailContent.title}
                </Heading>

                <Text
                  className="mb-[20px] text-center text-[16px] leading-[26px] font-light"
                  style={{ color: aquaTheme.text.secondary }}
                >
                  {emailContent.subtitle}
                </Text>

                {emailContent.mainContent}
              </Section>

              <Hr style={{ borderColor: aquaTheme.border }} />

              {/* Security Notice */}
              <Section className="bg-aqua-500/10 px-[35px] py-[25px] backdrop-blur-sm">
                <Text
                  className="m-0 text-center text-[14px] leading-[20px] font-light"
                  style={{ color: aquaTheme.text.muted }}
                >
                  <strong style={{ color: aquaTheme.text.primary }}>
                    Security Notice:
                  </strong>{" "}
                  SKIPSETUP will never email you and ask you to disclose or
                  verify your password, credit card, or banking account number.
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="mt-[20px] text-center">
              <Text
                className="m-0 mb-2 text-[12px] leading-[18px] font-light"
                style={{ color: aquaTheme.text.muted }}
              >
                Build faster with production-ready foundations and AI-powered
                development.
              </Text>

              <Text
                className="m-0 text-[11px] leading-[16px] font-light"
                style={{ color: aquaTheme.text.dim }}
              >
                © {new Date().getFullYear()} SKIPSETUP. All rights reserved.{" "}
                <Link
                  href={`${baseUrl}/terms`}
                  className="font-normal underline"
                  style={{ color: aquaTheme.primary }}
                >
                  Terms & Conditions
                </Link>{" "}
                •{" "}
                <Link
                  href={`${baseUrl}/privacy`}
                  className="font-normal underline"
                  style={{ color: aquaTheme.primary }}
                >
                  Privacy Policy
                </Link>
              </Text>

              {/* Brand Tagline */}
              <Text
                className="m-0 mt-4 mb-2 text-[13px] font-light italic"
                style={{ color: aquaTheme.primary }}
              >
                "Zero-Config, Production-Ready"
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

EmailTemplate.PreviewProps = {
  firstName: "Alex",
  verificationCode: "123456",
  type: "welcome",
} satisfies EmailTemplateProps;
