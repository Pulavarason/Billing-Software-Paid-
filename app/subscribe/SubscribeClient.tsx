"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLANS, Plan, PlanId } from "@/lib/plans";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Props {
  userEmail: string;
  expiredMessage?: string;
}

export default function SubscribeClient({ userEmail, expiredMessage }: Props) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ plan: PlanId; endDate: string } | null>(null);

  const handleSubscribe = async (planId: PlanId) => {
    setError(null);
    setLoadingPlan(planId);
    try {
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId })
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Could not start payment.");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Billing Software",
        description: `${PLANS[planId].label} subscription`,
        prefill: { email: userEmail },
        theme: { color: "#b8621c" },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response)
            });
            const result = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(result.error || "Payment was not completed.");

            setSuccess({ plan: planId, endDate: result.endDate });
            setLoadingPlan(null);
            setTimeout(() => {
              router.push("/");
              router.refresh();
            }, 1800);
          } catch (err: any) {
            setError(err.message || "Payment was not completed.");
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setLoadingPlan(null)
        }
      });

      razorpay.on("payment.failed", () => {
        setError("Payment was not completed. Please try again.");
        setLoadingPlan(null);
      });

      razorpay.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoadingPlan(null);
    }
  };

  if (success) {
    const plan = PLANS[success.plan];
    return (
      <div className="mx-auto max-w-md rounded-xl2 border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <Check className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h2 className="text-lg font-bold text-[rgb(var(--text))]">
          Subscription activated successfully.
        </h2>
        <div className="mt-4 space-y-1 text-sm text-[rgb(var(--text-muted))]">
          <p>Plan: {plan.label}</p>
          <p>Amount: ₹{plan.amountInr.toLocaleString("en-IN")}</p>
          <p>Valid until: {new Date(success.endDate).toLocaleDateString("en-IN")}</p>
        </div>
        <p className="mt-4 text-xs text-[rgb(var(--text-muted))]">Redirecting to your dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {expiredMessage && (
        <div className="mx-auto mb-8 max-w-xl rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-700">
          {expiredMessage}
        </div>
      )}

      {error && (
        <div className="mx-auto mb-8 max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {(Object.values(PLANS) as Plan[]).map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col rounded-xl2 border p-6 shadow-card ${
              plan.bestValue
                ? "border-spice-500 bg-[rgb(var(--surface))] ring-2 ring-spice-500"
                : "border-[rgb(var(--border))] bg-[rgb(var(--surface))]"
            }`}
          >
            {plan.bestValue && (
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-spice-600 px-3 py-1 text-[11px] font-semibold text-white shadow-soft">
                <Sparkles className="h-3 w-3" /> BEST VALUE
              </span>
            )}
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
              {plan.label}
            </h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[rgb(var(--text))]">
                ₹{plan.amountInr.toLocaleString("en-IN")}
              </span>
            </div>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{plan.priceSuffix}</p>

            <ul className="mt-5 flex-1 space-y-2 text-sm text-[rgb(var(--text-muted))]">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-spice-600" /> Full billing access
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-spice-600" /> Unlimited products &amp; bills
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-spice-600" /> Invoice PDF &amp; printing
              </li>
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan !== null}
              className={`mt-6 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-soft transition disabled:opacity-60 ${
                plan.bestValue
                  ? "bg-spice-600 text-white hover:bg-spice-700"
                  : "border border-[rgb(var(--border))] text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/40"
              }`}
            >
              {loadingPlan === plan.id && <Loader2 className="h-4 w-4 animate-spin" />}
              Subscribe Now
            </button>
          </div>
        ))}
      </div>

      <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-[rgb(var(--text-muted))]">
        <ShieldCheck className="h-4 w-4 text-spice-600" />
        Secure payment via Razorpay (Test Mode). Cancel anytime — access continues until your
        current period ends.
      </p>
    </>
  );
}
