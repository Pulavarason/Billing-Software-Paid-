import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRazorpayClient } from "@/lib/razorpay";
import { isPlanId, PLANS } from "@/lib/plans";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const planId = body?.plan;

  if (typeof planId !== "string" || !isPlanId(planId)) {
    return NextResponse.json({ error: "Invalid plan selected." }, { status: 400 });
  }

  const plan = PLANS[planId];
  const amountPaise = plan.amountInr * 100;

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `skm_${planId}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: { user_id: user.id, plan: planId }
    });

    // Record a pending subscription row server-side (service role — RLS
    // blocks users from writing their own subscription rows). The order id
    // ties this row to the payment we're about to verify.
    const admin = createAdminClient();
    const { error: dbError } = await admin.from("subscriptions").insert({
      user_id: user.id,
      user_email: user.email,
      razorpay_order_id: order.id,
      plan: planId,
      status: "pending",
      amount: plan.amountInr
    });

    if (dbError) {
      return NextResponse.json({ error: "Could not create subscription record." }, { status: 500 });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      plan: planId
    });
  } catch (err) {
    console.error("Razorpay order creation failed", err);
    return NextResponse.json({ error: "Could not start payment." }, { status: 500 });
  }
}
