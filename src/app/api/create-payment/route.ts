import { NextResponse } from "next/server";
import { convertUSDtoUYU } from "@/lib/currency";

export async function POST(request: Request) {
  try {
    const { planId, planName, price, userId, userEmail, billing } = await request.json();

    // Step 1: Calculate the correct amount based on billing type
    // For annual billing: price is monthly, so multiply by 12 for the annual total
    // For monthly billing: price is already correct
    const totalPrice = billing === "annual" ? price * 12 : price;

    console.log(`💵 Converting $${totalPrice} USD to UYU (${billing} billing)...`);
    const priceInUYU = await convertUSDtoUYU(totalPrice);
    console.log(`💵 Converted: $${totalPrice} USD = $${priceInUYU} UYU`);

    // Step 2: Create a plan with UYU pricing
    const frequency = billing === "annual" ? 12 : 1;
    const frequencyType = "months";

    const planData = {
      reason: planName,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: priceInUYU,
        currency_id: process.env.MP_CURRENCY || "UYU",
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
    };

    console.log("📤 Creating plan:", JSON.stringify(planData, null, 2));

    // Step 3: Create plan in MercadoPago
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
        { error: "Error creating plan", details: planResponseData },
        { status: planResponse.status }
      );
    }

    // Step 4: Return the plan's init_point for user to subscribe
    // The plan itself has an init_point that redirects users to subscribe

    console.log("✅ Plan created successfully, returning init_point");

    return NextResponse.json({
      preapprovalPlanId: planResponseData.id,
      initPoint: planResponseData.init_point,
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Error creating subscription" },
      { status: 500 }
    );
  }
}
