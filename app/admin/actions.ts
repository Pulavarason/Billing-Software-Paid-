"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("Not authorized.");
}

export async function setUserAccess(userId: string, paid: boolean, accessGranted: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data: result, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !result.user) throw new Error(userError?.message ?? "User not found.");

  const { error } = await admin.from("user_access").upsert({
    user_id: result.user.id,
    email: result.user.email ?? "",
    business_name: result.user.user_metadata?.business_name ?? "",
    paid,
    access_granted: accessGranted,
    paid_at: paid ? new Date().toISOString() : null,
    updated_at: new Date().toISOString()
  }, { onConflict: "user_id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
