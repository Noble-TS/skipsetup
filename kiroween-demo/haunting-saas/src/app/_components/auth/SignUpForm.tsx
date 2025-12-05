"use client";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import {
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Shield,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Emerald Theme Constants
  const inputStyles =
    "bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-500 dark:placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-emerald-500/20 shadow-sm";

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
    if (error) setError(null);
  };

  const sendVerificationOtp = async () => {
    if (!formData.email) return setError("Please enter your email address");
    setIsSendingOtp(true);
    setError(null);
    try {
      const { data, error } = await authClient.emailOtp.sendVerificationOtp({
        email: formData.email,
        type: "sign-in",
      });
      if (error) {
        setError(error.message);
        return;
      }
      if (data) setStep("otp");
    } catch (err) {
      setError("Failed to send verification code");
      console.error(err);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) return setError("Please agree to the Terms");
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    )
      return setError("All fields are required");

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await authClient.signUp.email({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        callbackURL: "/signin",
      });

      if (error) {
        if (error.code === "USER_ALREADY_EXISTS")
          setError("Account already exists.");
        else if (error.message?.includes("email verification"))
          await sendVerificationOtp();
        else setError(error.message || "Registration failed.");
        return;
      }

      if (data && !data.user.emailVerified) await sendVerificationOtp();
      else window.location.href = "/signin";
    } catch (err: any) {
      setError(err?.message || "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async () => {
    if (!otp) return setError("Enter the code");
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.signIn.emailOtp({
        email: formData.email,
        otp,
      });
      if (error) return setError(error.message);
      if (data) window.location.href = "/signin";
    } catch (err) {
      setError("Error during verification");
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {step === "form" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            {step === "form"
              ? "Join the platform today"
              : `Code sent to ${formData.email}`}
          </p>
        </div>

        {step === "form" ? (
          <>
            {/* Social Sign In */}
            <button className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 py-3 font-medium text-neutral-700 transition-all hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600">
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

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="rounded-full border border-neutral-200 bg-white px-3 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  Or continue with email
                </span>
              </div>
            </div>

            {error && (
              <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-xl border-l-4 border-red-400 bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleEmailPasswordSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                    First Name
                  </Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder="John"
                    startIcon={<User className="h-5 w-5 text-neutral-400" />}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                    Last Name
                  </Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={inputStyles}
                    placeholder="Doe"
                    startIcon={<User className="h-5 w-5 text-neutral-400" />}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputStyles}
                  placeholder="name@example.com"
                  startIcon={<Mail className="h-5 w-5 text-neutral-400" />}
                />
              </div>

              <div className="space-y-1">
                <Label className="font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${inputStyles} pr-10`}
                    placeholder="••••••••"
                    startIcon={<Lock className="h-5 w-5 text-neutral-400" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-500 transition-colors hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isChecked}
                  onChange={setIsChecked}
                  className="mt-1 border-neutral-300 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 dark:border-neutral-600"
                />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-emerald-600 underline transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-emerald-600 underline transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
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
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Create Account
                  </span>
                )}
              </Button>
            </form>
          </>
        ) : (
          /* OTP STEP */
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
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                disabled={isLoading}
                className={`${inputStyles} h-14 text-center font-mono text-2xl tracking-[0.5em]`}
                placeholder="000000"
                startIcon={<Mail className="h-5 w-5 text-neutral-400" />}
              />
              <p className="mt-2 text-center text-sm text-neutral-500 dark:text-neutral-400">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={verifyEmail}
                variant="emerald"
                size="lg"
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

              <button
                onClick={() => setStep("form")}
                disabled={isLoading}
                className="w-full text-sm text-neutral-600 transition-colors hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-white"
              >
                Change Email
              </button>
            </div>
          </div>
        )}

        {/* Sign In Link */}
        <div className="mt-8 border-t border-neutral-200 pt-6 text-center dark:border-neutral-700">
          <p className="text-neutral-600 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
