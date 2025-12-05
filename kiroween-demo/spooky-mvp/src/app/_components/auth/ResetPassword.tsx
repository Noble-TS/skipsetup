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

  const accentText = "text-[hsl(280,100%,70%)]";
  const accentHover = "hover:text-[hsl(280,100%,80%)]";
  const inputStyles =
    "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20 transition-all duration-200";
  const cardBorder = "border-white/10";
  const successBorder = "border-green-500/50";
  const errorBorder = "border-red-500/50";

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
      <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] py-12 font-sans sm:px-6 lg:px-8">
        {/* Enhanced Decorative Glow */}
        <div className="animate-pulse-slow pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
        <div className="animate-pulse-slow pointer-events-none absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-purple-400/10 blur-[140px]" />

        <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
          {/* Back Link */}
          <div className="mb-6 px-4 sm:px-0">
            <Link
              href="/forgot-password"
              className="group inline-flex items-center text-sm text-purple-200 transition-all duration-200 hover:text-white"
            >
              <ChevronLeft className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              Back to Forgot Password
            </Link>
          </div>

          {/* Enhanced Glass Card */}
          <div
            className={`bg-white/10 backdrop-blur-xl ${cardBorder} relative overflow-hidden rounded-2xl px-4 py-8 shadow-2xl sm:px-10`}
          >
            {/* Top Border Accent */}
            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

            <div className="text-center">
              <KeyRound className="animate-in fade-in mx-auto mb-4 h-12 w-12 text-purple-400 duration-500" />
              <h2 className="animate-in slide-in-from-top-4 mb-2 text-2xl font-bold text-white duration-500">
                Invalid Reset Link
              </h2>
              <p className="animate-in fade-in mb-6 text-purple-200 delay-100 duration-500">
                {tokenError}
              </p>

              <div
                className={`mb-6 rounded-lg p-3 text-sm ${errorBorder} animate-in fade-in bg-red-500/10 text-red-200 delay-200 duration-500`}
              >
                This link may have expired or is invalid
              </div>

              <Button
                variant="t3-purple"
                onClick={() => (window.location.href = "/forgot-password")}
                className="animate-in fade-in w-full delay-300 duration-500"
              >
                Request New Reset Link
              </Button>

              {/* Additional Help Text */}
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-purple-300">
                  Reset links expire for security reasons. Request a new one to
                  continue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] py-12 font-sans sm:px-6 lg:px-8">
      {/* Enhanced Decorative Glow */}
      <div className="animate-pulse-slow pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="animate-pulse-slow pointer-events-none absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-purple-400/10 blur-[140px]" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link
            href="/signin"
            className="group inline-flex items-center text-sm text-purple-200 transition-all duration-200 hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Sign In
          </Link>
        </div>

        {/* Enhanced Glass Card */}
        <div
          className={`bg-white/10 backdrop-blur-xl ${cardBorder} relative overflow-hidden rounded-2xl px-4 py-8 shadow-2xl sm:px-10`}
        >
          {/* Top Border Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="mb-8 text-center sm:mx-auto sm:w-full sm:max-w-md">
            {success ? (
              <CheckCircle className="animate-in fade-in mx-auto mb-4 h-12 w-12 scale-110 text-green-400 duration-500" />
            ) : (
              <KeyRound className="animate-in fade-in mx-auto mb-4 h-12 w-12 text-purple-400 duration-500" />
            )}
            <h2 className="animate-in slide-in-from-top-4 text-3xl font-bold tracking-tight text-white duration-500">
              {success ? "Password Reset!" : "Create New Password"}
            </h2>
            <p className="animate-in fade-in mt-2 text-sm text-purple-200 delay-100 duration-500">
              {success
                ? "Your password has been successfully reset"
                : "Enter your new password below"}
            </p>
          </div>

          {success ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 space-y-6 text-center duration-300">
              <div
                className={`mb-4 rounded-lg p-4 text-sm ${successBorder} animate-in fade-in bg-green-500/10 text-green-200 duration-500`}
              >
                <p className="font-medium">
                  Your password has been successfully updated!
                </p>
                <p className="mt-1 text-green-300">
                  Redirecting you to sign in...
                </p>
              </div>

              <Button
                variant="t3-purple"
                onClick={() => (window.location.href = "/signin")}
                className="animate-in fade-in w-full delay-200 duration-500"
              >
                Sign In Now
              </Button>

              {/* Additional Success Info */}
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-purple-300">
                  You can now sign in with your new password.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div
                  className={`mb-6 rounded-lg p-3 text-sm ${errorBorder} animate-in fade-in slide-in-from-top-2 bg-red-500/10 text-red-200 duration-300`}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-in fade-in delay-100 duration-500">
                  <Label className="font-medium text-purple-100">
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
                      startIcon={<Lock className="h-4 w-4 text-purple-300" />}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        !isLoading && setShowPassword(!showPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-purple-300 transition-colors duration-200 hover:text-white disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-purple-300">
                    Password must be at least 8 characters long
                  </p>
                </div>

                <div className="animate-in fade-in delay-200 duration-500">
                  <Label className="font-medium text-purple-100">
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
                      startIcon={<Lock className="h-4 w-4 text-purple-300" />}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        !isLoading &&
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-purple-300 transition-colors duration-200 hover:text-white disabled:opacity-50"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="animate-in fade-in w-full delay-300 duration-500"
                >
                  Reset Password
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-center text-xs text-purple-300">
                  Choose a strong password that you haven't used before
                </p>
              </div>

              {/* Sign In Link */}
              <div className="animate-in fade-in mt-8 border-t border-white/10 pt-6 text-center delay-400 duration-500">
                <p className="text-sm text-purple-200">
                  Remember your password?{" "}
                  <Link
                    href="/signin"
                    className={`${accentText} ${accentHover} font-semibold transition-colors duration-200`}
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
