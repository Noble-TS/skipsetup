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
  const emeraldTheme = {
    primary: "#10b981",
    accent: "#059669",
    background: {
      primary: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
      secondary: "rgba(6, 78, 59, 0.9)",
      card: "rgba(16, 185, 129, 0.1)",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#d1fae5",
      muted: "#a7f3d0",
      dim: "#6ee7b7",
    },
    border: "rgba(16, 185, 129, 0.3)",
  };

  const getEmailContent = () => {
    switch (type) {
      case "reset-password":
        return {
          preview: "Reset Your Account Password",
          title: "Reset Your Password",
          subtitle:
            "We received a request to reset your password for your account.",
          mainContent: (
            <>
              <Section className="my-[30px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-sm">
                <Text
                  className="m-0 mb-[15px] text-center text-[18px] font-semibold"
                  style={{ color: emeraldTheme.accent }}
                >
                  Reset Your Password
                </Text>

                <Text
                  className="m-0 mb-[20px] text-center text-[15px] leading-[24px]"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  Click the button below to reset your password and regain
                  access to your account.
                </Text>

                <Section className="my-[25px] text-center">
                  <EmailButton
                    href={resetUrl}
                    className="rounded-lg px-8 py-4 text-center text-[16px] font-semibold no-underline transition-colors"
                    style={{
                      background: emeraldTheme.accent,
                      color: emeraldTheme.text.primary,
                    }}
                  >
                    Reset Password
                  </EmailButton>
                </Section>

                <Text
                  className="m-0 mb-3 text-center text-[13px]"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  Or copy and paste this link in your browser:
                </Text>

                <Text
                  className="m-0 rounded border border-emerald-500/20 bg-emerald-500/10 p-3 text-center font-mono text-[12px] break-all"
                  style={{ color: emeraldTheme.primary }}
                >
                  {resetUrl}
                </Text>

                <Text
                  className="m-0 mt-4 text-center text-[13px] italic"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  This link will expire in 1 hour for security reasons.
                </Text>
              </Section>

              <Text
                className="m-0 my-[20px] text-center text-[14px] leading-[22px]"
                style={{ color: emeraldTheme.text.secondary }}
              >
                If you didn't request this password reset, please ignore this
                email. Your account remains secure.
              </Text>
            </>
          ),
        };

      case "otp":
        return {
          preview: "Verify Your Account",
          title: "Verify Your Email Address",
          subtitle: "Welcome! Please verify your email to get started.",
          mainContent: (
            <>
              <Section className="my-[30px] rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 backdrop-blur-sm">
                <Text
                  className="m-0 mb-[15px] text-center text-[18px] font-semibold"
                  style={{ color: emeraldTheme.accent }}
                >
                  Verify Your Email Address
                </Text>

                <Text
                  className="m-0 mb-[20px] text-center text-[15px] leading-[24px]"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  Please use the following verification code to complete your
                  account setup.
                </Text>

                <Section className="my-[25px] text-center">
                  <Text
                    className="m-0 mb-[10px] text-[14px] font-medium"
                    style={{ color: emeraldTheme.text.secondary }}
                  >
                    Your Verification Code
                  </Text>

                  <Text
                    className="mx-0 my-[15px] font-mono text-[42px] font-bold tracking-widest"
                    style={{ color: emeraldTheme.primary }}
                  >
                    {verificationCode}
                  </Text>

                  <Text
                    className="m-0 text-[13px] italic"
                    style={{ color: emeraldTheme.text.muted }}
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
          preview: "Welcome!",
          title: "Welcome!",
          subtitle: "Your account has been successfully created.",
          mainContent: (
            <>
              <Text
                className="mb-[20px] text-center text-[16px] leading-[26px]"
                style={{ color: emeraldTheme.text.secondary }}
              >
                Get ready to start building amazing things with our platform.
              </Text>

              <Section className="my-[30px] grid grid-cols-1 gap-4">
                <Section className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: emeraldTheme.primary }}
                  >
                    ⚡
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Fast & Reliable
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      Performance-optimized platform
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: emeraldTheme.accent }}
                  >
                    🔒
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Secure Platform
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      Enterprise-grade security
                    </Text>
                  </Section>
                </Section>

                <Section className="flex items-center gap-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 backdrop-blur-sm">
                  <Text
                    className="m-0 text-[36px]"
                    style={{ color: emeraldTheme.primary }}
                  >
                    🔧
                  </Text>
                  <Section>
                    <Text
                      className="m-0 mb-1 text-[16px] font-semibold"
                      style={{ color: emeraldTheme.text.primary }}
                    >
                      Modern Tools
                    </Text>
                    <Text
                      className="m-0 text-[14px]"
                      style={{ color: emeraldTheme.text.secondary }}
                    >
                      All the tools you need in one place
                    </Text>
                  </Section>
                </Section>
              </Section>

              {/* Call to Action */}
              <Section className="mt-[30px] text-center">
                <Text
                  className="m-0 mb-[15px] text-[16px] font-semibold"
                  style={{ color: emeraldTheme.text.primary }}
                >
                  Ready to get started?
                </Text>
                <EmailButton
                  href={`${baseUrl}/dashboard`}
                  className="rounded-lg px-8 py-3 text-center text-[16px] font-semibold no-underline transition-colors"
                  style={{
                    background: emeraldTheme.primary,
                    color: emeraldTheme.text.primary,
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
          style={{ background: emeraldTheme.background.primary }}
        >
          <Preview>{emailContent.preview}</Preview>
          <Container className="mx-auto p-5">
            <Section
              className="overflow-hidden rounded-xl border border-emerald-500/30 bg-white/10 shadow-2xl backdrop-blur-lg"
              style={{ background: emeraldTheme.background.secondary }}
            >
              <Section
                className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden py-12"
                style={{
                  background: `linear-gradient(135deg, ${emeraldTheme.primary} 0%, ${emeraldTheme.accent} 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, white 1px, transparent 1px)`,
                    backgroundSize: "20px 20px",
                  }}
                />

                <Section className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-4">
                  <Heading
                    className="m-0 w-full text-center text-[32px] font-bold tracking-tight text-white"
                    style={{ color: "#FFFFFF" }}
                  >
                    Welcome!
                  </Heading>

                  <Text
                    className="m-0 w-full text-center text-[14px] font-light text-white/80"
                    style={{ color: "rgba(255, 255, 255, 0.8)" }}
                  >
                    Building amazing things together
                  </Text>
                </Section>
              </Section>

              <Section className="bg-transparent px-[35px] py-[30px]">
                <Heading
                  className="mb-[20px] text-center text-[28px] font-bold tracking-tight"
                  style={{ color: emeraldTheme.text.primary }}
                >
                  {emailContent.title}
                </Heading>

                <Text
                  className="mb-[20px] text-center text-[16px] leading-[26px] font-light"
                  style={{ color: emeraldTheme.text.secondary }}
                >
                  {emailContent.subtitle}
                </Text>

                {emailContent.mainContent}
              </Section>

              <Hr style={{ borderColor: emeraldTheme.border }} />

              {/* Security Notice */}
              <Section className="bg-emerald-500/10 px-[35px] py-[25px] backdrop-blur-sm">
                <Text
                  className="m-0 text-center text-[14px] leading-[20px] font-light"
                  style={{ color: emeraldTheme.text.muted }}
                >
                  <strong style={{ color: emeraldTheme.text.primary }}>
                    Security Notice:
                  </strong>{" "}
                  We will never email you and ask you to disclose or verify your
                  password, credit card, or banking account number.
                </Text>
              </Section>
            </Section>

            <Section className="mt-[20px] text-center">
              <Text
                className="m-0 mb-2 text-[12px] leading-[18px] font-light"
                style={{ color: emeraldTheme.text.muted }}
              >
                Build amazing things with our modern platform.
              </Text>

              <Text
                className="m-0 text-[11px] leading-[16px] font-light"
                style={{ color: emeraldTheme.text.dim }}
              >
                © {new Date().getFullYear()} All rights reserved.{" "}
                <Link
                  href={`${baseUrl}/terms`}
                  className="font-normal underline"
                  style={{ color: emeraldTheme.primary }}
                >
                  Terms & Conditions
                </Link>{" "}
                •{" "}
                <Link
                  href={`${baseUrl}/privacy`}
                  className="font-normal underline"
                  style={{ color: emeraldTheme.primary }}
                >
                  Privacy Policy
                </Link>
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
