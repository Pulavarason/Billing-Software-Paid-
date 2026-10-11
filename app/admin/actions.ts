"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin(): Promise<string> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (!data) throw new Error("Not authorized.");
  return user.id;
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

export async function deleteCustomerAccount(userId: string) {
  const adminId = await requireAdmin();
  if (!userId || userId === adminId) throw new Error("You cannot delete your own admin account.");

  const admin = createAdminClient();
  const { data: adminRow, error: adminCheckError } = await admin
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (adminCheckError) throw new Error(adminCheckError.message);
  if (adminRow) throw new Error("Admin accounts cannot be deleted from the customer list.");

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}
