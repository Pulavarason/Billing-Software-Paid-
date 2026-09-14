"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function SignOutButton({ className }: { className?: string }) {
  const { signOut } = useAuth();
  return (
    <button
      onClick={() => signOut()}
      className={
        className ??
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[rgb(var(--text-muted))] transition hover:bg-[rgb(var(--border))]/50 hover:text-[rgb(var(--text))]"
      }
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
