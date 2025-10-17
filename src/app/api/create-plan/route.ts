import { NextResponse } from "next/server";
import { convertUSDtoUYU } from "@/lib/currency";

export async function POST(request: Request) {
  try {
    const { planId, planName, price, billing } = await request.json();

    console.log(`💵 Converting $${price} USD to UYU (${billing} billing)...`);
    const priceInUYU = await convertUSDtoUYU(price);
    console.log(`💵 Converted: $${price} USD = $${priceInUYU} UYU`);

    // Calculate subscription frequency
    const frequency = billing === "annual" ? 12 : 1;
    const frequencyType = "months";

    // Create plan using direct API call with UYU pricing
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

    const response = await fetch("https://api.mercadopago.com/preapproval_plan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(planData),
    });

    const responseData = await response.json();

    console.log("📥 MercadoPago plan response:", JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error("❌ MercadoPago plan error:", responseData);
      return NextResponse.json(
        { error: "Error creating plan", details: responseData },
        { status: response.status }
      );
    }

    return NextResponse.json({
      planId: responseData.id,
      status: responseData.status,
    });
  } catch (error) {
    console.error("❌ Plan creation error:", error);
    return NextResponse.json(
      { error: "Error creating plan" },
      { status: 500 }
    );
  }
}
