import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPlanId, PLANS, addMonthsIso } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body ?? {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing payment details." }, { status: 400 });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
  }

  // This is the cryptographic check that actually authorizes activation —
  // the browser's "payment successful" callback alone is never trusted.
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: "Payment verification failed." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pending, error: fetchError } = await admin
    .from("subscriptions")
    .select("*")
    .eq("razorpay_order_id", razorpay_order_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const planId: string | undefined = pending?.plan;

  if (fetchError || !pending || !planId || !isPlanId(planId)) {
    return NextResponse.json({ error: "Subscription record not found." }, { status: 404 });
  }

  // Renewals purchased before expiry extend from the existing end date rather
  // than discarding the customer's remaining paid time.
  const { data: currentSubscription } = await admin
    .from("subscriptions")
    .select("end_date")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gt("end_date", new Date().toISOString())
    .order("end_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const startDate = currentSubscription?.end_date ?? new Date().toISOString();
  const endDate = addMonthsIso(startDate, PLANS[planId].durationMonths);

  const { error: updateError } = await admin
    .from("subscriptions")
    .update({
      status: "active",
      razorpay_payment_id,
      start_date: startDate,
      end_date: endDate,
      updated_at: new Date().toISOString()
    })
    .eq("id", pending.id);

  if (updateError) {
    return NextResponse.json({ error: "Could not activate subscription." }, { status: 500 });
  }

  return NextResponse.json({
    status: "active",
    plan: pending.plan,
    endDate
  });
}
