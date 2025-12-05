"use client";

import { useSidebar } from "../context/SidebarContext";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";
import Backdrop from "./Backdrop";
import React from "react";

export default function AdminLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin =
    isExpanded || isHovered ? "lg:ml-[320px]" : "lg:ml-[90px]";

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-emerald-50/30 transition-all duration-500 dark:from-neutral-900 dark:via-neutral-800/50 dark:to-emerald-900/10">
      <Backdrop />

      <div className="relative z-40">
        <AppSidebar />
      </div>
      <div
        className={`min-h-screen transition-all duration-500 ease-out ${mainContentMargin}`}
      >
        <div className="sticky top-0 z-30">
          <AppHeader />
        </div>

        <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
          <div className="relative">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative">
              <div className="relative rounded-2xl border border-neutral-200/60 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md dark:border-neutral-700/60 dark:bg-neutral-900/80">
                {children}
              </div>

              <div className="absolute right-0 -bottom-4 left-0 h-px bg-gradient-to-r from-transparent via-emerald-200/30 to-transparent dark:via-emerald-700/20" />
            </div>
          </div>
        </div>

        <footer className="mt-16 border-t border-neutral-200/40 dark:border-neutral-700/40">
          <div className="mx-auto max-w-7xl p-6">
            <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-4">
                <span>© 2024 All Rights Reserved</span>
                <div className="h-1 w-1 rounded-full bg-neutral-300 dark:bg-neutral-600" />
                <span>Admin Panel</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-emerald-200/10 blur-3xl dark:bg-emerald-600/5" />
        <div className="absolute -bottom-1/4 -left-1/4 h-1/3 w-1/3 animate-pulse rounded-full bg-blue-200/10 blur-3xl delay-1000 dark:bg-blue-600/5" />
      </div>
    </div>
  );
}
