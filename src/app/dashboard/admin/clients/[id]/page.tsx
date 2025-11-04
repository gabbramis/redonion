"use client";

import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { ADMIN_EMAILS } from "@/defs/admins";

interface UserPlan {
  id: string;
  planName: string;
  planTier: string;
  billingType: string;
  price: number;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: string;
  created_at: string;
  billing_period_start?: string;
  billing_period_end?: string;
  payment_date?: string;
  payment_method?: string;
  payment_notes?: string;
  plan_name?: string;
  currency?: string;
  invoice_date?: string;
}

interface UploadedFile {
  id?: string;
  name?: string;
  file_name?: string;
  size?: number;
  file_size?: number;
  type?: string;
  file_type?: string;
  url?: string;
  storage_path?: string;
  created_at?: string;
  public_url?: string;
}

export default function ManageClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [activatingSubscription, setActivatingSubscription] = useState(false);
  const [selectedPlanTier, setSelectedPlanTier] = useState("basico");
  const [selectedBilling, setSelectedBilling] = useState<"monthly" | "annual">("monthly");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    const loadClientData = async () => {
      // Verify admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userEmail = user?.email?.toLowerCase() || '';
      const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

      if (
        !user ||
        (!isAdmin && user.user_metadata?.role !== "admin")
      ) {
        router.push("/dashboard/admin");
        return;
      }

      // Get auth session to pass token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.error('❌ No session found');
        return;
      }

      // Fetch client data using the admin API
      try {
        const response = await fetch(`/api/admin/users?id=${clientId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API error:', errorData);
          return;
        }

        const { user: clientData } = await response.json();

        const email = clientData?.email || "unknown@example.com";
        const name = clientData?.full_name || email.split('@')[0];

        setClientEmail(email);
        setClientName(name);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      // Fetch client plan
      const { data: planData } = await supabase
        .from("user_plans")
        .select("*")
        .eq("user_id", clientId)
        .eq("status", "active")
        .single();

      if (planData) {
        setUserPlan({
          id: planData.id,
          planName: planData.plan_name,
          planTier: planData.plan_tier,
          billingType: planData.billing_type,
          price: planData.price,
          status: planData.status,
        });
        // Update the dropdown selectors to show the current plan
        setSelectedPlanTier(planData.plan_tier);
        setSelectedBilling(planData.billing_type);
      }

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("*")
        .eq("user_id", clientId)
        .order("invoice_date", { ascending: false });

      if (invoicesData) {
        setInvoices(invoicesData);
      }

      // Fetch uploaded files
      console.log("🔍 Fetching files for client:", clientId);
      const { data: filesData, error: filesError } = await supabase
        .from("media_uploads")
        .select("*")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false });

      console.log("📁 Files query result:", { filesData, filesError });

      if (filesError) {
        console.error("❌ Error fetching files:", filesError);
      }

      if (filesData) {
        console.log("✅ Files loaded successfully:", filesData.length);
        setUploadedFiles(filesData);
      } else {
        console.log("⚠️ No files data returned");
      }

      setLoading(false);
    };

    loadClientData();
  }, [clientId, router, supabase]);

  const handleActivateSubscription = async () => {
    if (!confirm(`¿Activar la suscripción de ${clientEmail}?`)) {
      return;
    }

    setActivatingSubscription(true);

    try {
      const response = await fetch("/api/admin/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: clientEmail,
          action: "activate",
          planTier: selectedPlanTier,
          billingType: selectedBilling,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al activar la suscripción");
      }

      alert("¡Suscripción activada exitosamente!");

      // Reload page to show updated plan
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setActivatingSubscription(false);
    }
  };

  const handleDeactivateSubscription = async () => {
    if (!confirm(`¿Estás seguro de desactivar la suscripción de ${clientEmail}?`)) {
      return;
    }

    setActivatingSubscription(true);

    try {
      const response = await fetch("/api/admin/toggle-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: clientEmail,
          action: "deactivate",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al desactivar la suscripción");
      }

      alert("Suscripción desactivada exitosamente");

      // Reload page to show updated plan
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setActivatingSubscription(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!confirm(`¿Actualizar el plan de ${clientEmail}?`)) {
      return;
    }

    setActivatingSubscription(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("No hay sesión activa");
      }

      const response = await fetch("/api/admin/update-plan", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: clientId,
          planTier: selectedPlanTier,
          billingType: selectedBilling,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar el plan");
      }

      alert("¡Plan actualizado exitosamente!");

      // Reload page to show updated plan
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setActivatingSubscription(false);
    }
  };

  const handleCreateInvoice = async () => {
    // Validate billing period dates
    if (!billingPeriodStart || !billingPeriodEnd) {
      alert("Por favor, selecciona el período de facturación");
      return;
    }

    setCreatingInvoice(true);

    try {
      // Plan configuration matching the toggle-subscription endpoint
      const planConfigs: Record<string, { name: string; price: number; annualPrice: number }> = {
        // test: { name: "Plan Test", price: 0.40, annualPrice: 0.40 }, // Commented out - can be enabled in the future
        basico: { name: "Plan Básico", price: 149, annualPrice: 126.65 },
        estandar: { name: "Plan Estándar", price: 249, annualPrice: 211.65 },
        premium: { name: "Plan Premium", price: 649, annualPrice: 551.65 },
      };

      const selectedPlan = planConfigs[selectedPlanTier];
      const amount = selectedBilling === "annual" ? selectedPlan.annualPrice : selectedPlan.price;

      const response = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clientId,
          amount: amount,
          planName: selectedPlan.name,
          planTier: selectedPlanTier,
          billingType: selectedBilling,
          billingPeriodStart: new Date(billingPeriodStart).toISOString(),
          billingPeriodEnd: new Date(billingPeriodEnd).toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear la factura");
      }

      alert("¡Factura creada exitosamente!");
      setBillingPeriodStart("");
      setBillingPeriodEnd("");

      // Reload page to show new invoice
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleMarkInvoiceAsPaid = async (invoiceId: string) => {
    if (!confirm("¿Marcar esta factura como pagada?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId,
          status: "paid",
          paymentDate: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la factura");
      }

      alert("Factura marcada como pagada");
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/invoices?invoiceId=${invoiceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la factura");
      }

      alert("Factura eliminada exitosamente");
      window.location.reload();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/admin"
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <Image
                  src="/onion-logo.png"
                  alt="RedOnion Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h1 className="text-2xl font-bold">
                    <span className="text-red-500">Red</span>
                    <span className="text-gray-900 dark:text-white">Onion</span>
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Gestionar Cliente
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Client Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {clientName || clientEmail}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">{clientEmail}</p>
              {userPlan && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="text-sm font-medium text-red-600 dark:text-red-500">
                    {userPlan.planName} - ${userPlan.price}/mes (
                    {userPlan.billingType})
                  </span>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      userPlan.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {userPlan.status}
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/admin/clients/${clientId}/dashboard`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Gestionar Dashboard
              </Link>
              
            </div>
          </div>
        </motion.div>

        {/* Subscription Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Gestionar Suscripción
          </h3>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Activa o desactiva manualmente la suscripción de este cliente.
            </p>

            {/* Plan Selector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="planTier"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Seleccionar Plan
                </label>
                <select
                  id="planTier"
                  value={selectedPlanTier}
                  onChange={(e) => setSelectedPlanTier(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {/* <option value="test">Plan Test</option> */}
                  <option value="basico">Plan Básico</option>
                  <option value="estandar">Plan Estándar</option>
                  <option value="premium">Plan Premium</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="billingType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tipo de Facturación
                </label>
                <select
                  id="billingType"
                  value={selectedBilling}
                  onChange={(e) => setSelectedBilling(e.target.value as "monthly" | "annual")}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="monthly">Mensual</option>
                  <option value="annual">Anual</option>
                </select>
              </div>
            </div>

            {/* Dynamic Activate/Deactivate/Update Buttons */}
            {userPlan && userPlan.status === "active" ? (
              <div className="grid grid-cols-2 gap-4">
                {/* Update Plan Button */}
                <button
                  onClick={handleUpdatePlan}
                  disabled={activatingSubscription}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {activatingSubscription ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Actualizar Plan
                    </>
                  )}
                </button>

                {/* Deactivate Button */}
                <button
                  onClick={handleDeactivateSubscription}
                  disabled={activatingSubscription}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {activatingSubscription ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Desactivar Suscripción
                    </>
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleActivateSubscription}
                disabled={activatingSubscription}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {activatingSubscription ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Activar Suscripción
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Invoices / Billing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Facturas / Billing
          </h3>

          {/* Invoice Creation Form */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Generar Nueva Factura
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Billing Period Start */}
              <div>
                <label
                  htmlFor="billingStart"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Inicio del Período
                </label>
                <input
                  type="date"
                  id="billingStart"
                  value={billingPeriodStart}
                  onChange={(e) => setBillingPeriodStart(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Billing Period End */}
              <div>
                <label
                  htmlFor="billingEnd"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Fin del Período
                </label>
                <input
                  type="date"
                  id="billingEnd"
                  value={billingPeriodEnd}
                  onChange={(e) => setBillingPeriodEnd(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Display selected plan info */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-semibold">Plan seleccionado:</span>{" "}
                {/* {selectedPlanTier === "test" && "Plan Test"} */}
                {selectedPlanTier === "basico" && "Plan Básico"}
                {selectedPlanTier === "estandar" && "Plan Estándar"}
                {selectedPlanTier === "premium" && "Plan Premium"}
                {" · "}
                <span className="font-semibold">
                  $
                  {selectedBilling === "annual"
                    ? /* selectedPlanTier === "test" ? "0.40" : */
                      selectedPlanTier === "basico" ? "126.65" :
                      selectedPlanTier === "estandar" ? "211.65" : "551.65"
                    : /* selectedPlanTier === "test" ? "0.40" : */
                      selectedPlanTier === "basico" ? "149" :
                      selectedPlanTier === "estandar" ? "249" : "649"
                  }
                </span>
                {" "}USD ({selectedBilling === "monthly" ? "Mensual" : "Anual"})
              </p>
            </div>

            <button
              onClick={handleCreateInvoice}
              disabled={creatingInvoice}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {creatingInvoice ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Generar Factura
                </>
              )}
            </button>
          </div>

          {/* Invoice List Header */}
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            Facturas Existentes
          </h4>

          {invoices.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              No hay facturas generadas aún
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {invoice.plan_name} · ${invoice.amount} {invoice.currency}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Fecha: {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('es-ES') : 'N/A'} ·
                      Vence: {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {invoice.status === 'pending' && (
                      <button
                        onClick={() => handleMarkInvoiceAsPaid(invoice.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        Marcar como Pagada
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteInvoice(invoice.id)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                      title="Eliminar factura"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Uploaded Files Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mb-8"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Archivos Subidos por el Cliente
          </h3>

          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              El cliente no ha subido archivos aún
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.file_name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {file.file_type} · {file.file_size ? (file.file_size / 1024 / 1024).toFixed(2) : '0'} MB
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString('es-ES') : 'N/A'}
                      </p>
                    </div>
                    {file.file_type?.startsWith('image/') && file.public_url && (
                      <div className="relative w-12 h-12 ml-2 flex-shrink-0">
                        <Image
                          src={file.public_url}
                          alt={file.file_name || 'File'}
                          fill
                          className="object-cover rounded"
                          unoptimized
                        />
                      </div>
                    )}
                  </div>
                  {file.public_url && (
                    <a
                      href={file.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Ver archivo
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
