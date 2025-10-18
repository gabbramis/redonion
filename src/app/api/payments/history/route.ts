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

    // Get user's subscription ID from Supabase
    const { data: userPlan } = await supabase
      .from("user_plans")
      .select("subscription_id, user_id")
      .eq("user_id", userId)
      .single();

    if (!userPlan?.subscription_id) {
      return NextResponse.json({
        payments: [],
        message: "No subscription found"
      });
    }

    // Fetch payments from MercadoPago for this subscription
    const searchResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?preapproval_id=${userPlan.subscription_id}&sort=date_created&criteria=desc`,
      {
        headers: {
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!searchResponse.ok) {
      console.error("MercadoPago API error:", await searchResponse.text());
      return NextResponse.json(
        { error: "Failed to fetch payments from MercadoPago" },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

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

    // Transform MercadoPago payment data to our format
    const payments = searchData.results?.map((payment: MercadoPagoPayment) => ({
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
      total: searchData.paging?.total || 0,
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
