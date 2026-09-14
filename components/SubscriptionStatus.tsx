"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, CreditCard, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PLANS, PlanId, isPlanId } from "@/lib/plans";

type Subscription = {
  id: string;
  plan: string;
  status: string;
  amount: number;
  end_date: string | null;
  start_date: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
};

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "—";
}

function displayPlan(plan: string) {
  return isPlanId(plan) ? PLANS[plan as PlanId].label : plan;
}

export default function SubscriptionStatus() {
  const [subscriptions, setSubscriptions] = useState<Subscription[] | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("subscriptions")
      .select("id, plan, status, amount, end_date, start_date, razorpay_payment_id, created_at")
      .order("updated_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setSubscriptions((data as Subscription[] | null) ?? []));
  }, []);

  if (subscriptions === null) {
    return <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-muted))]"><Loader2 className="h-4 w-4 animate-spin" /> Loading subscription status…</div>;
  }

  const active = subscriptions.find((item) => item.status === "active" && item.end_date && new Date(item.end_date) > new Date());
  const daysLeft = active?.end_date
    ? Math.ceil((new Date(active.end_date).getTime() - Date.now()) / 86_400_000)
    : null;
  const needsRenewal = daysLeft !== null && daysLeft <= 7;

  return (
    <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-spice-600" />
            <h2 className="text-base font-semibold text-[rgb(var(--text))]">Subscription &amp; Payments</h2>
          </div>
          <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">Your plan, payment status, and billing validity.</p>
        </div>
        <Link href={active ? "/subscribe?renew=1" : "/subscribe"} className="rounded-lg bg-spice-600 px-3 py-2 text-xs font-semibold text-white hover:bg-spice-700">
          {active ? "Renew plan" : "Choose a plan"}
        </Link>
      </div>

      {active ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div><p className="text-xs text-[rgb(var(--text-muted))]">Current plan</p><p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{displayPlan(active.plan)} · ₹{Number(active.amount).toLocaleString("en-IN")}</p></div>
            <div><p className="text-xs text-[rgb(var(--text-muted))]">Payment status</p><p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Paid</p></div>
            <div><p className="text-xs text-[rgb(var(--text-muted))]">Valid until</p><p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{formatDate(active.end_date)}</p></div>
          </div>
          {needsRenewal && (
            <div className="mt-4 flex gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Your plan expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}. Please renew to avoid losing billing access.
            </div>
          )}
        </>
      ) : (
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700"><Clock3 className="h-4 w-4 shrink-0" /> No active subscription. Choose a plan to activate billing access.</div>
      )}

      {subscriptions.length > 0 && (
        <div className="mt-5 border-t border-[rgb(var(--border))] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">Recent payment details</h3>
          <div className="space-y-2">
            {subscriptions.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-[rgb(var(--bg))] px-3 py-2.5 text-xs">
                <span className="font-medium text-[rgb(var(--text))]">{displayPlan(item.plan)} · ₹{Number(item.amount).toLocaleString("en-IN")}</span>
                <span className={item.status === "active" ? "font-medium text-emerald-600" : "text-[rgb(var(--text-muted))]"}>{item.status === "active" ? "Paid" : item.status}</span>
                <span className="text-[rgb(var(--text-muted))]">{item.status === "active" ? `Paid ${formatDate(item.start_date)}` : `Requested ${formatDate(item.created_at)}`}</span>
                {item.razorpay_payment_id && <span className="text-[rgb(var(--text-muted))]">Payment ID: {item.razorpay_payment_id}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
