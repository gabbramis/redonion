/**
 * Mercado Pago Subscription Plan Configuration
 * Maps internal plan IDs to MercadoPago preapproval_plan_id values
 */

export interface MPSubscriptionPlan {
  planId: string;
  planName: string;
  preapprovalPlanId: string;
  billing: "monthly" | "annual";
  checkoutUrl: string;
}

export const MP_SUBSCRIPTION_PLANS: Record<string, MPSubscriptionPlan> = {
  // Monthly plans
  // Commented out - can be enabled in the future
  // "test-monthly": {
  //   planId: "test",
  //   planName: "Plan Test",
  //   preapprovalPlanId: "bfa3e0177a4f4d708d024a967c4d62b1",
  //   billing: "monthly",
  //   checkoutUrl: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=bfa3e0177a4f4d708d024a967c4d62b1",
  // },
  "basico-monthly": {
    planId: "basico",
    planName: "Plan Básico",
    preapprovalPlanId: "f01e8dd4a8e447179bb49f232a69d053",
    billing: "monthly",
    checkoutUrl: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=f01e8dd4a8e447179bb49f232a69d053",
  },
  "estandar-monthly": {
    planId: "estandar",
    planName: "Plan Estándar",
    preapprovalPlanId: "50d7fb9c86944e91a8e979be18213f2f",
    billing: "monthly",
    checkoutUrl: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=50d7fb9c86944e91a8e979be18213f2f",
  },
  "premium-monthly": {
    planId: "premium",
    planName: "Plan Premium",
    preapprovalPlanId: "0af7a3e5d28c4c008e214fa07abe044f",
    billing: "monthly",
    checkoutUrl: "https://www.mercadopago.com.uy/subscriptions/checkout?preapproval_plan_id=0af7a3e5d28c4c008e214fa07abe044f",
  },
  // Annual plans - to be added later
  // "test-annual": { ... },
  // "basico-annual": { ... },
  // "estandar-annual": { ... },
  // "premium-annual": { ... },
};

/**
 * Get subscription plan configuration by plan ID and billing type
 */
export function getMPSubscriptionPlan(
  planId: string,
  billing: "monthly" | "annual"
): MPSubscriptionPlan | undefined {
  const key = `${planId}-${billing}`;
  return MP_SUBSCRIPTION_PLANS[key];
}

/**
 * Get all available subscription plans
 */
export function getAllMPSubscriptionPlans(): MPSubscriptionPlan[] {
  return Object.values(MP_SUBSCRIPTION_PLANS);
}
