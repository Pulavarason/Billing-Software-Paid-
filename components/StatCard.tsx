import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export default function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-5 shadow-soft transition hover:shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[rgb(var(--text-muted))]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-spice-50 dark:bg-spice-900/30">
          <Icon className="h-4.5 w-4.5 text-spice-600 dark:text-spice-400" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[rgb(var(--text))]">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-[rgb(var(--text-muted))]">{hint}</p>}
    </div>
  );
}
