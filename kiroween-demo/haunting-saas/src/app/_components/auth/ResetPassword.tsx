"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { authClient } from "../../../server/better-auth/client";

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  const inputStyles =
    "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    } else {
      setTokenError(
        "Invalid or missing reset token. Please request a new reset link.",
      );
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return setError("Invalid reset token");
    if (!formData.newPassword || !formData.confirmPassword)
      return setError("Please fill in all fields");
    if (formData.newPassword.length < 8)
      return setError("Password must be at least 8 characters long");
    if (formData.newPassword !== formData.confirmPassword)
      return setError("Passwords do not match");

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.resetPassword({
        newPassword: formData.newPassword,
        token,
      });

      if (error) {
        setError(
          error.message?.includes("invalid") ||
            error.message?.includes("expired")
            ? "This reset link is invalid or has expired. Please request a new one."
            : error.message || "Failed to reset password. Please try again.",
        );
        return;
      }

      if (data) {
        setSuccess(true);
        setTimeout(() => (window.location.href = "/signin"), 3000);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 to-emerald-50/30 p-6 font-sans dark:from-neutral-900 dark:to-emerald-950/20">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link
              href="/forgot-password"
              className="group inline-flex items-center text-sm font-medium text-neutral-600 transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
            >
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Forgot Password
            </Link>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-2xl sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-neutral-600 dark:text-neutral-300">
                {tokenError}
              </p>
            </div>

            <div className="mb-6 rounded-xl border-l-4 border-red-400 bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                This link may have expired or is invalid
              </div>
            </div>

            <Button
              variant="emerald"
              onClick={() => (window.location.href = "/forgot-password")}
              className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
            >
              <span className="flex items-center justify-center gap-2">
                <KeyRound className="h-5 w-5" />
                Request New Reset Link
              </span>
            </Button>

            {/* Additional Help Text */}
            <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
              <p className="text-center text-sm text-neutral-600 dark:text-neutral-300">
                Reset links expire for security reasons. Request a new one to
                continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-50 to-emerald-50/30 p-6 font-sans dark:from-neutral-900 dark:to-emerald-950/20">
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
              {success ? "Password Reset!" : "Create New Password"}
            </h2>
            <p className="mt-2 text-neutral-600 dark:text-neutral-300">
              {success
                ? "Your password has been successfully reset"
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-center duration-300">
              <div className="mb-4 rounded-xl border-l-4 border-green-400 bg-green-50 p-4 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-medium">
                    Your password has been successfully updated!
                  </p>
                </div>
                <p className="mt-1 text-green-600 dark:text-green-400">
                  Redirecting you to sign in...
                </p>
              </div>

              <Button
                variant="emerald"
                onClick={() => (window.location.href = "/signin")}
                className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
              >
                <span className="flex items-center justify-center gap-2">
                  <ArrowRight className="h-5 w-5" />
                  Sign In Now
                </span>
              </Button>

              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  You can now sign in with your new password.
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
                {/* New Password Field */}
                <div className="animate-in fade-in delay-100 duration-500">
                  <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className={`${inputStyles} pr-12`}
                      startIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        !isLoading && setShowPassword(!showPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="animate-in fade-in delay-200 duration-500">
                  <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      className={`${inputStyles} pr-12`}
                      startIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        !isLoading &&
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
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
                      Resetting Password...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <KeyRound className="h-5 w-5" />
                      Reset Password
                    </span>
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
                <p className="text-center text-sm text-neutral-600 dark:text-neutral-300">
                  Choose a strong password that you haven't used before
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
  );
}
