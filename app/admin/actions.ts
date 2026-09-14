"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** Confirms the caller is an authenticated admin before any write runs. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");

  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) throw new Error("Not authorized.");
  return user;
}

export async function activateSubscription(subscriptionId: string, extendDays = 30) {
  await requireAdmin();
  const admin = createAdminClient();
  const endDate = new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toISOString();
  await admin
    .from("subscriptions")
    .update({ status: "active", start_date: new Date().toISOString(), end_date: endDate, updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
  revalidatePath("/admin");
}

export async function deactivateSubscription(subscriptionId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
  revalidatePath("/admin");
}

export async function extendSubscription(subscriptionId: string, days: number) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: current } = await admin
    .from("subscriptions")
    .select("end_date")
    .eq("id", subscriptionId)
    .maybeSingle();

  const base = current?.end_date && new Date(current.end_date).getTime() > Date.now()
    ? new Date(current.end_date)
    : new Date();
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  await admin
    .from("subscriptions")
    .update({ status: "active", end_date: newEnd, updated_at: new Date().toISOString() })
    .eq("id", subscriptionId);
  revalidatePath("/admin");
}
