import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Admin endpoint to manually activate a subscription
 * Use this to fix subscriptions where the webhook failed
 */
export async function POST(request: Request) {
  try {
    const { preapprovalId, userEmail } = await request.json();

    console.log("🔧 Manual activation requested");
    console.log("📋 Preapproval ID:", preapprovalId);
    console.log("👤 User email:", userEmail);

    // Get subscription details from MercadoPago
    const subscriptionResponse = await fetch(
      `https://api.mercadopago.com/preapproval/${preapprovalId}`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text();
      console.error("❌ Failed to fetch subscription:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch subscription from MercadoPago", details: errorText },
        { status: 400 }
      );
    }

    const subscriptionData = await subscriptionResponse.json();
    console.log("📋 Subscription data:", JSON.stringify(subscriptionData, null, 2));

    // Find user by email
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      console.error("❌ User not found with email:", userEmail);
      return NextResponse.json(
        { error: "User not found. Please create an account first." },
        { status: 404 }
      );
    }

    console.log(`✅ Found user: ${user.id} (${user.email})`);

    // Determine plan tier from preapproval_plan_id
    const planIdMapping: Record<string, string> = {
      'bfa3e0177a4f4d708d024a967c4d62b1': 'test',
      'f01e8dd4a8e447179bb49f232a69d053': 'basico',
      '50d7fb9c86944e91a8e979be18213f2f': 'estandar',
      '0af7a3e5d28c4c008e214fa07abe044f': 'premium',
    };

    const preapprovalPlanId = subscriptionData.preapproval_plan_id;
    const planTier = planIdMapping[preapprovalPlanId];

    if (!planTier) {
      console.error("❌ Unknown preapproval_plan_id:", preapprovalPlanId);
      return NextResponse.json(
        { error: "Unknown plan ID", preapprovalPlanId },
        { status: 400 }
      );
    }

    console.log(`📦 Detected plan: ${planTier}`);

    // Calculate subscription end date
    const frequency = subscriptionData.auto_recurring?.frequency || 1;
    const frequencyType = subscriptionData.auto_recurring?.frequency_type || 'months';
    const endDate = new Date();

    if (frequencyType === 'months') {
      endDate.setMonth(endDate.getMonth() + frequency);
    } else if (frequencyType === 'years') {
      endDate.setFullYear(endDate.getFullYear() + frequency);
    }

    // Plan names
    const planNames: Record<string, string> = {
      // 'test': 'Plan Test', // Commented out - can be enabled in the future
      'basico': 'Plan Básico',
      'estandar': 'Plan Estándar',
      'premium': 'Plan Premium'
    };

    // Get price from subscription data
    const priceUYU = subscriptionData.auto_recurring?.transaction_amount || 0;

    // Create or update user plan
    const planData = {
      user_id: user.id,
      plan_name: planNames[planTier] || planTier,
      plan_tier: planTier,
      billing_type: 'monthly',
      price: priceUYU,
      features: [],
      status: "active",
      subscription_id: preapprovalId,
      subscription_start: new Date().toISOString(),
      subscription_end: endDate.toISOString(),
      billing_frequency: frequency,
      billing_period: frequencyType,
      start_date: new Date().toISOString(),
    };

    console.log("💾 Upserting plan data:", planData);

    const { data: upsertedData, error } = await supabase
      .from("user_plans")
      .upsert(planData, {
        onConflict: "user_id"
      })
      .select();

    if (error) {
      console.error("❌ Error upserting user_plan:", error);
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    console.log(`✅ Subscription manually activated!`);
    console.log(`✅ Upserted data:`, JSON.stringify(upsertedData, null, 2));

    return NextResponse.json({
      success: true,
      message: "Subscription activated successfully",
      user: { id: user.id, email: user.email },
      plan: planData,
      data: upsertedData
    });

  } catch (error) {
    console.error("❌ Manual activation error:", error);
    return NextResponse.json(
      { error: "Manual activation failed", details: String(error) },
      { status: 500 }
    );
  }
}
