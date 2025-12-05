"use client";
import { useState } from "react";
import { useSession } from "~/server/better-auth/client";
import SiteHeader from "../_components/common/SiteHeader";
import { CheckCircle, Zap, Crown, Sparkles } from "lucide-react";

const tiers = [
  {
    id: "spooky",
    name: "Spooky Starter",
    icon: "👻",
    price: 9,
    description: "Perfect for casual haunters",
    features: [
      "5 haunting projects",
      "Basic ghost effects",
      "Email support",
      "Community access",
      "Monthly spooky updates",
    ],
    cta: "Start Haunting",
    popular: false,
  },
  {
    id: "haunting",
    name: "Haunting Pro",
    icon: "🦇",
    price: 29,
    description: "For serious paranormal professionals",
    features: [
      "Unlimited haunting projects",
      "Advanced ghost effects",
      "Priority support",
      "Premium templates",
      "Analytics dashboard",
      "Custom branding",
      "API access",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    id: "kiroween",
    name: "Kiroween Ultimate",
    icon: "🎃",
    price: 99,
    description: "The ultimate haunting experience",
    features: [
      "Everything in Pro",
      "White-label solution",
      "Dedicated account manager",
      "Custom integrations",
      "24/7 priority support",
      "Advanced analytics",
      "Team collaboration",
      "Early access to features",
    ],
    cta: "Unleash Power",
    popular: false,
  },
];

export default function PricingPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      window.location.href = "/signin?redirect=/pricing";
      return;
    }

    setLoading(tierId);
    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId }),
      });

      if (!response.ok) throw new Error("Subscription failed");

      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      alert("Failed to start subscription. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 via-emerald-50/30 to-neutral-50 dark:from-neutral-900 dark:via-emerald-950/20 dark:to-neutral-900">
      <SiteHeader />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-5xl font-bold text-neutral-900 dark:text-white">
            Choose Your <span className="text-emerald-600 dark:text-emerald-500">Haunting</span> Plan
          </h1>
          <p className="text-xl text-neutral-600 dark:text-neutral-400">
            Unlock supernatural powers with our spooky pricing tiers
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative overflow-hidden rounded-2xl border bg-white/80 p-8 backdrop-blur-sm transition-all hover:scale-105 dark:bg-neutral-800/50 ${
                tier.popular
                  ? "border-emerald-500 shadow-2xl shadow-emerald-500/20"
                  : "border-neutral-200 dark:border-neutral-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 rounded-bl-2xl bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                  MOST POPULAR
                </div>
              )}

              <div className="mb-6 text-center">
                <div className="mb-4 text-6xl">{tier.icon}</div>
                <h3 className="mb-2 text-2xl font-bold text-neutral-900 dark:text-white">
                  {tier.name}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">{tier.description}</p>
              </div>

              <div className="mb-6 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-neutral-900 dark:text-white">
                    ${tier.price}
                  </span>
                  <span className="text-neutral-600 dark:text-neutral-400">/month</span>
                </div>
              </div>

              <ul className="mb-8 space-y-3">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-500" />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading === tier.id}
                className={`w-full rounded-lg py-3 font-semibold transition-all ${
                  tier.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    : "border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:border-emerald-500 dark:text-emerald-500 dark:hover:bg-emerald-500"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading === tier.id ? "Processing..." : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 text-center">
          <h2 className="mb-8 text-3xl font-bold text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-3xl space-y-4 text-left">
            {[
              {
                q: "Can I change my plan later?",
                a: "Yes! Upgrade or downgrade anytime from your account settings.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards through Stripe.",
              },
              {
                q: "Is there a free trial?",
                a: "All plans come with a 14-day money-back guarantee.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-neutral-200 bg-white/80 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
              >
                <summary className="cursor-pointer font-semibold text-neutral-900 dark:text-white">
                  {faq.q}
                </summary>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
