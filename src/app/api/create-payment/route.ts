import { NextResponse } from "next/server";
import { convertUSDtoUYU } from "@/lib/currency";

export async function POST(request: Request) {
  try {
    const { planId, planName, price, userId, userEmail, billing } = await request.json();

    // For annual billing, multiply by 12 to get the yearly total
    const totalPrice = billing === "annual" ? price * 12 : price;
    const frequency = billing === "annual" ? 12 : 1;
    const frequencyType = "months";

    console.log(`💵 Converting $${totalPrice} USD to UYU (${billing} billing, frequency: ${frequency} ${frequencyType})...`);
    const priceInUYU = await convertUSDtoUYU(totalPrice);
    console.log(`💵 Converted: $${totalPrice} USD = $${priceInUYU} UYU`);

    // Remove trailing slash from app URL to avoid double slashes
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

    // Step 1: Create the subscription plan
    const planData = {
      reason: planName,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: priceInUYU,
        currency_id: process.env.MP_CURRENCY || "UYU",
      },
      back_url: `${appUrl}/payment/success`,
    };

    console.log("📤 Creating plan:", JSON.stringify(planData, null, 2));

    const planResponse = await fetch("https://api.mercadopago.com/preapproval_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(planData),
    });

    const planResponseData = await planResponse.json();
    console.log("📥 MercadoPago plan response:", JSON.stringify(planResponseData, null, 2));

    if (!planResponse.ok) {
      console.error("❌ MercadoPago plan error:", planResponseData);
      return NextResponse.json(
        {
          error: "Error creating plan",
          details: planResponseData,
        },
        { status: planResponse.status }
      );
    }

    // Step 2: Create subscription with the plan and user reference
    const subscriptionData = {
      reason: planName,
      external_reference: `${userId}-${planId}`, // Format: userId-planTier for webhook processing
      payer_email: userEmail,
      preapproval_plan_id: planResponseData.id,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: priceInUYU,
        currency_id: process.env.MP_CURRENCY || "UYU",
      },
      back_url: `${appUrl}/payment/success`,
      status: "pending",
    };

    console.log("📤 Creating subscription:", JSON.stringify(subscriptionData, null, 2));

    const subscriptionResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const subscriptionResponseData = await subscriptionResponse.json();
    console.log("📥 MercadoPago subscription response:", JSON.stringify(subscriptionResponseData, null, 2));

    if (!subscriptionResponse.ok) {
      console.error("❌ MercadoPago subscription error:", subscriptionResponseData);
      return NextResponse.json(
        {
          error: "Error creating subscription",
          details: subscriptionResponseData,
        },
        { status: subscriptionResponse.status }
      );
    }

    console.log("✅ Subscription created successfully, returning init_point");

    return NextResponse.json({
      preapprovalId: subscriptionResponseData.id,
      initPoint: subscriptionResponseData.init_point,
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Error creating subscription" },
      { status: 500 }
    );
  }
}
