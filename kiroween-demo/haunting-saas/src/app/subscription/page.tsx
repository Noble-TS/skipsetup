"use client";
import { useSession } from "~/server/better-auth/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "../_components/common/SiteHeader";
import { Crown, Calendar, CreditCard } from "lucide-react";

export default function SubscriptionPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/signin?redirect=/subscription");
    }
  }, [session, isPending, router]);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscription/portal", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to open portal");

      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      alert("Failed to open subscription portal");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const tier = user.subscriptionTier || "free";
  const status = user.subscriptionStatus || "inactive";

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-orange-950/20 to-neutral-900">
      <SiteHeader />

      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold text-white">
          Subscription Management
        </h1>

        <div className="space-y-6">
          {/* Current Plan */}
          <div className="rounded-2xl border border-neutral-700 bg-neutral-800/50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold text-white">Current Plan</h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-neutral-400">Plan</p>
                <p className="text-lg font-semibold capitalize text-white">
                  {tier === "free" ? "Free" : tier}
                </p>
              </div>

              <div>
                <p className="text-sm text-neutral-400">Status</p>
                <span
                  className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    status === "active"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-neutral-700 text-neutral-300"
                  }`}
                >
                  {status}
                </span>
              </div>

              {user.subscriptionEndDate && (
                <div>
                  <p className="text-sm text-neutral-400">Next Billing Date</p>
                  <p className="text-white">
                    {new Date(user.subscriptionEndDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {tier !== "free" && status === "active" && (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full rounded-lg border border-orange-500 bg-orange-500/10 py-3 font-semibold text-orange-500 transition-colors hover:bg-orange-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Loading..." : "Manage Subscription"}
              </button>
            )}

            <button
              onClick={() => router.push("/pricing")}
              className="w-full rounded-lg border border-neutral-600 py-3 font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              {tier === "free" ? "Upgrade Plan" : "Change Plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
