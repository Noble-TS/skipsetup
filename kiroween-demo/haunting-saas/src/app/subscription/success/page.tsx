"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import SiteHeader from "~/app/_components/common/SiteHeader";
import { CheckCircle } from "lucide-react";

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      fetch("/api/subscription/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    }
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-900 via-orange-950/20 to-neutral-900">
      <SiteHeader />

      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-green-500/20 p-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold text-white">
          Subscription Activated! 🎃
        </h1>
        <p className="mb-8 text-xl text-neutral-400">
          Welcome to the haunting experience. Your supernatural powers are now unlocked!
        </p>

        <div className="space-y-4">
          <button
            onClick={() => router.push("/subscription")}
            className="w-full rounded-lg bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            View Subscription
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-lg border border-neutral-600 py-3 font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
