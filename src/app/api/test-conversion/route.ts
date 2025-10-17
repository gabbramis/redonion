import { NextResponse } from "next/server";
import { convertUSDtoUYU, getExchangeRate } from "@/lib/currency";

export async function GET() {
  try {
    // Test conversion
    const testAmountUSD = 149;

    console.log(`\n🧪 Testing USD to UYU conversion...`);
    console.log(`💵 Input: $${testAmountUSD} USD`);

    // Get exchange rate
    const exchangeRate = await getExchangeRate("USD", "UYU");
    console.log(`📊 Exchange rate: 1 USD = ${exchangeRate.ratio} UYU`);

    // Convert amount
    const amountInUYU = await convertUSDtoUYU(testAmountUSD);
    console.log(`💵 Output: $${amountInUYU} UYU`);

    return NextResponse.json({
      success: true,
      input: {
        amount: testAmountUSD,
        currency: "USD"
      },
      exchangeRate: {
        rate: exchangeRate.ratio,
        source: "exchangerate-api.com"
      },
      output: {
        amount: amountInUYU,
        currency: "UYU"
      },
      message: `Successfully converted $${testAmountUSD} USD to $${amountInUYU} UYU`
    });
  } catch (error) {
    console.error("❌ Conversion test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
