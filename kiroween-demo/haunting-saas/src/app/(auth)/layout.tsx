"use client";
import Link from "next/link";
import React from "react";
import {
  Shield,
  Zap,
  Users,
  Rocket,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Authentication",
      description: "Enterprise-grade security with advanced encryption",
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Blazing Fast",
      description: "Optimized performance with real-time capabilities",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Team Ready",
      description: "Collaborate seamlessly with your team members",
    },
    {
      icon: <Rocket className="h-5 w-5" />,
      title: "Scalable",
      description: "Grows with your application needs",
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-br from-neutral-50 to-emerald-50/30 font-sans text-neutral-800 dark:from-neutral-900 dark:to-emerald-950/20 dark:text-neutral-100">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        {/* Left Side: Form Container */}
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right Side: Branding Panel (Hidden on mobile) */}
        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 p-12 lg:flex">
          {/* Decorative Elements */}
          <div className="absolute top-1/4 -right-12 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute bottom-1/4 -left-12 h-32 w-32 rounded-full bg-white/5 blur-2xl"></div>

          <div className="relative z-10 flex max-w-lg flex-col items-center justify-center space-y-8 text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Enterprise Ready Platform
              <ArrowRight className="h-3 w-3" />
            </div>

            {/* Main Branding */}
            <div className="space-y-4">
              <div className="mb-4 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-lg backdrop-blur-sm">
                  <div className="text-xl font-bold text-white">SS</div>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                  SkipSetup
                </span>
              </h1>
              <p className="text-xl font-light text-emerald-100">
                Build, scale, and manage your applications with enterprise-grade
                tools.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="mt-8 grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/15 hover:shadow-lg"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
                      {feature.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-white">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-xs leading-relaxed text-emerald-100">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-6">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "Secure", label: "Auth" },
                { value: "Fast", label: "Performance" },
                { value: "24/7", label: "Reliable" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-emerald-100">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tech Stack */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[
                "Next.js",
                "TypeScript",
                "Tailwind",
                "tRPC",
                "Prisma",
                "Auth",
              ].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100 backdrop-blur-sm"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
