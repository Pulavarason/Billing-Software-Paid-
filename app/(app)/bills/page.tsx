"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Receipt, Trash2 } from "lucide-react";
import { useData } from "@/context/DataContext";
import { useToast } from "@/context/ToastContext";
import SearchInput from "@/components/SearchInput";
import EmptyState from "@/components/EmptyState";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Bill } from "@/lib/types";
import { formatCurrency, formatDateDisplay } from "@/lib/format";

export default function BillsPage() {
  const { data, isReady, deleteBill } = useData();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...data.bills]
      .filter((b) => {
        const matchesSearch =
          !q ||
          b.billNumber.toLowerCase().includes(q) ||
          (b.customerName ?? "").toLowerCase().includes(q) ||
          (b.customerPhone ?? "").toLowerCase().includes(q);
        const matchesDate = !dateFilter || b.date === dateFilter;
        return matchesSearch && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data.bills, search, dateFilter]);

  const handleDeleteConfirmed = () => {
    if (!deleteTarget) return;
    deleteBill(deleteTarget.id);
    showToast(`Bill ${deleteTarget.billNumber} deleted.`, "info");
    setDeleteTarget(null);
  };

  if (!isReady) {
    return <div className="text-sm text-[rgb(var(--text-muted))]">Loading&hellip;</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search bill no. or customer..."
          className="sm:max-w-xs"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter by date"
          className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] px-3.5 py-2.5 text-sm focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter("")}
            className="text-xs font-medium text-spice-600 hover:underline dark:text-spice-400"
          >
            Clear date
          </button>
        )}
      </div>

      {data.bills.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No bills yet"
          description="Bills you create will show up here with search and filtering."
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No matching bills" description="Try a different search or date." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--border))]/20 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
                  <th className="px-5 py-3">Bill Number</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {filtered.map((bill) => (
                  <tr key={bill.id} className="transition hover:bg-[rgb(var(--border))]/20">
                    <td className="px-5 py-3.5 font-medium text-[rgb(var(--text))]">{bill.billNumber}</td>
                    <td className="px-5 py-3.5 text-[rgb(var(--text-muted))]">
                      {formatDateDisplay(bill.date)}
                    </td>
                    <td className="px-5 py-3.5 text-[rgb(var(--text))]">
                      {bill.customerName || <span className="text-[rgb(var(--text-muted))]">&mdash;</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-[rgb(var(--text))]">
                      {formatCurrency(bill.grandTotal)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/bills/${bill.id}`}
                          aria-label={`View bill ${bill.billNumber}`}
                          className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-spice-50 hover:text-spice-700 dark:hover:bg-spice-900/30 dark:hover:text-spice-400"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(bill)}
                          aria-label={`Delete bill ${bill.billNumber}`}
                          className="rounded-lg p-2 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((bill) => (
              <Link
                key={bill.id}
                href={`/bills/${bill.id}`}
                className="block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[rgb(var(--text))]">{bill.billNumber}</p>
                  <p className="font-semibold text-[rgb(var(--text))]">{formatCurrency(bill.grandTotal)}</p>
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-[rgb(var(--text-muted))]">
                  <span>{formatDateDisplay(bill.date)}</span>
                  <span>{bill.customerName || "\u2014"}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete bill ${deleteTarget?.billNumber}?`}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
