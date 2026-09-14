"use client";

import { Trash2 } from "lucide-react";
import { BillItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface BillItemsTableProps {
  items: BillItem[];
  onRemove: (index: number) => void;
}

export default function BillItemsTable({ items, onRemove }: BillItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] p-8 text-center text-sm text-[rgb(var(--text-muted))]">
        No items added yet. Search for a product above to get started.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] bg-[rgb(var(--border))]/20 text-left text-xs font-semibold uppercase tracking-wide text-[rgb(var(--text-muted))]">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {items.map((item, idx) => (
              <tr key={`${item.variantId}-${idx}`}>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-[rgb(var(--text))]">
                  {item.productName}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[rgb(var(--text-muted))]">
                  {item.variantSize}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[rgb(var(--text))]">
                  {item.quantity}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-[rgb(var(--text))]">
                  {formatCurrency(item.price)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[rgb(var(--text))]">
                  {formatCurrency(item.amount)}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => onRemove(idx)}
                    aria-label={`Remove ${item.productName}`}
                    className="rounded-lg p-1.5 text-[rgb(var(--text-muted))] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
