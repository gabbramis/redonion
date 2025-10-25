import { NextResponse } from "next/server";
import { convertUSDtoUYU } from "@/lib/currency";

interface CartItem {
  type: "plan" | "extra";
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
}

export async function POST(request: Request) {
  try {
    const { planName, price, billing, cart } = await request.json();

    // Calculate total price including extras from cart
    let totalPrice = 0;
    if (cart && Array.isArray(cart)) {
      // Sum up all items in cart
      totalPrice = cart.reduce((sum: number, item: CartItem) => {
        // For annual plans, don't multiply here as it's already the monthly rate
        return sum + item.price;
      }, 0);

      // For annual billing, multiply by 12 to get the yearly total
      if (billing === "annual") {
        totalPrice = totalPrice * 12;
      }
    } else {
      // Fallback to old behavior if cart is not provided
      totalPrice = billing === "annual" ? price * 12 : price;
    }

    const frequency = billing === "annual" ? 12 : 1;
    const frequencyType = "months";

    console.log(`💵 Converting $${totalPrice} USD to UYU (${billing} billing, frequency: ${frequency} ${frequencyType})...`);
    console.log(`🛒 Cart items:`, cart);
    const priceInUYU = await convertUSDtoUYU(totalPrice);
    console.log(`💵 Converted: $${totalPrice} USD = $${priceInUYU} UYU`);

    // Remove trailing slash from app URL to avoid double slashes
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

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
    console.log("📊 Plan status:", planResponseData.status);
    console.log("📊 Plan collector_id:", planResponseData.collector_id);
    console.log("📊 Plan reason:", planResponseData.reason);

    if (!planResponse.ok) {
      console.error("❌ MercadoPago plan error:", planResponseData);
      console.error("❌ Full request data was:", planData);
      return NextResponse.json(
        {
          error: "Error creating plan",
          details: planResponseData,
          requestData: planData,
          mpStatus: planResponse.status
        },
        { status: planResponse.status }
      );
    }

    // Step 4: Return the plan's init_point for user to subscribe
    // The plan itself has an init_point that redirects users to subscribe

    console.log("✅ Plan created successfully");
    console.log("📋 Plan ID:", planResponseData.id);
    console.log("🔗 Init Point:", planResponseData.init_point);
    console.log("🔗 Sandbox Init Point:", planResponseData.sandbox_init_point);

    return NextResponse.json({
      preapprovalPlanId: planResponseData.id,
      initPoint: planResponseData.init_point || planResponseData.sandbox_init_point,
      sandboxInitPoint: planResponseData.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Error creating subscription" },
      { status: 500 }
    );
  }
}
