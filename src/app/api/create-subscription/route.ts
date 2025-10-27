import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { planId, preapprovalPlanId, userId, userEmail, billing } = await request.json();

    console.log("🔄 Creating subscription with plan:", preapprovalPlanId);
    console.log("👤 User:", userId, userEmail);

    // Create external reference for webhook tracking
    const externalReference = `${userId}-${planId}-${billing}`;

    // Remove trailing slash from app URL
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

    // Create a preapproval subscription with the plan ID
    const subscriptionData = {
      reason: `Suscripción ${planId}`,
      external_reference: externalReference,
      payer_email: userEmail,
      preapproval_plan_id: preapprovalPlanId,
      card_token_id: "", // User will enter card details in checkout
      back_url: `${appUrl}/payment/success`,
      status: "pending",
    };

    console.log("📤 Creating subscription:", JSON.stringify(subscriptionData, null, 2));

    const response = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const responseData = await response.json();
    console.log("📥 MercadoPago subscription response:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("❌ MercadoPago subscription error:", responseData);
      return NextResponse.json(
        {
          error: "Error creating subscription",
          details: responseData,
          requestData: subscriptionData,
          mpStatus: response.status
        },
        { status: response.status }
      );
    }

    console.log("✅ Subscription created successfully");
    console.log("🔗 Init Point:", responseData.init_point);

    return NextResponse.json({
      subscriptionId: responseData.id,
      initPoint: responseData.init_point,
      sandboxInitPoint: responseData.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Error creating subscription" },
      { status: 500 }
    );
  }
}
