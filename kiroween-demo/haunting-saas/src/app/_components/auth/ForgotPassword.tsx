"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import {
  ChevronLeft,
  Mail,
  KeyRound,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputStyles =
    "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

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
    <div className="relative flex min-h-screen w-full overflow-hidden bg-gradient-to-br from-neutral-50 to-emerald-50/30 font-sans dark:from-neutral-900 dark:to-emerald-950/20">
      <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link
              href="/signin"
              className="group inline-flex items-center text-sm font-medium text-neutral-600 transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
            >
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Sign In
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-2xl sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                  {success ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : (
                    <KeyRound className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                {success ? "Check Your Email" : "Reset Your Password"}
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                {success
                  ? `We sent a reset link to ${email}`
                  : "Enter your email to receive a password reset link"}
              </p>
            </div>

            {success ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-center duration-300">
                <div className="mb-4 rounded-xl border-l-4 border-green-400 bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-medium">Reset link sent successfully!</p>
                  </div>
                  <p className="mt-1 text-green-600 dark:text-green-400">
                    Check your inbox at{" "}
                    <strong className="text-green-800 dark:text-green-300">
                      {email}
                    </strong>
                  </p>
                </div>

                <Button
                  variant="emerald"
                  onClick={() => (window.location.href = "/signin")}
                  className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight className="h-5 w-5" />
                    Return to Sign In
                  </span>
                </Button>

                <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
                  Didn't receive the email?{" "}
                  <button
                    onClick={() => setSuccess(false)}
                    className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Try again
                  </button>
                </p>

                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    If you don't see the email in your inbox, please check your
                    spam folder.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-xl border-l-4 border-red-400 bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      {error}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className={inputStyles}
                      startIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                    />
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      Enter the email address associated with your account
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="emerald"
                    size="lg"
                    disabled={isLoading}
                    isLoading={isLoading}
                    className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Sending Reset Link...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Send Reset Link
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
                  <p className="text-center text-sm text-neutral-600 dark:text-neutral-300">
                    If you don't see the email in your inbox, please check your
                    spam folder.
                  </p>
                </div>

                <div className="mt-8 border-t border-neutral-200 pt-6 text-center dark:border-neutral-700">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Remember your password?{" "}
                    <Link
                      href="/signin"
                      className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
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
    </div>
  );
}
