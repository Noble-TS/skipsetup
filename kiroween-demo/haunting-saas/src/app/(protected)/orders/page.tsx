"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Calendar,
  DollarSign,
  ArrowRight,
  Home,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  CheckCircle,
  Truck,
  Clock,
} from "lucide-react";
import UserDropdownProfile from "~/app/_components/auth/UserDropdownProfile";
import { useCart } from "~/app/_components/context/CartContext";
import { useRouter } from "next/navigation";

const Colors = {
  PrimaryText: "#1f2937",
  SecondaryText: "#6b7280",
  Background: "bg-white",
  SoftEmerald: "bg-emerald-50",
  AccentEmerald: "#059669",
  AccentEmeraldDark: "#047857",
  AccentGray: "#9ca3af",
} as const;

const PremiumDivider = () => (
  <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
);

interface Order {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  items: Array<{
    product: {
      name: string;
      image?: string;
    };
    quantity: number;
    price: number;
  }>;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyAgainLoading, setBuyAgainLoading] = useState<string | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const ordersData = await response.json();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "FAILED":
        return <div className="h-2 w-2 rounded-full bg-red-500"></div>;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleBuyAgain = async (order: Order) => {
    setBuyAgainLoading(order.id);

    try {
      order.items.forEach((item) => {
        addToCart({
          productId: `prod_${item.product.name.toLowerCase().replace(/\s+/g, "_")}`,
          name: item.product.name,
          price: item.price / 100, // Convert from cents to dollars
          image: item.product.image || "/images/placeholder.jpg",
        });
      });

      alert(
        `${order.items.length} item${order.items.length !== 1 ? "s" : ""} added to cart!`,
      );

      setTimeout(() => {
        router.push("/shop");
      }, 1500);
    } catch (error) {
      console.error("Error adding items to cart:", error);
      alert("Failed to add items to cart. Please try again.");
    } finally {
      setBuyAgainLoading(null);
    }
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans dark:from-gray-900 dark:to-emerald-950/20`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
                SS
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                SkipSetup
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-base font-medium">
              <Link
                href="/"
                className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block dark:text-gray-400 dark:hover:text-emerald-400"
              >
                Home
              </Link>
              <Link
                href="/shop"
                className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block dark:text-gray-400 dark:hover:text-emerald-400"
              >
                Shop
              </Link>
              <Link
                href="/orders"
                className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                My Orders
              </Link>
            </nav>
            <UserDropdownProfile />
          </div>
        </header>

        <PremiumDivider />

        {/* Loading State */}
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-t-2 border-b-2 border-emerald-600"></div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              Loading Your Orders
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              We're gathering your order history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50/30 font-sans dark:from-gray-900 dark:to-emerald-950/20`}
    >
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 px-4 py-5 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 font-bold text-white shadow-lg">
              SS
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              SkipSetup
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-base font-medium">
            <Link
              href="/"
              className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block dark:text-gray-400 dark:hover:text-emerald-400"
            >
              Home
            </Link>
            <Link
              href="/shop"
              className="hidden text-gray-600 transition-colors hover:text-emerald-600 md:block dark:text-gray-400 dark:hover:text-emerald-400"
            >
              Shop
            </Link>
            <Link
              href="/orders"
              className="rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-2.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            >
              My Orders
            </Link>
          </nav>
          <UserDropdownProfile />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 md:px-8">
        {orders.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg">
                <Package className="h-12 w-12 text-white" />
              </div>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              No Orders Yet
            </h2>
            <p className="mx-auto mb-8 max-w-md text-xl text-gray-600 dark:text-gray-400">
              Start your journey with SkipSetup. Explore our premium products
              and services.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 font-semibold text-gray-700 shadow-lg transition-all hover:scale-105 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              >
                <Home size={20} />
                Return Home
              </Link>
              <Link
                href="/shop"
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              >
                <ShoppingBag size={20} />
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="mb-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                  Order History
                </div>
              </div>
              <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                Your Orders
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                ${orders.length} order${orders.length !== 1 ? "s" : ""} • Total
                spent: $
                {(
                  orders.reduce((sum, order) => sum + order.amount, 0) / 100
                ).toFixed(2)}
              </p>
            </div>

            <div className="grid gap-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="p-6">
                    <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="mb-4 flex items-center gap-4 lg:mb-0">
                        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                          <Package size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Order #${order.id.slice(-8).toUpperCase()}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <Calendar
                              size={16}
                              className="text-gray-500 dark:text-gray-400"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              $
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                        <div className="text-right">
                          <div className="mb-2 flex items-center gap-2">
                            <DollarSign
                              size={18}
                              className="text-emerald-600 dark:text-emerald-400"
                            />
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              ${(order.amount / 100).toFixed(2)}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${getStatusColor(order.status)}`}
                          >
                            ${getStatusIcon(order.status)} ${order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
                      <h4 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                        Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${item.product.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                Qty: ${item.quantity}
                              </span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                $
                                {((item.price * item.quantity) / 100).toFixed(
                                  2,
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-6 dark:border-gray-700">
                      <Link
                        href={`/checkout/success?order_id=${order.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                      >
                        View Order Details
                        <ArrowRight size={16} />
                      </Link>

                      <button
                        onClick={() => handleBuyAgain(order)}
                        disabled={buyAgainLoading === order.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-semibold text-emerald-700 shadow-lg transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                      >
                        {buyAgainLoading === order.id ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <RotateCcw size={16} />
                            Buy Again
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-4 flex justify-center">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                    <Truck size={24} />
                  </div>
                </div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  Continue Shopping
                </h3>
                <p className="mx-auto mb-6 max-w-md text-lg text-gray-600 dark:text-gray-400">
                  Discover more premium products and services in our marketplace
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <ShoppingBag size={20} />
                  Explore Products
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      <PremiumDivider />

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-10 text-center dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-sm font-bold text-white">
            SS
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            SkipSetup
          </span>
        </div>
        <p className="text-base text-gray-600 dark:text-gray-400">
          © ${new Date().getFullYear()} SkipSetup. Enterprise-grade ecommerce
          platform.
        </p>
      </footer>
    </div>
  );
}
