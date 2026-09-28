"use client";

import Link from "next/link";
import { BarChart3, IndianRupee, Package, Receipt, ScrollText } from "lucide-react";
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
  const billsToday = data.bills.filter((bill) => bill.date === today);
  const todaysSales = billsToday.reduce((sum, bill) => sum + bill.grandTotal, 0);
  const currentYear = new Date().getFullYear();
  const yearlySales = data.bills
    .filter((bill) => Number(bill.date.slice(0, 4)) === currentYear)
    .reduce((sum, bill) => sum + bill.grandTotal, 0);
  const activeProducts = data.products.filter((product) => product.status === "active").length;

  const salesByDate = new Map<string, number>();
  for (const bill of data.bills) {
    salesByDate.set(bill.date, (salesByDate.get(bill.date) ?? 0) + bill.grandTotal);
  }

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - 6);
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    return {
      key: dateKey,
      label: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date),
      sales: salesByDate.get(dateKey) ?? 0
    };
  });

  const recentBills = [...data.bills]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's Sales" value={formatCurrency(todaysSales)} icon={IndianRupee} />
        <StatCard
          label="Total Products"
          value={String(data.products.length)}
          icon={Package}
          hint={activeProducts + " active"}
          href="/products"
        />
        <StatCard
          label="This Year"
          value={formatCurrency(yearlySales)}
          icon={BarChart3}
          hint={String(currentYear) + " year to date"}
        />
        <StatCard
          label="Total Bills"
          value={String(data.bills.length)}
          icon={ScrollText}
          hint={String(billsToday.length) + " today"}
          href="/bills"
        />
      </div>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[rgb(var(--text))]">Daily Sales</h2>
            <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">Saved sales for the last 7 days</p>
          </div>
          <IndianRupee className="mt-0.5 h-5 w-5 text-spice-600 dark:text-spice-400" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {lastSevenDays.map((day) => (
            <div key={day.key} className="rounded-xl bg-[rgb(var(--bg))] px-3 py-3">
              <p className="text-xs text-[rgb(var(--text-muted))]">{day.label}</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--text))]">{formatCurrency(day.sales)}</p>
            </div>
          ))}
        </div>
      </section>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--text))]">Recent Bills</h2>
        </div>

        {recentBills.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No bills yet"
            description="Bills you create will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft">
            <ul className="divide-y divide-[rgb(var(--border))]">
              {recentBills.map((bill) => (
                <li key={bill.id}>
                  <Link
                    href={"/bills/" + bill.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-[rgb(var(--border))]/30 sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[rgb(var(--text))]">
                        Bill #{bill.billNumber}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {formatDateDisplay(bill.date)}
                        {bill.customerName ? " - " + bill.customerName : ""}
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
