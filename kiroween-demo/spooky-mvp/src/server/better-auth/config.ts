import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, admin } from "better-auth/plugins";
import { PrismaClient } from "../../../generated/prisma/client";
import { nextCookies } from "better-auth/next-js";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      stripeCustomerId: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url, token }, request) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/email`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: user.email,
              firstName: user.firstName || "User",
              type: "reset-password",
              resetUrl: url,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to send reset password email");
        }
        console.log(`Reset password email sent to ${user.email}`);
      } catch (error) {
        console.error("Error sending reset password email:", error);
        throw error;
      }
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Password for user ${user.email} has been reset.`);
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
  },
  plugins: [
    emailOTP({
      sendVerificationOnSignUp: false,
      disableSignUp: false,
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                firstName: "User",
                verificationCode: otp,
                type: "otp",
              }),
            },
          );

          if (!response.ok) {
            throw new Error("Failed to send OTP email");
          }
          console.log(`OTP ${otp} sent to ${email} for ${type}`);
        } catch (error) {
          console.error("Error sending OTP email:", error);
          throw error;
        }
      },
    }),
    nextCookies(),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL,
});
