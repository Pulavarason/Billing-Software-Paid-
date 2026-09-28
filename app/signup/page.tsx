"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import AuthCard from "@/components/AuthCard";

export default function SignupPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { business_name: businessName.trim() } }
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required by the Supabase project, there is no
    // session yet — tell the user to check their inbox instead of redirecting.
    const loginUrl = `/login?created=1&email=${encodeURIComponent(email)}`;
    if (!data.session) {
      router.push(loginUrl);
      router.refresh();
      return;
    }

    await supabase.auth.signOut();
    router.push(loginUrl);
    router.refresh();
  };

  return (
    <AuthCard title="Create an account" subtitle="Set up your billing account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--text-muted))]">
            Business name
          </label>
          <input
            type="text"
            required
            autoComplete="organization"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none focus:border-spice-500"
            placeholder="Your business name"
          />
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none focus:border-spice-500"
            placeholder="At least 6 characters"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[rgb(var(--text-muted))]">
            Confirm password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--border))] bg-transparent px-3 py-2.5 text-sm text-[rgb(var(--text))] outline-none focus:border-spice-500"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600">{error}</p>
        )}
        {notice && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-spice-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-spice-700 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[rgb(var(--text-muted))]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-spice-600 hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
