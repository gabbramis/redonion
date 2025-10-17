import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

    // Handle subscription events (preapproval)
    if (body.type === "subscription_preapproval" || body.action === "created") {
      const preapprovalId = body.data?.id;

      if (!preapprovalId) {
        console.log("⚠️ No preapproval ID in webhook");
        return NextResponse.json({ received: true });
      }

      // Get subscription details using direct API call
      const subscriptionResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!subscriptionResponse.ok) {
        console.error("❌ Failed to fetch subscription:", await subscriptionResponse.text());
        return NextResponse.json({ received: true });
      }

      const subscriptionData = await subscriptionResponse.json();

      console.log("📋 Subscription data:", JSON.stringify(subscriptionData, null, 2));

      // Only process authorized/active subscriptions
      if (subscriptionData.status === "authorized" || subscriptionData.status === "approved") {
        // Parse external_reference (format: userId-planId)
        const externalRef = subscriptionData.external_reference;
        const [userId, planTier] = externalRef ? externalRef.split("-") : [null, null];

        if (!userId || !planTier) {
          console.error("❌ Invalid external_reference:", externalRef);
          return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
        }

        // Calculate subscription end date based on frequency
        const frequency = subscriptionData.auto_recurring?.frequency || 1;
        const frequencyType = subscriptionData.auto_recurring?.frequency_type || 'months';

        const endDate = new Date();
        if (frequencyType === 'months') {
          endDate.setMonth(endDate.getMonth() + frequency);
        } else if (frequencyType === 'years') {
          endDate.setFullYear(endDate.getFullYear() + frequency);
        }

        // Map plan tier to plan name
        const planNames: Record<string, string> = {
          'basico': 'Plan Básico',
          'estandar': 'Plan Estándar',
          'premium': 'Plan Premium'
        };

        // Insert or update user_plans table
        const { error } = await supabase.from("user_plans").upsert({
          user_id: userId,
          plan_name: planNames[planTier] || planTier,
          plan_tier: planTier,
          status: "active",
          subscription_id: preapprovalId,
          subscription_start: new Date().toISOString(),
          subscription_end: endDate.toISOString(),
          billing_frequency: frequency, // Store the frequency (1 or 12)
          billing_period: frequencyType, // Store the period type (months or years)
        }, {
          onConflict: "user_id"
        });

        if (error) {
          console.error("❌ Error upserting user_plan:", error);
          return NextResponse.json({ error: "Database error" }, { status: 500 });
        }

        console.log(`✅ Subscription activated for user ${userId}, plan ${planTier}`);
      }
    }

    // Handle recurring payment events
    if (body.type === "payment") {
      const paymentId = body.data?.id;

      if (!paymentId) {
        return NextResponse.json({ received: true });
      }

      // Get payment details using direct API call
      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error("❌ Failed to fetch payment:", await paymentResponse.text());
        return NextResponse.json({ received: true });
      }

      const paymentData = await paymentResponse.json();

      console.log("💳 Payment data:", JSON.stringify(paymentData, null, 2));

      // If payment is for a subscription (has preapproval_id)
      if (paymentData.preapproval_id) {
        const subscriptionId = paymentData.preapproval_id;

        // Handle payment status
        if (paymentData.status === "approved") {
          // First, get the subscription details to know the billing frequency
          const { data: subscription } = await supabase
            .from("user_plans")
            .select("billing_frequency, billing_period")
            .eq("subscription_id", subscriptionId)
            .single();

          // Calculate new end date based on billing frequency
          const newEndDate = new Date();
          if (subscription) {
            const frequency = subscription.billing_frequency || 1;
            const period = subscription.billing_period || 'months';

            if (period === 'months') {
              newEndDate.setMonth(newEndDate.getMonth() + frequency);
            } else if (period === 'years') {
              newEndDate.setFullYear(newEndDate.getFullYear() + frequency);
            }
          } else {
            // Default to 1 month if we can't find the subscription
            newEndDate.setMonth(newEndDate.getMonth() + 1);
          }

          // Payment successful - extend subscription
          const { error } = await supabase
            .from("user_plans")
            .update({
              status: "active",
              subscription_end: newEndDate.toISOString(),
            })
            .eq("subscription_id", subscriptionId);

          if (error) {
            console.error("❌ Error updating subscription payment:", error);
          } else {
            console.log(`✅ Recurring payment approved for subscription ${subscriptionId}, extended by ${subscription?.billing_frequency} ${subscription?.billing_period}`);
          }
        } else if (paymentData.status === "rejected" || paymentData.status === "cancelled") {
          // Payment failed - mark subscription as pending
          const { error } = await supabase
            .from("user_plans")
            .update({
              status: "pending", // Payment failed, needs attention
            })
            .eq("subscription_id", subscriptionId);

          if (error) {
            console.error("❌ Error updating failed payment:", error);
          } else {
            console.log(`⚠️ Payment failed for subscription ${subscriptionId}`);
          }
        }
      }
    }

    // Handle subscription status changes (cancelled, paused, etc.)
    if (body.type === "subscription_preapproval") {
      const preapprovalId = body.data?.id;

      if (!preapprovalId) {
        return NextResponse.json({ received: true });
      }

      // Get subscription details
      const subscriptionResponse = await fetch(
        `https://api.mercadopago.com/preapproval/${preapprovalId}`,
        {
          headers: {
            "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          },
        }
      );

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();

        // Update subscription status based on MercadoPago status
        if (subscriptionData.status === "cancelled") {
          const { error } = await supabase
            .from("user_plans")
            .update({ status: "cancelled" })
            .eq("subscription_id", preapprovalId);

          if (!error) {
            console.log(`🚫 Subscription ${preapprovalId} cancelled`);
          }
        } else if (subscriptionData.status === "paused") {
          const { error } = await supabase
            .from("user_plans")
            .update({ status: "inactive" })
            .eq("subscription_id", preapprovalId);

          if (!error) {
            console.log(`⏸️ Subscription ${preapprovalId} paused`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
