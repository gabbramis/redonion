"use client";

import { useEffect } from "react";

/**
 * Extend Window interface to include MercadoPago properties
 */
declare global {
  interface Window {
    $MPC_loaded?: boolean;
  }
}

/**
 * MercadoPago Subscription Script Component
 * Loads the MercadoPago subscription checkout script
 * This enables the subscription checkout modal functionality
 */
export function MercadoPagoSubscriptionScript() {
  useEffect(() => {
    // Check if script is already loaded
    if (typeof window !== "undefined" && window.$MPC_loaded) {
      return;
    }

    // Load MercadoPago subscription script
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `${document.location.protocol}//secure.mlstatic.com/mptools/render.js`;

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    window.$MPC_loaded = true;

    // Set up message listener for modal close events
    const handleMessage = (event: MessageEvent) => {
      // When the modal closes, we receive the preapproval_id
      if (event.data && event.data.preapproval_id) {
        console.log("✅ Subscription created:", event.data.preapproval_id);
        // You can add custom callback logic here
        // For example, redirect to success page or update UI
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return null;
}
