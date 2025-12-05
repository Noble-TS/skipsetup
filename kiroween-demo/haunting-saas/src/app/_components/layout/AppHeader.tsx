"use client";

import React, { useState, useEffect, useRef } from "react";
import { ThemeToggleButton } from "~/app/_components/common/ThemeToggleButton";
import NotificationDropdown from "~/app/_components/header/NotificationDropdown";
import UserDropdown from "~/app/_components/header/UserDropdown";
import { useSidebar } from "../context/SidebarContext";
import Image from "next/image";
import Link from "next/link";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-100 bg-white shadow-sm transition-colors dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-2 border-b border-neutral-100 px-4 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-neutral-800">
          <button
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 text-emerald-600 transition-all hover:bg-emerald-50 lg:h-11 lg:w-11 dark:border-neutral-700 dark:text-emerald-300 dark:hover:bg-neutral-800"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                viewBox="0 0 24 24"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <Link href="/" className="lg:hidden">
            <Image
              width={154}
              height={32}
              src="/images/logo/logo.svg"
              alt="Logo"
              className="dark:hidden"
            />
            <Image
              width={154}
              height={32}
              src="/images/logo/logo-dark.svg"
              alt="Logo"
              className="hidden dark:block"
            />
          </Link>

          {/* Mobile Application Menu */}
          <button
            onClick={toggleApplicationMenu}
            aria-label="Toggle Menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-600 transition-all hover:bg-neutral-100 lg:hidden dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <svg
              width="24"
              height="24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          <div className="hidden lg:block">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="fill-neutral-400 dark:fill-neutral-500"
                  >
                    <path d="M3.04 9.37a6.33 6.33 0 1 1 6.33 6.33A6.33 6.33 0 0 1 3.04 9.37Zm11.32 6.04 2.82 2.82..." />
                  </svg>
                </span>

                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search or type command..."
                  className="h-11 rounded-xl border border-neutral-200 bg-neutral-50 py-2.5 pr-14 pl-12 text-sm text-neutral-800 transition-all placeholder:text-neutral-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 focus:outline-none xl:w-[430px] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500"
                />

                <button
                  type="button"
                  className="absolute top-1/2 right-2.5 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-neutral-300 bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-500 transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                >
                  ⌘ K
                </button>
              </div>
            </form>
          </div>
        </div>

        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } w-full items-center justify-between gap-4 bg-white px-5 py-4 shadow-md transition-colors lg:flex lg:justify-end lg:px-6 lg:py-4 lg:shadow-none dark:bg-neutral-900`}
        >
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
