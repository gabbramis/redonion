"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  plan_name: string;
  plan_tier: string;
  billing_type: string;
  billing_period_start: string;
  billing_period_end: string;
  payment_date: string | null;
  payment_method: string | null;
  notes: string | null;
}

export default function PaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchInvoices = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Fetch invoices from API
        const response = await fetch(
          `/api/admin/invoices?userId=${user.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await response.json();
        setInvoices(data.invoices || []);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [router, supabase]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      paid: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-400", label: "Pagada" },
      pending: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-400", label: "Pendiente" },
      overdue: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-400", label: "Vencida" },
      cancelled: { bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-800 dark:text-gray-400", label: "Cancelada" },
    };

    const config = statusConfig[status] || { bg: "bg-gray-100", text: "text-gray-800", label: status };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Removed unused formatCurrency function

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
  <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Historial de Pagos
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Aquí puedes ver todas tus facturas y el historial de pagos de tu suscripción.
          </p>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg"
          >
            {error}
          </motion.div>
        )}

        {invoices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center"
          >
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No hay facturas registradas
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Aún no tienes facturas generadas. Una vez que tu plan esté activo, tus facturas aparecerán aquí.
            </p>
            <button
              onClick={() => router.push("/dashboard/client")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Ver Mi Plan
            </button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice, index) => (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  {/* Header with Invoice Number and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                          {invoice.invoice_number}
                        </h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.plan_name} · {invoice.billing_type === "monthly" ? "Mensual" : "Anual"}
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0 text-left sm:text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${invoice.amount}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {invoice.currency}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Fecha de Emisión
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(invoice.invoice_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Fecha de Vencimiento
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(invoice.due_date)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        {invoice.payment_date ? "Fecha de Pago" : "Método de Pago"}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.payment_date
                          ? formatDate(invoice.payment_date)
                          : invoice.payment_method || "Pendiente"
                        }
                      </div>
                    </div>
                  </div>

                  {/* Billing Period */}
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                      Período de Facturación
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatDate(invoice.billing_period_start)} - {formatDate(invoice.billing_period_end)}
                    </div>
                  </div>

                  {/* Notes if any */}
                  {invoice.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                        Notas
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300">
                        {invoice.notes}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </>
      );
}
