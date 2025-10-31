import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Admin endpoint to toggle subscription status (activate/deactivate)
 * No MercadoPago ID required - just manually toggle the status
 */
export async function POST(request: Request) {
  try {
    const { userEmail, action, planTier, billingType } = await request.json();


    if (!action || !["activate", "deactivate"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'activate' or 'deactivate'" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: authData } = await supabase.auth.admin.listUsers();
    const user = authData?.users?.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());

    if (!user) {
      console.error("❌ User not found with email:", userEmail);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }


    // Plan configuration
    const planConfigs: Record<string, { name: string; price: number; annualPrice: number }> = {
      // test: { name: "Plan Test", price: 0.40, annualPrice: 0.40 }, // Commented out - can be enabled in the future
      basico: { name: "Plan Básico", price: 149, annualPrice: 126.65 },
      estandar: { name: "Plan Estándar", price: 249, annualPrice: 211.65 },
      premium: { name: "Plan Premium", price: 649, annualPrice: 551.65 },
    };

    const selectedPlan = planConfigs[planTier || "basico"];
    const billing = billingType || "monthly";
    const price = billing === "annual" ? selectedPlan.annualPrice : selectedPlan.price;
    const billingFrequency = billing === "annual" ? 12 : 1;
    const daysToAdd = billing === "annual" ? 365 : 30;

    if (action === "activate") {
      // Check if user already has a plan
      const { data: existingPlan } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (existingPlan) {
        // Update existing plan to active with selected plan
        const { data: updatedData, error } = await supabase
          .from("user_plans")
          .update({
            plan_name: selectedPlan.name,
            plan_tier: planTier || "basico",
            billing_type: billing,
            price: price,
            status: "active",
            billing_frequency: billingFrequency,
            billing_period: billing === "annual" ? "years" : "months",
            subscription_start: new Date().toISOString(),
            subscription_end: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString(),
          })
          .eq("user_id", user.id)
          .select();

        if (error) {
          console.error("❌ Error updating subscription:", error);
          return NextResponse.json(
            { error: "Database error", details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Subscription activated successfully",
          user: { id: user.id, email: user.email },
          data: updatedData
        });
      } else {
        // Create a new plan for the user with selected plan
        const planData = {
          user_id: user.id,
          plan_name: selectedPlan.name,
          plan_tier: planTier || "basico",
          billing_type: billing,
          price: price,
          features: [],
          status: "active",
          subscription_id: `manual-${Date.now()}`,
          subscription_start: new Date().toISOString(),
          subscription_end: new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString(),
          billing_frequency: billingFrequency,
          billing_period: billing === "annual" ? "years" : "months",
          start_date: new Date().toISOString(),
        };

        const { data: createdData, error } = await supabase
          .from("user_plans")
          .insert(planData)
          .select();

        if (error) {
          console.error("❌ Error creating subscription:", error);
          return NextResponse.json(
            { error: "Database error", details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Subscription created and activated successfully",
          user: { id: user.id, email: user.email },
          data: createdData
        });
      }
    } else if (action === "deactivate") {
      // Deactivate subscription
      const { data: updatedData, error } = await supabase
        .from("user_plans")
        .update({
          status: "inactive",
        })
        .eq("user_id", user.id)
        .select();

      if (error) {
        console.error("❌ Error deactivating subscription:", error);
        return NextResponse.json(
          { error: "Database error", details: error.message },
          { status: 500 }
        );
      }

      if (!updatedData || updatedData.length === 0) {
        return NextResponse.json(
          { error: "No subscription found for this user" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Subscription deactivated successfully",
        user: { id: user.id, email: user.email },
        data: updatedData
      });
    }

  } catch (error) {
    console.error("❌ Toggle subscription error:", error);
    return NextResponse.json(
      { error: "Operation failed", details: String(error) },
      { status: 500 }
    );
  }
}
