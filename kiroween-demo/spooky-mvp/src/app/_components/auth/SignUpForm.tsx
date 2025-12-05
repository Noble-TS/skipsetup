"use client";
import Checkbox from "../form/input/Checkbox";
import Input from "../form/input/InputField";
import Label from "../form/label/Label";
import Button from "../ui/button/Button";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
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

  const accentColor = "text-[hsl(280,100%,70%)]";
  const accentBorder = "focus:border-[hsl(280,100%,70%)]";

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
          className="group inline-flex items-center text-sm text-purple-200 transition-colors hover:text-white"
        >
          <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </Link>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-white">
            {step === "form" ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-purple-200">
            {step === "form"
              ? "Join the T3 community today"
              : `Code sent to ${formData.email}`}
          </p>
        </div>

        {step === "form" ? (
          <>
            {/* Google Button - Glassy Style */}
            <button className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition-all hover:bg-white/10">
              {/* Google SVG (White/Monochrome or Colored) */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                className="opacity-90"
              >
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              Continue with Google
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#231544] bg-transparent px-2 text-purple-200">
                  Or continue with
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleEmailPasswordSignUp} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-purple-100">
                    First Name
                  </Label>
                  <Input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(280,100%,70%)]/50 ${accentBorder}`}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-purple-100">
                    Last Name
                  </Label>
                  <Input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(280,100%,70%)]/50 ${accentBorder}`}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-purple-100">
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full rounded-lg border-white/10 bg-black/20 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(280,100%,70%)]/50 ${accentBorder}`}
                  placeholder="name@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-medium text-purple-100">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full rounded-lg border-white/10 bg-black/20 pr-10 text-white placeholder:text-white/30 focus:ring-2 focus:ring-[hsl(280,100%,70%)]/50 ${accentBorder}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-purple-200 transition-colors hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={isChecked}
                  onChange={setIsChecked}
                  className="mt-1 border-white/30 data-[state=checked]:bg-[hsl(280,100%,70%)]"
                />
                <span className="text-sm text-purple-200">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className={`${accentColor} hover:underline`}
                  >
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className={`${accentColor} hover:underline`}
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </div>

              <Button
                disabled={isLoading}
                className="w-full rounded-xl bg-[hsl(280,100%,70%)] py-3 font-bold text-[#2e026d] shadow-lg shadow-purple-900/20 transition-all hover:bg-[hsl(280,100%,60%)]"
              >
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </form>
          </>
        ) : (
          /* OTP STEP (Dark Mode) */
          <div className="space-y-6">
            <div>
              <Label className="text-purple-100">Verification Code</Label>
              <Input
                value={otp}
                onChange={handleOtpChange}
                maxLength={6}
                className="w-full rounded-xl border-white/10 bg-black/20 py-4 text-center font-mono text-3xl tracking-[1em] text-white focus:border-[hsl(280,100%,70%)] focus:ring-0"
                placeholder="000000"
              />
            </div>

            <Button
              onClick={verifyEmail}
              disabled={isLoading || !otp}
              className="w-full rounded-xl bg-[hsl(280,100%,70%)] py-3 font-bold text-[#2e026d] hover:bg-[hsl(280,100%,60%)]"
            >
              {isLoading ? "Verifying..." : "Verify & Login"}
            </Button>

            <button
              onClick={() => setStep("form")}
              className="w-full text-sm text-purple-200 hover:text-white"
            >
              Change Email
            </button>
          </div>
        )}

        <div className="mt-8 border-t border-white/10 pt-6 text-center">
          <p className="text-purple-200">
            Already have an account?{" "}
            <Link
              href="/signin"
              className={`${accentColor} font-semibold hover:underline`}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
