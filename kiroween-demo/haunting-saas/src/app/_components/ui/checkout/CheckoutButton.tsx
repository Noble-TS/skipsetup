"use client";
import { useState } from "react";
import { useCart } from "~/app/_components/context/CartContext";

export default function CheckoutButton() {
  const { state } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (state.items.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Checkout failed");
      }

      const data = await response.json();

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmount = state.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || state.items.length === 0}
      className="w-full rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-lg"
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          Redirecting to Checkout...
        </span>
      ) : (
        <div className="flex flex-col items-center">
          <span>
            Proceed to Checkout ({state.itemCount}{" "}
            {state.itemCount === 1 ? "item" : "items"})
          </span>
          <span className="mt-0.5 text-sm font-normal opacity-90">
            Total: ${totalAmount.toFixed(2)}
          </span>
        </div>
      )}
    </button>
  );
}
