"use client";

import { useTransition } from "react";
import { activateSubscription, deactivateSubscription, extendSubscription } from "./actions";

export interface AdminSubscriptionRow {
  id: string;
  email: string;
  plan: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

export default function AdminTable({ rows }: { rows: AdminSubscriptionRow[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="overflow-x-auto rounded-xl2 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-card">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-[rgb(var(--border))] text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Plan</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Start</th>
            <th className="px-4 py-3">Expiry</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-[rgb(var(--border))] last:border-0">
              <td className="px-4 py-3 text-[rgb(var(--text))]">{row.email}</td>
              <td className="px-4 py-3 capitalize text-[rgb(var(--text-muted))]">{row.plan}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    row.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : row.status === "expired" || row.status === "failed"
                      ? "bg-red-500/10 text-red-600"
                      : "bg-amber-500/10 text-amber-600"
                  }`}
                >
                  {row.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-muted))]">
                {row.start_date ? new Date(row.start_date).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3 text-[rgb(var(--text-muted))]">
                {row.end_date ? new Date(row.end_date).toLocaleDateString("en-IN") : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => activateSubscription(row.id))}
                    className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/40 disabled:opacity-50"
                  >
                    Activate
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => extendSubscription(row.id, 30))}
                    className="rounded-lg border border-[rgb(var(--border))] px-2.5 py-1 text-xs font-medium text-[rgb(var(--text))] hover:bg-[rgb(var(--border))]/40 disabled:opacity-50"
                  >
                    +30 days
                  </button>
                  <button
                    disabled={isPending}
                    onClick={() => startTransition(() => deactivateSubscription(row.id))}
                    className="rounded-lg border border-red-500/30 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Deactivate
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-sm text-[rgb(var(--text-muted))]">
                No customers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
