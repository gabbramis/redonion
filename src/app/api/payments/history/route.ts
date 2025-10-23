import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface MercadoPagoPayment {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  date_created: string;
  date_approved: string | null;
  description: string;
  payment_method_id: string;
  payment_type_id: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`💳 Fetching payment history for user: ${userId}`);

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's plan from Supabase
    const { data: userPlan, error: planError } = await supabase
      .from("user_plans")
      .select("subscription_id, user_id")
      .eq("user_id", userId)
      .single();

    if (planError) {
      console.log(`⚠️ No plan found for user ${userId}:`, planError.message);
    }

    if (!userPlan) {
      return NextResponse.json({
        payments: [],
        message: "No plan found for this user"
      });
    }

    console.log(`📋 User plan found. Subscription ID: ${userPlan.subscription_id || 'none'}`);

    let allPayments: MercadoPagoPayment[] = [];

    // Try to fetch payments using multiple methods:

    // Method 1: If there's a subscription_id, fetch payments by preapproval_id (subscription)
    if (userPlan.subscription_id) {
      try {
        const subscriptionResponse = await fetch(
          `https://api.mercadopago.com/v1/payments/search?preapproval_id=${userPlan.subscription_id}&sort=date_created&criteria=desc`,
          {
            headers: {
              "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          if (subscriptionData.results) {
            allPayments = [...allPayments, ...subscriptionData.results];
          }
        }
      } catch (err) {
        console.error("Error fetching subscription payments:", err);
      }
    }

    // Method 2: Search by external_reference (userId-planId-billing)
    // This catches one-time payments that use the userId in external_reference
    try {
      const externalRefResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=${userId}&sort=date_created&criteria=desc`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (externalRefResponse.ok) {
        const externalRefData = await externalRefResponse.json();
        if (externalRefData.results) {
          // Filter out duplicates based on payment ID
          const existingIds = new Set(allPayments.map((p) => p.id));
          const newPayments = (externalRefData.results as MercadoPagoPayment[]).filter((p) => !existingIds.has(p.id));
          allPayments = [...allPayments, ...newPayments];
        }
      }
    } catch (err) {
      console.error("Error fetching payments by external reference:", err);
    }

    // Sort by date created (most recent first)
    allPayments.sort((a, b) =>
      new Date(b.date_created).getTime() - new Date(a.date_created).getTime()
    );

    console.log(`✅ Found ${allPayments.length} total payments for user ${userId}`);

    const searchData = { results: allPayments };

    // Transform MercadoPago payment data to our format
    const payments = searchData.results?.map((payment) => ({
      id: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      dateCreated: payment.date_created,
      dateApproved: payment.date_approved,
      description: payment.description,
      paymentMethod: payment.payment_method_id,
      paymentType: payment.payment_type_id,
    })) || [];

    return NextResponse.json({
      payments,
      total: payments.length,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
