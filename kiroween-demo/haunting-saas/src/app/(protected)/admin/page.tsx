import type { Metadata } from "next";
import { Metrics } from "~/app/_components/dashboard/Metrics";
import React from "react";

import AuthGuard from "~/app/_components/auth/AuthGuard";
import { ProtectedRoute } from "~/app/_components/auth/protected-route";
import { AdminDashboard } from "~/app/_components/dashboard/dashboard";

export const metadata: Metadata = {
  title: "SkipSetup | Admin Dashboard",
  description:
    "SkipSetup admin dashboard for managing products, orders, and analytics",
  keywords: [
    "admin dashboard",
    "ecommerce admin",
    "product management",
    "order tracking",
    "analytics",
  ],
  openGraph: {
    title: "SkipSetup | Admin Dashboard",
    description:
      "Manage your SkipSetup ecommerce platform with advanced analytics and tools",
    url: "https://skipsetup.com",
    siteName: "SkipSetup",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SkipSetup - Admin Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function Ecommerce() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-emerald-50/30 dark:from-neutral-900 dark:via-neutral-800/50 dark:to-emerald-900/10">
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
          <ProtectedRoute permission="readAnalytics">
            <div className="relative">
              <div className="absolute -top-6 right-0 left-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent dark:via-emerald-500/40" />
              <AdminDashboard />
              <div className="absolute right-0 -bottom-6 left-0 h-px bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent dark:via-emerald-600/30" />
            </div>
          </ProtectedRoute>

          <div className="grid grid-cols-12 gap-6">
            <ProtectedRoute permission="readAnalytics">
              <div className="col-span-12 space-y-6 xl:col-span-8 2xl:col-span-9">
                <div className="group relative rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-500 hover:shadow-lg hover:shadow-emerald-100/30 dark:border-neutral-700/60 dark:bg-neutral-900/80 dark:hover:shadow-emerald-900/10">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/3 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                  <div className="relative z-10 p-6 md:p-8">
                    <div className="mb-8 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-2 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-400 shadow-lg shadow-emerald-500/25"></div>
                        <div>
                          <h2 className="bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-neutral-300">
                            Performance Metrics
                          </h2>
                          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                            Real-time business insights and analytics
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-700 dark:bg-emerald-900/30">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          Live Data
                        </span>
                      </div>
                    </div>

                    <div className="relative">
                      <Metrics />
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 h-6 w-6 rounded-tl-2xl border-t-2 border-l-2 border-emerald-300/50 dark:border-emerald-500/30"></div>
                  <div className="absolute top-0 right-0 h-6 w-6 rounded-tr-2xl border-t-2 border-r-2 border-emerald-300/50 dark:border-emerald-500/30"></div>
                  <div className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-2xl border-b-2 border-l-2 border-emerald-300/50 dark:border-emerald-500/30"></div>
                  <div className="absolute right-0 bottom-0 h-6 w-6 rounded-br-2xl border-r-2 border-b-2 border-emerald-300/50 dark:border-emerald-500/30"></div>
                </div>
              </div>
            </ProtectedRoute>

            <ProtectedRoute permission="readAnalytics">
              <div className="col-span-12 space-y-6 xl:col-span-4 2xl:col-span-3">
                <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/80">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-400"></div>
                    <h3 className="font-semibold text-neutral-800 dark:text-white">
                      Quick Stats
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Today's Orders
                      </span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        24
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-b border-neutral-100 py-2 dark:border-neutral-700">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Revenue
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        $2,847
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-neutral-600 dark:text-neutral-400">
                        Conversion
                      </span>
                      <span className="font-semibold text-purple-600 dark:text-purple-400">
                        4.2%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/80">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-green-500 to-green-400"></div>
                    <h3 className="font-semibold text-neutral-800 dark:text-white">
                      System Status
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      "API Gateway",
                      "Database",
                      "Payment Processing",
                      "Email Service",
                    ].map((service, index) => (
                      <div
                        key={service}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          ${service}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            Online
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          </div>

          <ProtectedRoute
            permission="readAnalytics"
            fallback={
              <ProtectedRoute
                permission="readOrders"
                fallback={
                  <div className="group relative rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-500 hover:shadow-lg dark:border-neutral-700/60 dark:bg-neutral-900/80">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                    <div className="relative z-10 p-8 text-center md:p-12">
                      <div className="mx-auto max-w-md">
                        <div className="relative mb-8">
                          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl border border-amber-200/50 bg-gradient-to-br from-amber-100 to-amber-50 shadow-inner dark:border-amber-700/30 dark:from-amber-900/20 dark:to-amber-800/10">
                            <svg
                              className="h-12 w-12 text-amber-600 dark:text-amber-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                          <div className="absolute inset-0 -z-10 animate-pulse rounded-3xl bg-amber-200/30 blur-xl dark:bg-amber-600/20"></div>
                        </div>

                        <div className="space-y-6">
                          <h3 className="bg-gradient-to-r from-amber-600 to-amber-700 bg-clip-text text-3xl font-bold text-transparent dark:from-amber-400 dark:to-amber-300">
                            Access Limited
                          </h3>
                          <p className="text-lg leading-relaxed text-neutral-600 dark:text-neutral-400">
                            You don't have permission to view the dashboard
                            analytics. Please contact an administrator to
                            request access.
                          </p>
                          <div className="rounded-xl border border-neutral-200/50 bg-neutral-50 px-6 py-4 text-sm text-neutral-500 dark:border-neutral-700/50 dark:bg-neutral-800/50 dark:text-neutral-500">
                            Your current role may not include dashboard viewing
                            permissions.
                          </div>
                        </div>

                        <div className="mt-8">
                          <button className="group transform rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:scale-105 hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/40">
                            <span className="flex items-center gap-2">
                              Contact Administrator
                              <svg
                                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                                />
                              </svg>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-2 border-l-2 border-amber-300/50 dark:border-amber-500/30"></div>
                    <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-2xl border-r-2 border-b-2 border-amber-300/50 dark:border-amber-500/30"></div>
                  </div>
                }
              >
                <div></div>
              </ProtectedRoute>
            }
          >
            <div></div>
          </ProtectedRoute>
        </div>

        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-emerald-200/10 blur-3xl dark:bg-emerald-600/5" />
          <div className="absolute -bottom-1/4 -left-1/4 h-1/3 w-1/3 animate-pulse rounded-full bg-amber-200/10 blur-3xl delay-1000 dark:bg-amber-600/5" />
          <div className="absolute top-1/2 -left-1/4 h-1/4 w-1/4 animate-pulse rounded-full bg-blue-200/5 blur-3xl delay-500 dark:bg-blue-600/3" />
        </div>
      </div>
    </AuthGuard>
  );
}
