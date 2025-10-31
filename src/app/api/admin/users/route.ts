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

    // Check if requesting a specific user by ID
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    // If userId is provided, fetch single user
    if (userId) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Fetch user plan
      const { data: userPlan } = await supabaseAdmin
        .from('user_plans')
        .select('*')
        .eq('user_id', userId)
        .single();

      const singleUserData = {
        id: userData.user.id,
        email: userData.user.email || 'Unknown',
        full_name: userData.user.user_metadata?.full_name || null,
        created_at: userData.user.created_at,
        last_sign_in_at: userData.user.last_sign_in_at,
        plan_name: userPlan?.plan_name || null,
        plan_tier: userPlan?.plan_tier || null,
        status: userPlan?.status || 'no_plan',
        price: userPlan?.price || null,
        billing_type: userPlan?.billing_type || null,
        subscription_start: userPlan?.subscription_start || null,
        subscription_end: userPlan?.subscription_end || null,
      };

      return NextResponse.json({ user: singleUserData });
    }

    // Otherwise, fetch all users (existing logic)
    // Fetch all registered users from auth.users
    const { data: authData, error: authFetchError } = await supabaseAdmin.auth.admin.listUsers();

    if (authFetchError) {
      console.error('Error fetching users:', authFetchError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Filter out admin users
    const nonAdminUsers = authData.users.filter(u => {
      const userEmail = u.email?.toLowerCase() || '';
      return !ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);
    });

    // Fetch all user plans
    const { data: userPlans } = await supabaseAdmin
      .from('user_plans')
      .select('*');

    // Create a map of user_id to plan data for quick lookup
    const plansByUserId = new Map();
    if (userPlans) {
      userPlans.forEach(plan => {
        plansByUserId.set(plan.user_id, plan);
      });
    }

    // Combine user data with plan data
    const usersData = nonAdminUsers.map(user => {
      const plan = plansByUserId.get(user.id);

      return {
        id: user.id,
        email: user.email || 'Unknown',
        full_name: user.user_metadata?.full_name || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        // Plan data (if exists)
        plan_name: plan?.plan_name || null,
        plan_tier: plan?.plan_tier || null,
        status: plan?.status || 'no_plan',
        price: plan?.price || null,
        billing_type: plan?.billing_type || null,
        subscription_start: plan?.subscription_start || null,
        subscription_end: plan?.subscription_end || null,
      };
    });

    // Sort by creation date (newest first)
    usersData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ users: usersData });
  } catch (error) {
    console.error("Admin API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
