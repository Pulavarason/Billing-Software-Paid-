"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users, Wallet, ShieldCheck, Clock, Loader2 } from "lucide-react";
import { setUserAccess } from "./actions";

export interface AdminSubscriptionRow {
  user_id: string;
  email: string;
  business_name: string;
  paid: boolean;
  access_granted: boolean;
  created_at: string;
}

type Filter = "all" | "pending" | "granted";

function Toggle({
  checked,
  disabled,
  onChange,
  label
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-spice-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        checked
          ? "border-spice-600 bg-spice-600"
          : "border-[rgb(var(--border))] bg-[rgb(var(--border))]"
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-soft transition-transform duration-200 ${
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

function StatCard({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-4 shadow-soft">
      <div className="flex items-center gap-2 text-[rgb(var(--text-muted))]">
        <span className="text-spice-600">{icon}</span>
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-[rgb(var(--text))]">{value}</p>
    </div>
  );
}

export default function AdminTable({
  rows,
  setupError
}: {
  rows: AdminSubscriptionRow[];
  setupError?: string | null;
}) {
  const [items, setItems] = useState<AdminSubscriptionRow[]>(rows);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Keep local state in sync when the server sends fresh data
  useEffect(() => {
    setItems(rows);
  }, [rows]);

  const stats = useMemo(
    () => ({
      total: items.length,
      paid: items.filter((r) => r.paid).length,
      granted: items.filter((r) => r.access_granted).length,
      pending: items.filter((r) => !r.access_granted).length
    }),
    [items]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      if (filter === "pending" && r.access_granted) return false;
      if (filter === "granted" && !r.access_granted) return false;
      if (!q) return true;
      return r.email.toLowerCase().includes(q) || r.business_name.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  const update = async (row: AdminSubscriptionRow, paid: boolean, accessGranted: boolean) => {
    setActionError(null);
    const previous = items;
    // Optimistic update so the toggle moves instantly
    setItems((prev) =>
      prev.map((r) =>
        r.user_id === row.user_id ? { ...r, paid, access_granted: accessGranted } : r
      )
    );
    setBusyId(row.user_id);
    try {
      await setUserAccess(row.user_id, paid, accessGranted);
    } catch (error: unknown) {
      setItems(previous); // roll back on failure
      setActionError(
        error instanceof Error ? error.message : "Could not update this user's access."
      );
    } finally {
      setBusyId(null);
    }
  };

  // Paid ON  -> paid + access granted (same as your old "Mark paid & grant")
  // Paid OFF -> unpaid + access revoked (same as your old "Mark unpaid")
  const togglePaid = (row: AdminSubscriptionRow) => update(row, !row.paid, !row.paid);
  const toggleAccess = (row: AdminSubscriptionRow) => update(row, row.paid, !row.access_granted);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: stats.total },
    { id: "pending", label: "Pending", count: stats.pending },
    { id: "granted", label: "Granted", count: stats.granted }
  ];

  return (
    <div className="animate-fade-in">
      {setupError && (
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {setupError}
        </p>
      )}
      {actionError && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {actionError}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard icon={<Users className="h-4 w-4" />} label="Total users" value={stats.total} />
        <StatCard icon={<Wallet className="h-4 w-4" />} label="Paid" value={stats.paid} />
        <StatCard icon={<ShieldCheck className="h-4 w-4" />} label="Access granted" value={stats.granted} />
        <StatCard icon={<Clock className="h-4 w-4" />} label="Pending" value={stats.pending} />
      </div>

      {/* Search + filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search email or business"
            className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-2.5 pl-9 pr-3.5 text-sm text-[rgb(var(--text))] focus:border-spice-400 focus:outline-none focus:ring-2 focus:ring-spice-400/30"
          />
        </div>

        <div className="inline-flex rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFilter(t.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                filter === t.id
                  ? "bg-spice-600 text-white shadow-soft"
                  : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]"
              }`}
            >
              {t.label} <span className="opacity-70">({t.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] shadow-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[rgb(var(--border))] text-xs uppercase tracking-wide text-[rgb(var(--text-muted))]">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Business</th>
              <th className="px-4 py-3 font-semibold">Signed up</th>
              <th className="px-4 py-3 font-semibold">Paid once</th>
              <th className="px-4 py-3 font-semibold">Access</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const busy = busyId === row.user_id;
              return (
                <tr
                  key={row.user_id}
                  className="border-b border-[rgb(var(--border))] transition-colors last:border-0 hover:bg-[rgb(var(--border))]/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-spice-600/10 text-sm font-bold uppercase text-spice-600">
                        {row.email.charAt(0)}
                      </div>
                      <span className="break-all font-medium text-[rgb(var(--text))]">{row.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[rgb(var(--text-muted))]">
                    {row.business_name || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-[rgb(var(--text-muted))]">
                    {new Date(row.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Kolkata"
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Toggle
                        checked={row.paid}
                        disabled={busy}
                        onChange={() => togglePaid(row)}
                        label={`Paid once for ${row.email}`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          row.paid ? "text-spice-600" : "text-[rgb(var(--text-muted))]"
                        }`}
                      >
                        {row.paid ? "Paid" : "Unpaid"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Toggle
                        checked={row.access_granted}
                        disabled={busy}
                        onChange={() => toggleAccess(row)}
                        label={`Access for ${row.email}`}
                      />
                      <span
                        className={`text-xs font-semibold ${
                          row.access_granted
                            ? "text-spice-600"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {row.access_granted ? "Granted" : "Pending"}
                      </span>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-[rgb(var(--text-muted))]" />}
                    </div>
                  </td>
                </tr>
              );
            })}

            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-[rgb(var(--text-muted))]">
                  {setupError
                    ? "Could not load accounts. See the message above."
                    : items.length === 0
                      ? "No Supabase Auth users found. Confirm users exist in Supabase Authentication → Users."
                      : "No users match your search or filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}