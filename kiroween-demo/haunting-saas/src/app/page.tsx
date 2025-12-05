import Link from "next/link";
import { redirect } from "next/navigation";
import { LatestPost } from "~/app/_components/post";
import { getSession } from "~/server/better-auth/server";
import { HydrateClient, api } from "~/trpc/server";
import { auth } from "~/server/better-auth/config";
import { headers } from "next/headers";
import SiteHeader from "./_components/common/SiteHeader";
import {
  LogIn,
  UserPlus,
  Shield,
  Zap,
  Users,
  Rocket,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default async function Home() {
  const session = await getSession();
  if (session) void api.post.getLatest.prefetch();
  const hello = await api.post.hello({ text: "from tRPC" });

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

  const stats = [
    { value: "99.9%", label: "Uptime" },
    { value: "Secure", label: "Auth" },
    { value: "Fast", label: "Performance" },
    { value: "24/7", label: "Reliable" },
  ];

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 text-neutral-800 transition-colors duration-300 selection:bg-emerald-500/30 selection:text-white dark:bg-neutral-900 dark:text-neutral-100">
        <SiteHeader />

        <section className="w-full bg-gradient-to-br from-white to-emerald-50/30 py-20 dark:from-neutral-900 dark:to-emerald-950/20">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                <Sparkles className="h-4 w-4" />
                Enterprise Ready Platform
                <ArrowRight className="h-3 w-3" />
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
                Welcome to{" "}
                <span className="bg-gradient-to-br from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                  SkipSetup
                </span>{" "}
                Platform
              </h1>

              <p className="mb-8 text-lg text-neutral-600 sm:text-xl dark:text-neutral-300">
                Build, scale, and manage your applications with enterprise-grade
                tools and infrastructure.
              </p>

              <div className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-white">
                      {stat.value}
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {!session ? (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/signup"
                    className="group relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Get Started Free
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/features"
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-8 py-4 font-semibold text-neutral-700 shadow-lg transition-all hover:border-neutral-300 hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
                  >
                    View Features
                    <Sparkles className="h-5 w-5" />
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link
                    href="/shop"
                    className="group flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    Go to Shop
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-8 py-4 font-semibold text-neutral-700 shadow-lg transition-all hover:border-neutral-300 hover:shadow-xl dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-neutral-600"
                  >
                    View Profile
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full bg-white py-20 dark:bg-neutral-800">
          <div className="container mx-auto px-6">
            <div className="mx-auto mb-16 max-w-4xl text-center">
              <h2 className="mb-4 text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-white">
                Everything You Need to Succeed
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-300">
                Powerful features designed to help you build better applications
                faster.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {feature.description}
                  </p>

                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="w-full py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-4xl">
              {/* Welcome Card */}
              <div className="mb-12 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6">
                  <h2 className="text-2xl font-bold text-white">
                    {session ? "Welcome back!" : "Ready to get started?"}
                  </h2>
                  <p className="text-emerald-100">
                    {hello ? hello.greeting : "Loading tRPC query..."}
                  </p>
                </div>

                <div className="p-8">
                  {!session ? (
                    <div className="space-y-6">
                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <Link
                          href="/signin"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 p-6 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <LogIn className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            Sign In
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            Access your account
                          </p>
                        </Link>

                        <Link
                          href="/signup"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 p-6 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <Rocket className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            Get Started
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            Create new account
                          </p>
                        </Link>

                        <Link
                          href="/features"
                          className="group flex flex-col items-center justify-center rounded-2xl border border-neutral-200 p-6 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                        >
                          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <h3 className="font-semibold text-neutral-900 dark:text-white">
                            Explore
                          </h3>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                            See all features
                          </p>
                        </Link>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">
                          or
                        </span>
                        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-700"></div>
                      </div>

                      {/* Additional Links */}
                      <div className="flex justify-center gap-6">
                        <Link
                          href="/forgot-password"
                          className="text-sm text-neutral-600 underline transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
                        >
                          Forgot Password?
                        </Link>
                        <Link
                          href="/docs"
                          className="text-sm text-neutral-600 underline transition-colors hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400"
                        >
                          Documentation
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* User Info */}
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white">
                          {session.user?.name?.[0]?.toUpperCase() ||
                            session.user?.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {session.user?.name || session.user?.email}
                          </h3>
                          <p className="text-neutral-600 dark:text-neutral-300">
                            {session.user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Link
                          href="/shop"
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <Zap className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">
                              Shop
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                              Order our products
                            </p>
                          </div>
                        </Link>

                        <Link
                          href="/profile"
                          className="flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 transition-all hover:border-emerald-200 hover:bg-emerald-50/50 dark:border-neutral-700 dark:hover:border-emerald-800 dark:hover:bg-emerald-900/20"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-neutral-900 dark:text-white">
                              Profile
                            </h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                              Manage account
                            </p>
                          </div>
                        </Link>
                      </div>

                      {/* Latest Post Section */}
                      <div className="border-t border-neutral-200 pt-6 dark:border-neutral-700">
                        <LatestPost />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full border-t border-neutral-200 bg-white py-12 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white">
                  SkipSetup
                </div>
              </div>

              <div className="flex gap-6 text-sm text-neutral-600 dark:text-neutral-400">
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </HydrateClient>
  );
}
