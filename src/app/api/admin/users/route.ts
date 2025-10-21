import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ADMIN_EMAILS } from "@/defs/admins";

// Use service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user is an admin
    const userEmail = user.email?.toLowerCase() || '';
    const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Fetch all user plans (bypasses RLS because we're using service role)
    const { data: userPlans, error: fetchError } = await supabaseAdmin
      .from('user_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching user plans:', fetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Fetch user details for each plan
    const usersData = await Promise.all(
      userPlans.map(async (plan) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(plan.user_id);

        return {
          id: plan.user_id,
          email: authUser?.user?.email || 'Unknown',
          plan_name: plan.plan_name,
          plan_tier: plan.plan_tier,
          status: plan.status,
          price: plan.price,
          billing_type: plan.billing_type,
          subscription_start: plan.subscription_start,
          subscription_end: plan.subscription_end,
          created_at: plan.created_at,
        };
      })
    );

    return NextResponse.json({ users: usersData });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
