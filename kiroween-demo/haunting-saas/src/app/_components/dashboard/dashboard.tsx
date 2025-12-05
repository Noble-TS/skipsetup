"use client";
import { usePermissions } from "~/server/better-auth/use-permissions";
import { ProtectedRoute } from "../auth/protected-route";
import Link from "next/link";

export function AdminDashboard() {
  const { userRole, isAdmin, isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/80">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-8 w-2 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-400"></div>
              <div>
                <h2 className="bg-gradient-to-r from-neutral-800 to-neutral-600 bg-clip-text text-2xl font-bold text-transparent dark:from-white dark:to-neutral-300">
                  Admin Dashboard
                </h2>
                <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                  Logged in as:{" "}
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {userRole}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 dark:border-emerald-700 dark:bg-emerald-900/30">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                System Active
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ProtectedRoute permission="manageProducts">
              <Link
                href="/admin/products"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-emerald-500 dark:hover:shadow-emerald-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 transition-transform duration-300 group-hover:scale-110 dark:from-emerald-900/30 dark:to-emerald-800/20">
                    <svg
                      className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    Products
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Manage gift catalog and inventory
                  </p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="manageOrders">
              <Link
                href="/admin/orders"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-blue-500 dark:hover:shadow-blue-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 transition-transform duration-300 group-hover:scale-110 dark:from-blue-900/30 dark:to-blue-800/20">
                    <svg
                      className="h-5 w-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    Orders
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    View and manage customer orders
                  </p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readTransactions">
              <Link
                href="/stripe/transactions"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-purple-500 dark:hover:shadow-purple-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 transition-transform duration-300 group-hover:scale-110 dark:from-purple-900/30 dark:to-purple-800/20">
                    <svg
                      className="h-5 w-5 text-purple-600 dark:text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    Transactions
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    View payment transactions and refunds
                  </p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readCustomers">
              <Link
                href="/admin/customers"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-amber-500 dark:hover:shadow-amber-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 transition-transform duration-300 group-hover:scale-110 dark:from-amber-900/30 dark:to-amber-800/20">
                    <svg
                      className="h-5 w-5 text-amber-600 dark:text-amber-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    Customers
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Manage customer accounts
                  </p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="readAnalytics">
              <Link
                href="/admin/analytics"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-cyan-500 dark:hover:shadow-cyan-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-100 to-cyan-50 transition-transform duration-300 group-hover:scale-110 dark:from-cyan-900/30 dark:to-cyan-800/20">
                    <svg
                      className="h-5 w-5 text-cyan-600 dark:text-cyan-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    Analytics
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    View business insights and reports
                  </p>
                </div>
              </Link>
            </ProtectedRoute>

            <ProtectedRoute permission="banCustomer">
              <Link
                href="/admin/users"
                className="group relative transform rounded-xl border border-neutral-200/60 bg-gradient-to-br from-white to-gray-50 p-5 transition-all duration-300 hover:scale-105 hover:border-red-300 hover:shadow-lg hover:shadow-red-100/50 dark:border-neutral-700/60 dark:from-neutral-800 dark:to-neutral-700 dark:hover:border-red-500 dark:hover:shadow-red-900/20"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div className="relative z-10">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-100 to-red-50 transition-transform duration-300 group-hover:scale-110 dark:from-red-900/30 dark:to-red-800/20">
                    <svg
                      className="h-5 w-5 text-red-600 dark:text-red-400"
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
                  <h3 className="mb-2 text-lg font-semibold text-neutral-800 dark:text-white">
                    User Management
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Manage user roles and permissions
                  </p>
                </div>
              </Link>
            </ProtectedRoute>
          </div>
        </div>

        <div className="absolute top-0 left-0 h-8 w-8 rounded-tl-2xl border-t-2 border-l-2 border-emerald-200/50 dark:border-emerald-700/30"></div>
        <div className="absolute right-0 bottom-0 h-8 w-8 rounded-br-2xl border-r-2 border-b-2 border-emerald-200/50 dark:border-emerald-700/30"></div>
      </div>

      <ProtectedRoute permission="readAnalytics">
        <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/80">
          <div className="p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-gradient-to-b from-cyan-500 to-cyan-400"></div>
              <h3 className="text-xl font-semibold text-neutral-800 dark:text-white">
                Quick Stats
              </h3>
            </div>
            <div className="py-8 text-center">
              <p className="text-neutral-500 dark:text-neutral-400">
                Analytics metrics will appear here
              </p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    </div>
  );
}
