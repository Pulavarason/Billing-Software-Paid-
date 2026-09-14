"use client";

import { ReactNode } from "react";
import { Soup } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[rgb(var(--bg))] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-spice-600 text-white shadow-soft">
            <Soup className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[rgb(var(--text))]">
            Billing Software
          </h1>
          <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">{subtitle}</p>
        </div>
        <div className="rounded-xl2 border border-[rgb(var(--border))] bg-[rgb(var(--surface))] p-6 shadow-card">
          <h2 className="mb-5 text-base font-semibold text-[rgb(var(--text))]">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
