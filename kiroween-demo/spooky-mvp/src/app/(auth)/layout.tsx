"use client";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <div className="relative z-10 flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">{children}</div>
        </div>

        <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-black/20 p-12 lg:flex">
          <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[hsl(280,100%,70%)]/20 blur-[100px]" />

          <div className="relative z-10 flex max-w-lg flex-col items-center justify-center space-y-8 text-center">
            <Link href="/" className="group">
              <h1 className="text-6xl font-extrabold tracking-tight">
                <span className="text-[hsl(280,100%,70%)] transition-all group-hover:brightness-110">
                  T3
                </span>{" "}
                Auth
              </h1>
            </Link>

            <p className="text-2xl font-light text-purple-200">
              The best way to start your full-stack, typesafe application.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              {["Next.js", "Better-Auth", "Tailwind", "tRPC"].map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-purple-100 shadow-lg backdrop-blur-sm"
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
