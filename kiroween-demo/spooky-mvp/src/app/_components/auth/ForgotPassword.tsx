"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import { ChevronLeft, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // T3 Theme Constants
  const accentText = "text-[hsl(280,100%,70%)]";
  const inputStyles =
    "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data, error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(
          error.message || "Failed to send reset email. Please try again.",
        );
        return;
      }

      if (data) {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] py-12 font-sans sm:px-6 lg:px-8">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link
            href="/signin"
            className="group inline-flex items-center text-sm text-purple-200 transition-colors hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Sign In
          </Link>
        </div>

        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-8 shadow-2xl backdrop-blur-xl sm:px-10">
          {/* Top Border Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="mb-8 text-center sm:mx-auto sm:w-full sm:max-w-md">
            <KeyRound className="mx-auto mb-4 h-12 w-12 text-purple-400" />
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {success ? "Check Your Email" : "Reset Your Password"}
            </h2>
            <p className="mt-2 text-sm text-purple-200">
              {success
                ? `We sent a reset link to ${email}`
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {success ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-center duration-300">
              <div className="mb-4 rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-sm text-green-200">
                <p>
                  We've sent a password reset link to{" "}
                  <strong className="text-white">{email}</strong>
                </p>
                <p className="mt-1">
                  Check your inbox and click the link to reset your password.
                </p>
              </div>

              <Button
                variant="t3-purple"
                onClick={() => (window.location.href = "/signin")}
                className="w-full"
              >
                Return to Sign In
              </Button>

              <p className="mt-4 text-sm text-purple-300">
                Didn't receive the email?{" "}
                <button
                  onClick={() => setSuccess(false)}
                  className={`${accentText} font-semibold transition-colors hover:text-white`}
                >
                  Try again
                </button>
              </p>

              {/* Spam Folder Notice */}
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-purple-300">
                  If you don't see the email in your inbox, please check your
                  spam folder.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="text-purple-100">Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className={inputStyles}
                    startIcon={<Mail className="h-4 w-4" />}
                  />
                  <p className="mt-2 text-xs text-purple-300">
                    Enter the email address associated with your account
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Send Reset Link
                </Button>
              </form>

              {/* Spam Folder Notice */}
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-center text-xs text-purple-300">
                  If you don't see the email in your inbox, please check your
                  spam folder.
                </p>
              </div>

              {/* Sign In Link */}
              <div className="mt-8 border-t border-white/10 pt-6 text-center">
                <p className="text-sm text-purple-200">
                  Remember your password?{" "}
                  <Link
                    href="/signin"
                    className={`${accentText} font-semibold transition-colors hover:text-white`}
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
