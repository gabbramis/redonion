import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Admin endpoint to manually deactivate a subscription
 */
export async function POST(request: Request) {
  try {
    const { userEmail } = await request.json();

    console.log("🔧 Manual deactivation requested");
    console.log("👤 User email:", userEmail);

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

    console.log(`✅ Found user: ${user.id} (${user.email})`);

    // Update user plan to inactive
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

    console.log(`✅ Subscription deactivated!`);
    console.log(`✅ Updated data:`, JSON.stringify(updatedData, null, 2));

    return NextResponse.json({
      success: true,
      message: "Subscription deactivated successfully",
      user: { id: user.id, email: user.email },
      data: updatedData
    });

  } catch (error) {
    console.error("❌ Manual deactivation error:", error);
    return NextResponse.json(
      { error: "Manual deactivation failed", details: String(error) },
      { status: 500 }
    );
  }
}
