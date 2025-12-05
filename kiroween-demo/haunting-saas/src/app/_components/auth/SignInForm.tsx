"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  CheckCircle,
  LogIn,
  Shield,
  Sparkles,
  Zap,
  Users,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import Checkbox from "../form/input/Checkbox";

export default function SignInForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "otp">("email");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [useOtp, setUseOtp] = useState(false);

  const inputStyles =
    "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    if (error) setError(null);
  };

  const resetForm = () => {
    setStep("email");
    setOtp("");
    setUseOtp(false);
    setError(null);
  };

  // Send OTP
  const sendSignInOtp = async () => {
    if (!formData.email) {
      setError("Please enter your email address");
      return;
    }
    setIsSendingOtp(true);
    setError(null);
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: formData.email,
        type: "sign-in",
      });
      if (error) setError(error.message);
      if (data) setStep("otp");
    } catch {
      setError("Failed to send verification code");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const verifyOtpAndSignIn = async () => {
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email: formData.email,
        otp,
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await handleSuccessfulSignIn();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login
  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.email({
        email: formData.email,
        password: formData.password,
        rememberMe: isChecked,
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        await handleSuccessfulSignIn();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessfulSignIn = async () => {
    try {
      const { data: userSession } = await authClient.getSession();
      let targetRoute = "/";

      // Basic Role Routing
      if (userSession?.user?.role) {
        if (userSession.user.role.includes("admin")) targetRoute = "/admin";
      }

      window.location.href = targetRoute;
    } catch (error) {
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full">
      {/* Back Link */}
      <div className="mb-8">
        <Link
          href="/"
          className="group inline-flex items-center text-sm font-medium text-neutral-600 transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
        >
          <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </div>

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white px-6 py-8 shadow-2xl sm:px-8 dark:border-neutral-700 dark:bg-neutral-800">
        {/* Top Border Accent */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {step === "otp" ? "Verify Identity" : "Welcome Back"}
          </h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            {step === "otp"
              ? `Enter the code sent to ${formData.email}`
              : "Sign in to access your dashboard"}
          </p>
        </div>

        {step === "otp" ? (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
            {error && (
              <div className="rounded-xl border-l-4 border-red-400 bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  {error}
                </div>
              </div>
            )}

            <div>
              <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                Verification Code
              </Label>
              <Input
                type="text"
                name="otp"
                placeholder="000000"
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                disabled={isLoading}
                className={`${inputStyles} h-14 text-center font-mono text-2xl tracking-[0.5em]`}
                startIcon={<KeyRound className="h-5 w-5 text-neutral-400" />}
              />
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="emerald"
                size="lg"
                onClick={verifyOtpAndSignIn}
                disabled={isLoading || !otp}
                isLoading={isLoading}
                className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verify & Continue
                  </span>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={sendSignInOtp}
                  disabled={isSendingOtp}
                  className="text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  {isSendingOtp ? "Sending..." : "Resend Code"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isLoading}
                  className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                >
                  Change Email
                </button>
              </div>
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

            {/* Method Toggle */}
            <div className="mb-6 flex gap-3 rounded-xl bg-neutral-100 p-1 dark:bg-neutral-700">
              <button
                type="button"
                onClick={() => setUseOtp(false)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all duration-300 ${
                  !useOtp
                    ? "border border-neutral-200 bg-white text-neutral-900 shadow-lg dark:border-neutral-500 dark:bg-neutral-600 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                <Lock className="h-4 w-4" />
                Password
              </button>
              <button
                type="button"
                onClick={() => setUseOtp(true)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 transition-all duration-300 ${
                  useOtp
                    ? "border border-neutral-200 bg-white text-neutral-900 shadow-lg dark:border-neutral-500 dark:bg-neutral-600 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                <KeyRound className="h-4 w-4" />
                Email Code
              </button>
            </div>

            <form
              onSubmit={
                useOtp
                  ? (e) => {
                      e.preventDefault();
                      sendSignInOtp();
                    }
                  : handleEmailPasswordSignIn
              }
              className="space-y-6"
            >
              <div>
                <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                  Email Address
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading || isSendingOtp}
                  className={inputStyles}
                  startIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                />
              </div>

              {!useOtp && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                      Password
                    </Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className={`${inputStyles} pr-10`}
                      startIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        !isLoading && setShowPassword(!showPassword)
                      }
                      className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Remember Me */}
              {!useOtp && (
                <div className="flex items-center">
                  <Checkbox
                    checked={isChecked}
                    onChange={setIsChecked}
                    disabled={isLoading}
                    className="border-neutral-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 dark:border-neutral-600"
                  />
                  <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
                    Remember me
                  </span>
                </div>
              )}

              <Button
                type="submit"
                variant="emerald"
                size="lg"
                disabled={isLoading || isSendingOtp}
                isLoading={isLoading || isSendingOtp}
                className="w-full rounded-xl transition-all duration-300 hover:shadow-xl"
              >
                {useOtp ? (
                  isSendingOtp ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Sending Code...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="h-5 w-5" />
                      Send Verification Code
                    </span>
                  )
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    Sign In to Dashboard
                  </span>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative mt-8 mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="rounded-full border border-neutral-200 bg-white px-3 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Social Login */}
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-sm font-medium text-neutral-700 transition-all hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Don't have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                >
                  Create account
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
