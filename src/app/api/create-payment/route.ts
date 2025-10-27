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

    console.log(`💵 Converting $${totalPrice} USD to UYU (${billing} billing)...`);
    console.log(`🛒 Cart items:`, cart);
    const priceInUYU = await convertUSDtoUYU(totalPrice);
    console.log(`💵 Converted: $${totalPrice} USD = $${priceInUYU} UYU`);

    // Remove trailing slash from app URL to avoid double slashes
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '');

    // Create external reference for webhook tracking
    const externalReference = `${userId}-${planId}-${billing}`;

    // Create a one-time payment preference
    const preferenceData = {
      items: [
        {
          title: planName,
          description: `${planName} - ${billing === "annual" ? "Pago anual" : "Pago mensual"}`,
          quantity: 1,
          unit_price: priceInUYU,
          currency_id: process.env.MP_CURRENCY || "UYU",
        }
      ],
      external_reference: externalReference,
      payer: {
        email: userEmail,
      },
      back_urls: {
        success: `${appUrl}/payment/success`,
        failure: `${appUrl}/payment/failure`,
        pending: `${appUrl}/payment/pending`,
      },
      auto_return: "approved",
      statement_descriptor: "RedOnion Marketing",
    };

    console.log("📤 Creating one-time payment preference:", JSON.stringify(preferenceData, null, 2));

    // Create payment preference using /checkout/preferences endpoint
    const preferenceResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    });

    const preferenceResponseData = await preferenceResponse.json();
    console.log("📥 MercadoPago preference response:", JSON.stringify(preferenceResponseData, null, 2));

    if (!preferenceResponse.ok) {
      console.error("❌ MercadoPago preference error:", preferenceResponseData);
      console.error("❌ Full request data was:", preferenceData);
      return NextResponse.json(
        {
          error: "Error creating payment",
          details: preferenceResponseData,
          requestData: preferenceData,
          mpStatus: preferenceResponse.status
        },
        { status: preferenceResponse.status }
      );
    }

    console.log("✅ Payment preference created successfully");
    console.log("🔗 Init Point:", preferenceResponseData.init_point);

    return NextResponse.json({
      preferenceId: preferenceResponseData.id,
      initPoint: preferenceResponseData.init_point,
      sandboxInitPoint: preferenceResponseData.sandbox_init_point,
    });
  } catch (error) {
    console.error("❌ Payment error:", error);
    return NextResponse.json(
      { error: "Error creating payment" },
      { status: 500 }
    );
  }
}