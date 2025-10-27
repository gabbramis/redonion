import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's plan from Supabase
    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (planError || !userPlan) {
      return NextResponse.json({
        subscription: null,
        message: "No active plan found"
      });
    }

    // Note: subscription_id now stores payment_id for one-time payments
    // We keep the field name for backward compatibility with existing data
    let mpPayment = null;
    if (userPlan.subscription_id) {
      // Try to fetch as payment first (one-time payments)
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${userPlan.subscription_id}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (paymentResponse.ok) {
        mpPayment = await paymentResponse.json();
      } else {
        // Fallback: try as subscription for legacy data
        const subResponse = await fetch(
          `https://api.mercadopago.com/preapproval/${userPlan.subscription_id}`,
          {
            headers: {
              "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (subResponse.ok) {
          mpPayment = await subResponse.json();
        }
      }
    }

    // Combine data from Supabase and MercadoPago
    const subscription = {
      id: userPlan.subscription_id,
      planName: userPlan.plan_name,
      planTier: userPlan.plan_tier,
      billingType: userPlan.billing_type,
      price: userPlan.price,
      currency: mpPayment?.currency_id || mpPayment?.auto_recurring?.currency_id || "UYU",
      status: userPlan.status,
      subscriptionStart: userPlan.subscription_start,
      subscriptionEnd: userPlan.subscription_end,
      billingFrequency: userPlan.billing_frequency,
      billingPeriod: userPlan.billing_period,
      nextBillingDate: mpPayment?.next_payment_date || null,
      features: userPlan.features || [],
      mpStatus: mpPayment?.status || null,
      mpReason: mpPayment?.reason || mpPayment?.description || null,
    };

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error("Error fetching subscription details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
