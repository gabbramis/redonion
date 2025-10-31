import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/defs/admins";

// Use service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, planTier, billingType } = body;

    if (!userId || !planTier || !billingType) {
      return NextResponse.json(
        { error: "Missing required fields: userId, planTier, billingType" },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is an admin
    const userEmail = user.email?.toLowerCase() || "";
    const isAdmin = ADMIN_EMAILS.some(
      (email) => email.toLowerCase() === userEmail
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    // Plan configuration
    const planConfigs: Record<
      string,
      { name: string; price: number; annualPrice: number }
    > = {
      // test: { name: "Plan Test", price: 0.4, annualPrice: 0.4 }, // Commented out - can be enabled in the future
      basico: { name: "Plan Básico", price: 149, annualPrice: 126.65 },
      estandar: { name: "Plan Estándar", price: 249, annualPrice: 211.65 },
      premium: { name: "Plan Premium", price: 649, annualPrice: 551.65 },
    };

    const selectedPlan = planConfigs[planTier];
    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    const price =
      billingType === "annual" ? selectedPlan.annualPrice : selectedPlan.price;

    // Find the active plan for this user
    const { data: existingPlan, error: fetchError } = await supabaseAdmin
      .from("user_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: "No active plan found for this user" },
        { status: 404 }
      );
    }

    // Update the existing plan
    const { data: updatedPlan, error: updateError } = await supabaseAdmin
      .from("user_plans")
      .update({
        plan_name: selectedPlan.name,
        plan_tier: planTier,
        billing_type: billingType,
        price: price,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingPlan.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Plan updated successfully",
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Update plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
