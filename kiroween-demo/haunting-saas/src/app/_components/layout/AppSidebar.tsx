"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid3X3,
  ChevronDown,
  MoreHorizontal,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Wallet,
  TrendingUp,
  FileText,
  Shield,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
const mainNav = [
  {
    name: "Dashboard",
    icon: <Grid3X3 className="h-4 w-4" />,
    path: "/admin",
  },
  {
    name: "User Management",
    icon: <Users className="h-4 w-4" />,
    subItems: [
      { name: "All Users", path: "/admin/users", available: true },
      { name: "User Roles", path: "/admin/user-roles", available: false },
      { name: "Permissions", path: "/admin/permissions", available: false },
    ],
  },
  {
    name: "Transactions",
    icon: <CreditCard className="h-4 w-4" />,
    subItems: [
      {
        name: "All Transactions",
        path: "/admin/transactions",
        available: true,
      },
      {
        name: "Pending Transactions",
        path: "/admin/transactions/pending",
        available: false,
      },
      {
        name: "Failed Transactions",
        path: "/admin/transactions/failed",
        available: false,
      },
      {
        name: "Refund Requests",
        path: "/admin/transactions/refunds",
        available: false,
      },
      {
        name: "Transaction Analytics",
        path: "/admin/transactions/analytics",
        available: false,
      },
    ],
  },
  {
    name: "Financial Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    subItems: [
      { name: "Daily Reports", path: "/admin/reports/daily", available: false },
      {
        name: "Monthly Reports",
        path: "/admin/reports/monthly",
        available: false,
      },
      {
        name: "Revenue Analysis",
        path: "/admin/reports/revenue",
        available: false,
      },
      { name: "Tax Reports", path: "/admin/reports/tax", available: false },
    ],
  },
];

const systemNav = [
  {
    name: "System",
    icon: <Settings className="h-4 w-4" />,
    subItems: [
      {
        name: "General Settings",
        path: "/admin/settings/general",
        available: false,
      },
      {
        name: "Payment Gateway",
        path: "/admin/settings/payment",
        available: false,
      },
      {
        name: "API Configuration",
        path: "/admin/settings/api",
        available: false,
      },
    ],
  },
  {
    name: "Security",
    icon: <Shield className="h-4 w-4" />,
    subItems: [
      { name: "Audit Logs", path: "/admin/security/audit", available: false },
      {
        name: "Access Control",
        path: "/admin/security/access",
        available: false,
      },
    ],
  },
];

const toolsNav = [
  {
    name: "Analytics",
    icon: <TrendingUp className="h-4 w-4" />,
    subItems: [
      {
        name: "Sales Dashboard",
        path: "/admin/analytics/sales",
        available: false,
      },
      {
        name: "User Analytics",
        path: "/admin/analytics/users",
        available: false,
      },
    ],
  },
  {
    name: "Documentation",
    icon: <FileText className="h-4 w-4" />,
    subItems: [
      { name: "API Docs", path: "/admin/docs/api", available: false },
      { name: "User Guide", path: "/admin/docs/guide", available: false },
    ],
  },
];

const AppSidebar = () => {
  // Use the REAL sidebar context - this is the key fix!
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();
  const pathname = usePathname();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "system" | "tools";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const showFullContent = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      closeMobileSidebar();
    }
  }, [pathname, closeMobileSidebar]);

  useEffect(() => {
    let submenuMatched = false;

    ["main", "system", "tools"].forEach((menuType) => {
      const items =
        menuType === "main"
          ? mainNav
          : menuType === "system"
            ? systemNav
            : toolsNav;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "system" | "tools",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive]);

  // Height calculation
  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "system" | "tools",
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderItems = (items: any[], menuType: "main" | "system" | "tools") => (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => {
        const isOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const hasActiveChild = item.subItems?.some((sub: any) =>
          isActive(sub.path),
        );

        return (
          <li key={item.name}>
            {item.subItems ? (
              <button
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2.5 transition-all duration-300 dark:border-neutral-700 ${
                  isOpen || hasActiveChild
                    ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800 shadow-sm dark:border-emerald-600 dark:bg-neutral-800 dark:text-emerald-300"
                    : "text-neutral-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-emerald-400"
                } ${!showFullContent ? "lg:justify-center" : ""}`}
              >
                <span
                  className={`transition-colors duration-300 ${
                    isOpen || hasActiveChild
                      ? "text-emerald-700"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {item.icon}
                </span>
                {showFullContent && (
                  <span className="flex items-center gap-2 text-sm">
                    {item.name}
                  </span>
                )}
                {showFullContent && (
                  <ChevronDown
                    className={`ml-auto h-4 w-4 transition-all duration-300 ${
                      isOpen
                        ? "rotate-180 text-emerald-700"
                        : "text-neutral-400"
                    }`}
                  />
                )}
              </button>
            ) : (
              <Link
                href={item.path}
                className={`flex w-full items-center gap-3 rounded-xl border border-neutral-200 px-4 py-2.5 transition-all duration-300 dark:border-neutral-700 ${
                  isActive(item.path)
                    ? "border-emerald-300 bg-emerald-50 font-semibold text-emerald-800 shadow-sm dark:border-emerald-600 dark:bg-neutral-800 dark:text-emerald-300"
                    : "text-neutral-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-emerald-400"
                } ${!showFullContent ? "lg:justify-center" : ""}`}
              >
                <span
                  className={`transition-colors duration-300 ${
                    isActive(item.path)
                      ? "text-emerald-700"
                      : "text-neutral-500 dark:text-neutral-400"
                  }`}
                >
                  {item.icon}
                </span>
                {showFullContent && (
                  <span className="text-sm">{item.name}</span>
                )}
              </Link>
            )}

            {item.subItems && showFullContent && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-500 ease-out"
                style={{
                  height: isOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
                }}
              >
                <ul className="mt-2 ml-6 space-y-1">
                  {item.subItems.map((sub: any) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.available ? sub.path : "#"}
                        className={`group flex items-center justify-between rounded-lg border px-4 py-2 text-sm transition-all ${
                          isActive(sub.path)
                            ? "border-emerald-300 bg-emerald-100 font-medium text-emerald-700 dark:border-neutral-600 dark:bg-neutral-700 dark:text-emerald-200"
                            : sub.available
                              ? "border-transparent text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-emerald-300"
                              : "cursor-not-allowed border-transparent text-neutral-400 opacity-50 dark:text-neutral-600"
                        }`}
                      >
                        <span>{sub.name}</span>
                        {!sub.available && (
                          <span className="rounded bg-neutral-200 px-2 py-1 text-xs text-neutral-500 dark:bg-neutral-700">
                            Soon
                          </span>
                        )}
                        {sub.available && isActive(sub.path) && (
                          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  const renderSection = (
    title: string,
    items: any[],
    section: "main" | "system" | "tools",
  ) => (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-neutral-600 uppercase dark:text-neutral-400">
        {showFullContent ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-current opacity-60"></div>
            {title}
          </span>
        ) : (
          <MoreHorizontal className="h-4 w-4" />
        )}
      </h3>
      {renderItems(items, section)}
    </div>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen border-r border-neutral-200 bg-white/90 backdrop-blur-xl transition-all duration-500 dark:border-neutral-800 dark:bg-neutral-900/90 ${showFullContent ? "w-[320px]" : "w-[90px]"} shadow-[4px_0_20px_-5px_rgba(0,0,0,0.06)]`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo Section */}
      <div className="border-b border-neutral-200 p-6 dark:border-neutral-800">
        {showFullContent ? (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold text-neutral-800 dark:text-white">
                Admin Panel
              </div>
              <div className="text-xs text-neutral-500">Dashboard</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Wallet className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Content */}
      <nav className="scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 h-[calc(100vh-120px)] space-y-8 overflow-y-auto p-4">
        {renderSection("Main Menu", mainNav, "main")}
        {renderSection("System", systemNav, "system")}
        {renderSection("Tools", toolsNav, "tools")}

        {/* Quick Stats - Only show when expanded */}
        {showFullContent && (
          <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800">
            <div className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Quick Stats
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Today's Transactions</span>
                <span className="font-medium text-emerald-600">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pending</span>
                <span className="font-medium text-amber-600">5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Revenue</span>
                <span className="font-medium text-emerald-600">$2,847</span>
              </div>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default AppSidebar;
