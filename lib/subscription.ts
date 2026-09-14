import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus =
  | "active"
  | "pending"
  | "expired"
  | "cancelled"
  | "failed";

export interface SubscriptionRow {
  id: string;
  user_id: string;
  razorpay_subscription_id: string | null;
  razorpay_order_id: string | null;
  plan: string;
  status: SubscriptionStatus;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionCheck {
  isActive: boolean;
  subscription: SubscriptionRow | null;
}

/**
 * Server-only source of truth for access control. Reads the caller's own
 * subscription row (RLS-scoped) and evaluates status + expiry — never
 * trusts anything the client claims about its own access.
 */
export async function getActiveSubscription(): Promise<SubscriptionCheck> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { isActive: false, subscription: null };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!subscription) {
    return { isActive: false, subscription: null };
  }

  const notExpired =
    !!subscription.end_date && new Date(subscription.end_date).getTime() > Date.now();

  return {
    isActive: subscription.status === "active" && notExpired,
    subscription: subscription as SubscriptionRow
  };
}
