"use client";

import React, { useState } from "react";
import { authClient } from "../../../server/better-auth/client";
import { ChevronLeft, Eye, EyeOff, Mail, Lock, KeyRound } from "lucide-react";
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

  // T3 Theme Constants
  const accentText = "text-[hsl(280,100%,70%)]";
  const inputStyles =
    "bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-[hsl(280,100%,70%)] focus:ring-[hsl(280,100%,70%)]/20";

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
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] py-12 font-sans sm:px-6 lg:px-8">
      {/* Decorative Glow */}
      <div className="pointer-events-none absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-purple-600/20 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-blue-600/20 blur-[120px]" />

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Back Link */}
        <div className="mb-6 px-4 sm:px-0">
          <Link
            href="/"
            className="group inline-flex items-center text-sm text-purple-200 transition-colors hover:text-white"
          >
            <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
        </div>

        {/* Glass Card */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-8 shadow-2xl backdrop-blur-xl sm:px-10">
          {/* Top Border Accent */}
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-[hsl(280,100%,70%)] to-transparent opacity-70"></div>

          <div className="mb-8 text-center sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              {step === "otp" ? "Verify Code" : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm text-purple-200">
              {step === "otp"
                ? `Enter the code sent to ${formData.email}`
                : "Sign in to access your T3 dashboard"}
            </p>
          </div>

          {step === "otp" ? (
            <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
              {error && (
                <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div>
                <Label className="text-purple-100">Verification Code</Label>
                <Input
                  type="text"
                  name="otp"
                  placeholder="000000"
                  value={otp}
                  onChange={handleOtpChange}
                  maxLength={6}
                  disabled={isLoading}
                  className={`${inputStyles} h-14 text-center font-mono text-2xl tracking-[0.5em]`}
                />
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  variant="t3-purple"
                  size="lg"
                  onClick={verifyOtpAndSignIn}
                  disabled={isLoading || !otp}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Verify & Sign In
                </Button>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <button
                    type="button"
                    onClick={sendSignInOtp}
                    disabled={isSendingOtp}
                    className={`${accentText} transition-colors hover:text-white disabled:opacity-50`}
                  >
                    Resend Code
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="text-purple-300 transition-colors hover:text-white"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              {/* Method Toggle */}
              <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-white/5 bg-black/20 p-1">
                <button
                  type="button"
                  onClick={() => setUseOtp(false)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    !useOtp
                      ? "border border-white/10 bg-white/10 text-white shadow-sm"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
                  Password
                </button>
                <button
                  type="button"
                  onClick={() => setUseOtp(true)}
                  className={`rounded-lg py-2 text-sm font-medium transition-all ${
                    useOtp
                      ? "border border-white/10 bg-white/10 text-white shadow-sm"
                      : "text-purple-300 hover:text-white"
                  }`}
                >
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
                  <Label className="text-purple-100">Email Address</Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isLoading || isSendingOtp}
                    className={inputStyles}
                    startIcon={<Mail className="h-4 w-4" />}
                  />
                </div>

                {!useOtp && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-purple-100">Password</Label>
                      <Link
                        href="/forgot-password"
                        className={`text-xs ${accentText} transition-colors hover:text-white`}
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
                        startIcon={<Lock className="h-4 w-4" />}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          !isLoading && setShowPassword(!showPassword)
                        }
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-purple-300 transition-colors hover:text-white"
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
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
                      className="border-white/30 data-[state=checked]:bg-[hsl(280,100%,70%)]"
                    />
                    <span className="ml-2 text-sm text-purple-200">
                      Remember me
                    </span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="t3-purple"
                  size="lg"
                  disabled={isLoading || isSendingOtp}
                  isLoading={isLoading || isSendingOtp}
                  className="w-full"
                >
                  {useOtp ? "Send Code" : "Sign In"}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="rounded-full border border-white/5 bg-[#1a103c] px-2 text-purple-300">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="opacity-90"
                >
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Google
              </button>

              <div className="mt-6 text-center">
                <p className="text-sm text-purple-200">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className={`${accentText} font-semibold transition-colors hover:text-white`}
                  >
                    Create account
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
