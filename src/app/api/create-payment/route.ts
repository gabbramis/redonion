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
    const { planId, planName, price, billing, cart, userId, userEmail } = await request.json();

    console.log(`🔵 Creating payment for user ${userId}, plan ${planId}, billing ${billing}`);

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

    // Create external_reference with format: userId-planId-billing
    const externalReference = `${userId}-${planId}-${billing}`;
    console.log(`📋 External reference: ${externalReference}`);

    const planData = {
      reason: planName,
      external_reference: externalReference,
      payer_email: userEmail,
      auto_recurring: {
        frequency: frequency,
        frequency_type: frequencyType,
        transaction_amount: priceInUYU,
        currency_id: process.env.MP_CURRENCY || "UYU",
      },
      back_url: `${appUrl}/payment/success`,
    };

    console.log("📤 Creating subscription plan:", JSON.stringify(planData, null, 2));

    // Step 1: Create subscription plan in MercadoPago
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

    // Step 2: Create preapproval (subscription) for the user
    const subscriptionData = {
      preapproval_plan_id: planResponseData.id,
      reason: planName,
      external_reference: externalReference,
      payer_email: userEmail,
      back_url: `${appUrl}/payment/success`,
      status: "pending",
    };

    console.log("📤 Creating subscription (preapproval):", JSON.stringify(subscriptionData, null, 2));

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
          mpStatus: subscriptionResponse.status
        },
        { status: subscriptionResponse.status }
      );
    }

    console.log("✅ Subscription created successfully, returning init_point");

    return NextResponse.json({
      preapprovalId: subscriptionResponseData.id,
      initPoint: subscriptionResponseData.init_point,
      sandboxInitPoint: subscriptionResponseData.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Subscription error:", error);
    return NextResponse.json(
      { error: "Error creating subscription" },
      { status: 500 }
    );
  }
}
