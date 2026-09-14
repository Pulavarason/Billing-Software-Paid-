"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Sun, X, Soup } from "lucide-react";
import { ReactNode, useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";
import { useTheme } from "@/context/ThemeContext";
import { useData } from "@/context/DataContext";
import SignOutButton from "@/components/SignOutButton";

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function BrandMark() {
  const { data } = useData();
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-spice-600 text-white shadow-soft">
        <Soup className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold leading-tight tracking-tight text-[rgb(var(--text))]">
          {data.settings.businessName || "Your Business"}
        </p>
        <p className="truncate text-[11px] text-[rgb(var(--text-muted))]">Billing System</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-spice-600 text-white shadow-soft"
                : "text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/50 hover:text-[rgb(var(--text))]"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 shrink-0 ${
                active ? "text-white" : "text-[rgb(var(--text-muted))] group-hover:text-[rgb(var(--text))]"
              }`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--surface))] text-[rgb(var(--text-muted))] transition hover:text-[rgb(var(--text))]"
    >
      {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
    </button>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const activeItem = NAV_ITEMS.find((i) => isActive(pathname, i.href));

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-5 md:flex">
        <BrandMark />
        <div className="mt-6 flex flex-1 flex-col">
          <NavLinks />
        </div>
        <div className="mt-auto flex flex-col gap-1 px-3 pt-4">
          <SignOutButton />
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] text-[rgb(var(--text-muted))]">v1.0 &middot; Local data</p>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] animate-slide-in flex-col border-r border-[rgb(var(--border))] bg-[rgb(var(--surface))] py-5">
            <div className="flex items-center justify-between px-2">
              <BrandMark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-1 flex-col">
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="flex flex-col gap-1 px-3 pt-4">
              <SignOutButton />
              <div className="flex items-center justify-between px-2">
                <p className="text-[11px] text-[rgb(var(--text-muted))]">v1.0 &middot; Local data</p>
                <ThemeToggle />
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/90 px-4 py-3.5 backdrop-blur md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--border))]/50 md:hidden"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          <h1 className="flex-1 truncate text-base font-semibold text-[rgb(var(--text))] md:text-lg">
            {activeItem?.label ?? ""}
          </h1>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
