/**
 * Currency conversion utilities with fallback exchange rate sources
 */

export interface ExchangeRateResponse {
  ratio: number;
  invRatio?: number;
  from: string;
  to: string;
}

/**
 * Fetches the real-time exchange rate from exchangerate-api.com (free tier)
 * @param from - Source currency (e.g., "USD")
 * @param to - Target currency (e.g., "UYU")
 * @returns Exchange rate data
 */
async function getExchangeRateFromAPI(
  from: string = "USD",
  to: string = "UYU"
): Promise<ExchangeRateResponse> {
  try {
    // Using exchangerate-api.com free tier (1,500 requests/month)
    const url = `https://api.exchangerate-api.com/v4/latest/${from}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();
    const rate = data.rates[to];

    if (!rate) {
      throw new Error(`Currency ${to} not found in exchange rates`);
    }

    return {
      ratio: rate,
      invRatio: 1 / rate,
      from,
      to,
    };
  } catch (error) {
    console.error("Error fetching exchange rate from API:", error);
    throw error;
  }
}

/**
 * Fetches the real-time exchange rate with fallback to fixed rate
 * @param from - Source currency (e.g., "USD")
 * @param to - Target currency (e.g., "UYU")
 * @returns Exchange rate data
 */
export async function getExchangeRate(
  from: string = "USD",
  to: string = "UYU"
): Promise<ExchangeRateResponse> {
  try {
    // Try to get real-time rate from free API
    return await getExchangeRateFromAPI(from, to);
  } catch (error) {
    console.error("Failed to fetch real-time exchange rate, using fallback rate");

    // Fallback to approximate rate (update this periodically)
    // Current approximate rate: 1 USD = 43.5 UYU (as of January 2025)
    const fallbackRate = 43.5;

    console.warn(`⚠️ Using fallback exchange rate: 1 ${from} = ${fallbackRate} ${to}`);

    return {
      ratio: fallbackRate,
      invRatio: 1 / fallbackRate,
      from,
      to,
    };
  }
}

/**
 * Converts USD amount to UYU using MercadoPago's real-time exchange rate
 * @param usdAmount - Amount in USD
 * @returns Amount in UYU (rounded to 2 decimal places)
 */
export async function convertUSDtoUYU(usdAmount: number): Promise<number> {
  const exchangeData = await getExchangeRate("USD", "UYU");
  const uyuAmount = usdAmount * exchangeData.ratio;

  // Round to 2 decimal places
  return Math.round(uyuAmount * 100) / 100;
}

/**
 * Converts UYU amount to USD using MercadoPago's real-time exchange rate
 * @param uyuAmount - Amount in UYU
 * @returns Amount in USD (rounded to 2 decimal places)
 */
export async function convertUYUtoUSD(uyuAmount: number): Promise<number> {
  const exchangeData = await getExchangeRate("USD", "UYU");
  const usdAmount = uyuAmount * (exchangeData.invRatio || 1 / exchangeData.ratio);

  // Round to 2 decimal places
  return Math.round(usdAmount * 100) / 100;
}
