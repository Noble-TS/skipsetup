"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowDown,
  ArrowUp,
  Package,
  Users,
  DollarSign,
  Activity,
  Zap,
} from "lucide-react";

const premiumColors = {
  primary: "#10b981",
  secondary: "#8b5cf6",
  tertiary: "#0ea5e9",
  background: "rgba(255, 255, 255, 0.8)",
  darkBackground: "rgba(16, 24, 39, 0.8)",
  textPrimary: "#1f2937",
  textSecondary: "#6b7280",
  textDark: "#f9fafb",
  success: "#10b981",
  error: "#ef4444",
  warning: "#f59e0b",
  borderLight: "rgba(229, 231, 235, 0.6)",
  borderDark: "rgba(75, 85, 99, 0.6)",
};

interface MetricsData {
  users: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  orders: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  revenue: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
  transactions: {
    total: number;
    growth: number;
    currentMonth: number;
    previousMonth: number;
  };
}

const Badge = ({
  children,
  color = "success",
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  color?: "success" | "error" | "warning";
  className?: string;
  style?: React.CSSProperties;
}) => {
  const colorMap = {
    success:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    error: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
    warning:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${colorMap[color]} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

const TransactionIcon = ({ className = "size-6" }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
    />
  </svg>
);

// Mock Data for demonstration
const MOCK_METRICS_DATA: MetricsData = {
  users: { total: 4520, growth: 12.5, currentMonth: 452, previousMonth: 400 },
  orders: {
    total: 12000,
    growth: -3.2,
    currentMonth: 980,
    previousMonth: 1012,
  },
  revenue: {
    total: 25890000,
    growth: 8.9,
    currentMonth: 2100000,
    previousMonth: 1928000,
  },
  transactions: {
    total: 18450,
    growth: 15.1,
    currentMonth: 1540,
    previousMonth: 1338,
  },
};

export const Metrics = () => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock API call with delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      // In real app: const response = await fetch('/api/admin/metrics');
      const data = MOCK_METRICS_DATA;

      setMetrics(data);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to load metrics. Using mock data for demonstration.");
      setMetrics(MOCK_METRICS_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatGrowth = (growth: number) => {
    return `${growth >= 0 ? "+" : ""}${growth.toFixed(1)}%`;
  };

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth >= 0;
    return {
      color: isPositive ? "success" : ("error" as const),
      icon: isPositive ? (
        <ArrowUp className="size-3" />
      ) : (
        <ArrowDown className="size-3" />
      ),
      text: formatGrowth(growth),
    };
  };

  const metricCards = metrics
    ? [
        {
          key: "users",
          title: "Total Customers",
          value: metrics.users.total,
          monthly: metrics.users.currentMonth,
          growth: metrics.users.growth,
          icon: <Users className="size-6" />,
          color: premiumColors.primary,
          gradient: "from-emerald-500 to-emerald-600",
          format: formatNumber,
        },
        {
          key: "orders",
          title: "Gifts Delivered",
          value: metrics.orders.total,
          monthly: metrics.orders.currentMonth,
          growth: metrics.orders.growth,
          icon: <Package className="size-6" />,
          color: premiumColors.secondary,
          gradient: "from-purple-500 to-purple-600",
          format: formatNumber,
        },
        {
          key: "transactions",
          title: "Total Transactions",
          value: metrics.transactions.total,
          monthly: metrics.transactions.currentMonth,
          growth: metrics.transactions.growth,
          icon: <TransactionIcon />,
          color: premiumColors.tertiary,
          gradient: "from-blue-500 to-blue-600",
          format: formatNumber,
        },
        {
          key: "revenue",
          title: "Total Revenue",
          value: metrics.revenue.total,
          monthly: metrics.revenue.currentMonth,
          growth: metrics.revenue.growth,
          icon: <DollarSign className="size-6" />,
          color: "#f59e0b",
          gradient: "from-amber-500 to-amber-600",
          format: formatCurrency,
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-lg shadow-neutral-100/50 backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/80 dark:shadow-neutral-950/20"
          >
            <div className="animate-pulse">
              <div className="mb-4 h-12 w-12 rounded-xl bg-neutral-100 dark:bg-neutral-700/50"></div>
              <div className="space-y-3">
                <div className="h-4 w-2/3 rounded-full bg-neutral-100 dark:bg-neutral-700/50"></div>
                <div className="h-8 w-4/5 rounded-full bg-neutral-100 dark:bg-neutral-700/50"></div>
                <div className="h-3 w-1/4 rounded-full bg-neutral-100 dark:bg-neutral-700/50"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="relative rounded-3xl border border-red-300 bg-white p-10 text-center shadow-2xl dark:border-red-800/60 dark:bg-neutral-900">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/40">
          <Activity className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Data Load Failed
        </h3>
        <p className="mb-6 text-neutral-600 dark:text-neutral-400">{error}</p>
        <button
          onClick={fetchMetrics}
          className="transform rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-8 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:from-red-600 hover:to-red-700"
        >
          <div className="flex items-center gap-2">
            <Zap className="size-5" />
            Retry Connection
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && metrics && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 shadow-md dark:border-amber-700/50 dark:bg-amber-900/30 dark:text-amber-300">
          <Activity className="mt-0.5 size-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const badge = getGrowthBadge(card.growth);

          return (
            <div
              key={card.key}
              className="group relative overflow-hidden rounded-3xl border border-neutral-200/60 bg-white/80 p-6 shadow-xl shadow-neutral-100/50 backdrop-blur-md transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-100/40 dark:border-neutral-800/60 dark:bg-neutral-900/80 dark:shadow-neutral-950/20 dark:hover:shadow-emerald-950/20"
            >
              <div
                className="pointer-events-none absolute -top-1/3 -right-1/3 h-3/4 w-3/4 rotate-12 transform rounded-full opacity-10 transition-all duration-700 group-hover:scale-[1.3]"
                style={{ backgroundColor: card.color, filter: "blur(30px)" }}
              />

              <div
                className={`relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-[1.05]`}
                style={{
                  background: `linear-gradient(135deg, ${card.color}15, ${card.color}08)`,
                  boxShadow: `0 4px 15px -5px ${card.color}50`,
                }}
              >
                <div
                  className="flex h-full w-full items-center justify-center rounded-2xl border border-transparent transition-all duration-300 group-hover:border-white/50 dark:group-hover:border-neutral-700"
                  style={{ color: card.color }}
                >
                  {card.icon}
                </div>
              </div>

              <div className="relative z-10">
                <span className="mb-1 block text-sm font-semibold tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
                  {card.title}
                </span>
                <h4 className="mb-2 text-4xl font-extrabold tracking-tight text-neutral-900 transition-colors duration-300 dark:text-white">
                  {card.format(card.value)}
                </h4>

                <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                  <Badge
                    color={badge.color}
                    className="transform transition-all duration-500 group-hover:translate-x-1"
                  >
                    <div className="flex items-center gap-1">
                      {badge.icon}
                      <span className="font-bold">{badge.text}</span>
                    </div>
                  </Badge>

                  <p className="text-xs font-medium whitespace-nowrap text-neutral-500 dark:text-neutral-500">
                    {card.format(card.monthly)} this month
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
