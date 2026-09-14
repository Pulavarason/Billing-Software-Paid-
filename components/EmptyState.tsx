import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--surface))]/60 px-6 py-14 text-center animate-fade-in">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-spice-50 dark:bg-spice-900/30">
        <Icon className="h-7 w-7 text-spice-600 dark:text-spice-400" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-[rgb(var(--text))]">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-[rgb(var(--text-muted))]">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
