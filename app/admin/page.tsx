import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminTable, { AdminSubscriptionRow } from "./AdminTable";

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/");

  // Admin panel bypasses RLS via the service-role client to see every
  // customer's subscription — middleware already gated this route.
  const admin = createAdminClient();
  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: false });

  const rows: AdminSubscriptionRow[] = (subscriptions ?? []).map((s) => ({
    id: s.id,
    email: s.user_email ?? s.user_id,
    plan: s.plan,
    status: s.status,
    start_date: s.start_date,
    end_date: s.end_date
  }));

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] px-4 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-bold text-[rgb(var(--text))]">Subscriptions</h1>
        <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
          {rows.length} customer{rows.length === 1 ? "" : "s"}
        </p>
        <div className="mt-6">
          <AdminTable rows={rows} />
        </div>
      </div>
    </div>
  );
}
