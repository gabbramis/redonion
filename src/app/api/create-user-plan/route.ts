import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('🔔 API Route /api/create-user-plan called');
    console.log('🔑 Service role key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('🔑 Service role key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.log('🌐 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { userId, email } = await request.json();

    console.log('📝 API: Creating user_plans entry for user:', userId, email);

    if (!userId) {
      console.error('❌ No userId provided');
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if user_plans entry already exists
    console.log('🔍 Checking if user already has a plan...');
    const { data: existingPlan, error: checkError } = await supabaseAdmin
      .from('user_plans')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing plan:', checkError);
    }

    if (existingPlan) {
      console.log('ℹ️ User already has a plan:', existingPlan);
      return NextResponse.json({ message: "User plan already exists", plan: existingPlan });
    }

    console.log('✨ No existing plan found, creating new one...');

    // Create new user_plans entry
    const { data: newPlan, error: planError } = await supabaseAdmin
      .from('user_plans')
      .insert({
        user_id: userId,
        plan_name: 'Sin Plan',
        plan_tier: null, // Changed from 'none' to null to avoid constraint violation
        billing_type: 'monthly',
        price: 0,
        features: [],
        status: 'pending',
        subscription_id: null,
        subscription_start: null,
        subscription_end: null,
        billing_frequency: 1,
        billing_period: 'months',
        start_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (planError) {
      console.error('❌ Error creating user_plans entry:', planError);
      console.error('❌ Error code:', planError.code);
      console.error('❌ Error message:', planError.message);
      console.error('❌ Error details:', JSON.stringify(planError, null, 2));
      return NextResponse.json({ error: "Failed to create user plan", details: planError }, { status: 500 });
    }

    console.log('✅ User_plans entry created successfully!');
    console.log('✅ New plan data:', JSON.stringify(newPlan, null, 2));
    return NextResponse.json({ message: "User plan created", plan: newPlan });
  } catch (error) {
    console.error("❌ API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
