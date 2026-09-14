"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const accountCreated = searchParams.get("created") === "1";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // The server (middleware) decides where an authenticated user belongs —
    // /subscribe if there's no active subscription, otherwise the app.
    const next = searchParams.get("next") || "/subscribe";
    router.push(next);
    router.refresh();
  };

  return (
    <AuthCard title="Log in" subtitle="Access your billing dashboard">
      <form onSubmit={handleSubmit} className="space-y-4">
        {accountCreated && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
            Account created successfully. Log in to continue to payments.
          </p>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--text-muted))]">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none focus:border-spice-500"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--text-muted))]">
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none focus:border-spice-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Log in
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[rgb(var(--text-muted))]">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-spice-600 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
