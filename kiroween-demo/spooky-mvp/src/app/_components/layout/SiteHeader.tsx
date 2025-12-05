"use client";

import Link from "next/link";
import { authClient } from "~/server/better-auth/client";
import UserDropdownProfile from "../auth/UserDropdownProfile";

export default function SiteHeader() {
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b border-white/10 bg-gradient-to-r from-[#2e026d] to-[#15162c] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-white">
              SkipSetup
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-purple-200 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="text-purple-200 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/blog"
                className="text-purple-200 hover:text-white transition-colors"
              >
                Blog
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user ? (
              <UserDropdownProfile />
            ) : (
              <div className="flex space-x-3">
                <Link
                  href="/signin"
                  className="text-purple-200 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-[hsl(280,100%,70%)] px-4 py-2 text-sm font-medium text-[#2e026d] hover:bg-[hsl(280,100%,75%)] transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
