"use client";

import Link from "next/link";
import { FilePlus2, IndianRupee, Package, PlusCircle, Receipt, ScrollText } from "lucide-react";
import { useData } from "@/context/DataContext";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDateDisplay, todayIso } from "@/lib/format";

export default function DashboardPage() {
  const { data, isReady } = useData();

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  const today = todayIso();
  const billsToday = data.bills.filter((b) => b.date === today);
  const todaysSales = billsToday.reduce((sum, b) => sum + b.grandTotal, 0);
  const activeProducts = data.products.filter((p) => p.status === "active").length;

  const recentBills = [...data.bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(todaysSales)} icon={IndianRupee} />
        <StatCard label="Bills Today" value={String(billsToday.length)} icon={Receipt} />
        <StatCard label="Total Bills" value={String(data.bills.length)} icon={ScrollText} />
        <StatCard
          label="Products"
          value={String(data.products.length)}
          icon={Package}
          hint={`${activeProducts} active`}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link
          href="/bills/create"
          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-spice-600 text-white">
            <FilePlus2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">Create New Bill</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Start a fresh invoice</p>
          </div>
        </Link>

        <Link
          href="/products"
          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--border))] text-[rgb(var(--text))]">
            <PlusCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">Add Product</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Manage your catalog</p>
          </div>
        </Link>

        <Link
          href="/bills"
          className="flex items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--border))] text-[rgb(var(--text))]">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--text))]">View Bills</p>
            <p className="text-xs text-[rgb(var(--text-muted))]">Browse invoice history</p>
          </div>
        </Link>
      </div>

      {/* Recent bills */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">Recent Bills</h2>
          <Link href="/bills" className="text-xs font-medium text-spice-600 hover:underline dark:text-spice-400">
            View all
          </Link>
        </div>

        {recentBills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            description="Create your first bill to see it appear here."
            action={
              <Link
                href="/bills/create"
                className="inline-flex items-center gap-2 rounded-lg bg-spice-600 px-4 py-2 text-sm font-medium text-white hover:bg-spice-700"
              >
                <FilePlus2 className="h-4 w-4" /> Create New Bill
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft">
            <ul className="divide-y divide-[rgb(var(--border))]">
              {recentBills.map((bill) => (
                <li key={bill.id}>
                  <Link
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[rgb(var(--border))]/30 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[rgb(var(--text))]">
                        Bill #{bill.billNumber}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {formatDateDisplay(bill.date)}
                        {bill.customerName ? ` \u00B7 ${bill.customerName}` : ""}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[rgb(var(--text))]">
                      {formatCurrency(bill.grandTotal)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
