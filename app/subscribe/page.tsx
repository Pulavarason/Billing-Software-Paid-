import { redirect } from "next/navigation";
import { Soup } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import SubscribeClient from "./SubscribeClient";
import SignOutButton from "@/components/SignOutButton";

export default async function SubscribePage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, end_date")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let expiredMessage: string | undefined;
  if (subscription?.status === "active" && subscription.end_date) {
    if (new Date(subscription.end_date).getTime() <= Date.now()) {
      expiredMessage = "Your subscription has expired. Renew your plan to continue using Billing Software.";
    }
  } else if (subscription && subscription.status !== "active") {
    expiredMessage = "Your subscription is not active. Choose a plan to continue.";
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] px-4 py-12">
      <div className="mx-auto mb-2 flex max-w-4xl justify-end">
        <SignOutButton />
      </div>
      <div className="mx-auto mb-10 flex max-w-4xl flex-col items-center text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-spice-600 text-white shadow-soft">
          <Soup className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--text))]">
          Billing Software
        </h1>
        <p className="mt-2 text-sm text-[rgb(var(--text-muted))]">Choose a plan to continue</p>
      </div>

      <SubscribeClient userEmail={user.email ?? ""} expiredMessage={expiredMessage} />
    </div>
  );
}
