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
        message: "No active subscription found"
      });
    }

    // If there's a subscription_id, fetch details from MercadoPago
    let mpSubscription = null;
    if (userPlan.subscription_id) {
      const mpResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${userPlan.subscription_id}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (mpResponse.ok) {
        mpSubscription = await mpResponse.json();
      }
    }

    // Combine data from Supabase and MercadoPago
    const subscription = {
      id: userPlan.subscription_id,
      planName: userPlan.plan_name,
      planTier: userPlan.plan_tier,
      billingType: userPlan.billing_type,
      price: userPlan.price,
      currency: mpSubscription?.auto_recurring?.currency_id || "UYU",
      status: userPlan.status,
      subscriptionStart: userPlan.subscription_start,
      subscriptionEnd: userPlan.subscription_end,
      billingFrequency: userPlan.billing_frequency,
      billingPeriod: userPlan.billing_period,
      nextBillingDate: mpSubscription?.next_payment_date || null,
      features: userPlan.features || [],
      mpStatus: mpSubscription?.status || null,
      mpReason: mpSubscription?.reason || null,
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
