"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PaymentSuccess() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to client panel after 2 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard/client/panel");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-600 dark:from-green-700 dark:to-emerald-700">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 sm:p-12 max-w-md w-full mx-4 text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Logo */}
        <Image
          src="/onion-logo.png"
          alt="RedOnion Logo"
          width={60}
          height={60}
          className="object-contain mx-auto mb-4"
        />

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ¡Pago Exitoso!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tu plan ha sido activado correctamente. Serás redirigido a tu panel de cliente en unos momentos.
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Redirigiendo...</span>
        </div>

        {/* Manual redirect button */}
        <button
          onClick={() => router.push("/dashboard/client/panel")}
          className="mt-8 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors w-full"
        >
          Ir a Mi Panel
        </button>
      </div>
    </div>
  );
}
