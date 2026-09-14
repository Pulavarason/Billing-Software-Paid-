import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanId, PLANS, addMonthsIso } from "@/lib/plans";

/**
 * Server-to-server Razorpay webhook. This is the authoritative fallback for
 * activation/expiry/cancellation — it never depends on the customer's
 * browser being open or honest. Configure this URL + RAZORPAY_WEBHOOK_SECRET
 * in the Razorpay dashboard (Settings → Webhooks).
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload?.event as string | undefined;
  const admin = createAdminClient();

  const orderId: string | undefined =
    payload?.payload?.payment?.entity?.order_id ?? payload?.payload?.order?.entity?.id;
  const paymentId: string | undefined = payload?.payload?.payment?.entity?.id;

  if (!orderId) {
    // Not an event we track (e.g. account-level events) — acknowledge and skip.
    return NextResponse.json({ received: true });
  }

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("razorpay_order_id", orderId)
    .maybeSingle();

  const planId: string | undefined = subscription?.plan;

  if (!subscription || !planId || !isPlanId(planId)) {
    return NextResponse.json({ received: true });
  }

  if (event === "payment.captured" || event === "order.paid") {
    if (subscription.status !== "active") {
      const startDate = new Date().toISOString();
      const endDate = addMonthsIso(startDate, PLANS[planId].durationMonths);
      await admin
        .from("subscriptions")
        .update({
          status: "active",
          razorpay_payment_id: paymentId ?? subscription.razorpay_payment_id,
          start_date: startDate,
          end_date: endDate,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);
    }
  } else if (event === "payment.failed") {
    await admin
      .from("subscriptions")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", subscription.id);
  }

  return NextResponse.json({ received: true });
}
