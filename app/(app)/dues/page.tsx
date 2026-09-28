"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleDollarSign, FilePlus2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import EmptyState from "@/components/EmptyState";
import { formatCurrency, formatDateDisplay } from "@/lib/format";

export default function DuesPage() {
  const { data, isReady, recordPayment } = useData();
  const { showToast } = useToast();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const dueBills = useMemo(() => data.bills.filter((bill) => (bill.dueAmount ?? 0) > 0)
    .sort((a, b) => a.date.localeCompare(b.date)), [data.bills]);
  const totalDue = dueBills.reduce((sum, bill) => sum + (bill.dueAmount ?? 0), 0);

  const collect = (id: string, billNumber: string, due: number) => {
    const amount = Number(amounts[id]);
    if (!Number.isFinite(amount) || amount <= 0) {
      showToast("Enter a payment amount greater than zero.", "error");
      return;
    }
    recordPayment(id, Math.min(amount, due));
    setAmounts((current) => ({ ...current, [id]: "" }));
    showToast(`Payment recorded for ${billNumber}.`);
  };

  if (!isReady) return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/60 dark:bg-amber-950/20">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Total outstanding</p>
      <p className="mt-1 text-2xl font-bold text-amber-900 dark:text-amber-200">{formatCurrency(totalDue)}</p>
      <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">Across {dueBills.length} unpaid bill{dueBills.length === 1 ? "" : "s"}</p>
      <Link href="/due-bills/create" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-spice-700"><FilePlus2 className="h-4 w-4" /> Create Due Bill</Link>
    </div>
    {dueBills.length === 0 ? <EmptyState icon={CircleDollarSign} title="No outstanding dues" description="Partially paid and unpaid bills will appear here." /> : (
      <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft">
        <div className="divide-y divide-[rgb(var(--border))]">
          {dueBills.map((bill) => {
            const due = bill.dueAmount ?? 0;
            return <div key={bill.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><Link href={`/bills/${bill.id}`} className="font-semibold text-spice-700 hover:underline dark:text-spice-400">{bill.billNumber}</Link>
                <p className="mt-1 text-sm text-[rgb(var(--text))]">{bill.customerName || "Walk-in customer"}{bill.customerPhone ? ` · ${bill.customerPhone}` : ""}</p>
                <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{formatDateDisplay(bill.date)} · Bill {formatCurrency(bill.grandTotal)} · Paid {formatCurrency(bill.paidAmount ?? 0)}</p></div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end"><p className="mr-2 font-bold text-amber-700 dark:text-amber-400">Due {formatCurrency(due)}</p>
                <input type="number" min={0} max={due} value={amounts[bill.id] ?? ""} onChange={(e) => setAmounts((current) => ({ ...current, [bill.id]: e.target.value }))} placeholder="Receive ₹" className="w-28 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3 py-2 text-sm focus:border-spice-400 focus:outline-none" />
                <button onClick={() => collect(bill.id, bill.billNumber, due)} className="rounded-lg bg-spice-600 px-3 py-2 text-sm font-semibold text-white hover:bg-spice-700">Collect</button></div>
            </div>;
          })}
        </div>
      </div>
    )}
  </div>;
}
