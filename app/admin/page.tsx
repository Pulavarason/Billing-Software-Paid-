import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminTable, { AdminSubscriptionRow } from "./AdminTable";
import SignOutButton from "@/components/SignOutButton";

export default async function AdminPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!adminRow) redirect("/");

  // Auth is the source of truth for registered users. user_access only stores
  // each user's manual paid/access flags and may be missing for older accounts.
  const admin = createAdminClient();
  const authUsers: Array<{ id: string; email?: string; created_at: string; user_metadata?: Record<string, unknown> }> = [];
  let page = 1;
  let authError: string | null = null;
  while (true) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (result.error) {
      authError = result.error.message;
      break;
    }
    authUsers.push(...result.data.users);
    if (result.data.users.length < 1000) break;
    page += 1;
  }

  const { data: accessRows, error: accessError } = await admin
    .from("user_access")
    .select("user_id,email,business_name,paid,access_granted,updated_at");
  const { data: adminRows } = await admin.from("admins").select("user_id");
  const accessById = new Map((accessRows ?? []).map((item) => [item.user_id, item]));
  const adminIds = new Set((adminRows ?? []).map((item) => item.user_id));
  const rows: AdminSubscriptionRow[] = authUsers
    .map((authUser) => {
      const access = accessById.get(authUser.id);
      const metadataBusiness = authUser.user_metadata?.business_name;
      return {
        user_id: authUser.id,
        is_admin: adminIds.has(authUser.id),
        email: access?.email || authUser.email || "(no email)",
        business_name: access?.business_name || (typeof metadataBusiness === "string" ? metadataBusiness : ""),
        paid: access?.paid ?? false,
        access_granted: access?.access_granted ?? false,
        created_at: authUser.created_at
      };
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const accessErrorMessage = accessError?.message ?? "Unknown database error";
  const setupError = authError
    ? "Could not load registered users: " + authError + ". Check SUPABASE_SERVICE_ROLE_KEY."
    : accessError
      ? "The user list loaded, but the access table is missing or unavailable (" + accessErrorMessage + "). Run supabase/migrations/0002_manual_access_cloud_data.sql in the Supabase SQL Editor."
      : null;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] px-4 py-8 md:px-10 md:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-spice-600/10 text-spice-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[rgb(var(--text))]">User access</h1>
              <p className="text-sm text-[rgb(var(--text-muted))]">Confirm payments and control who can use the software.</p>
            </div>
          </div>
          <SignOutButton />
        </div>
        <div className="mt-6">
          <AdminTable rows={rows} currentAdminId={user.id} setupError={setupError} />
        </div>
      </div>
    </div>
  );
}
