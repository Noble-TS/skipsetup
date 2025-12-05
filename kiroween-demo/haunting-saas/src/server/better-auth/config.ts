import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP, admin } from "better-auth/plugins";
import { PrismaClient } from "../../../generated/prisma/client";
import { nextCookies } from "better-auth/next-js";

import { ac, roles } from "./access-control";

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
      } catch (error) {
        console.error("Error sending reset password email:", error);
        throw error;
      }
    },
    onPasswordReset: async ({ user }, request) => {
      // You can add additional logic here like logging, notifications, etc.
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
        } catch (error) {
          console.error("Error sending OTP email:", error);
          throw error;
        }
      },
    }),
    admin({
      ac,
      roles: {
        customer: roles.customer,
        contentManager: roles.contentManager,
        orderManager: roles.orderManager,
        financeManager: roles.financeManager,
        admin: roles.admin,
        superAdmin: roles.superAdmin,
      },
      defaultRole: "user",
      adminUserIds: ["qpXFID7g8sKu8mDtZnduBMcKUoB0lGfT"],
      impersonationSessionDuration: 60 * 60 * 2, // 2 hours
      defaultBanReason: "Violation of terms of service",
      defaultBanExpiresIn: 60 * 60 * 24 * 30, // 30 days
      bannedUserMessage:
        "Your account has been suspended. Please contact support for assistance.",
    }),
    nextCookies(),
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
