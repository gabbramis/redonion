"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClientDashboard } from "@/types/dashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UserPlan {
  planName: string;
  planTier: string;
  billingType: string;
  price: number;
  status: string;
  subscriptionEnd: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  status: string;
  plan_name: string;
  billing_period_start: string;
  billing_period_end: string;
}

export default function ClientPanel() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<ClientDashboard | null>(null);
  const [hasActivePlan, setHasActivePlan] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // Check if user has an active plan
        const planResponse = await fetch(`/api/subscription/details?userId=${user.id}`);
        const planData = await planResponse.json();

        if (planData.subscription && planData.subscription.status === 'active') {
          setHasActivePlan(true);
          setUserPlan(planData.subscription);
        }

        // Fetch dashboard data
        const response = await fetch(`/api/dashboards?client_id=${user.id}`);
        const data = await response.json();

        if (data.dashboards && data.dashboards.length > 0) {
          setDashboard(data.dashboards[0]);
        }

        // Fetch invoices
        const invoicesResponse = await fetch(`/api/admin/invoices?userId=${user.id}`);
        const invoicesData = await invoicesResponse.json();

        if (invoicesData.invoices) {
          setInvoices(invoicesData.invoices);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }

      setLoading(false);
    };

    fetchDashboard();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Show "No active plan" message if user doesn't have a plan
  if (!hasActivePlan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No tienes un plan activo
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Para acceder a tus reportes y métricas, necesitas activar un plan primero.
            </p>
            <button
              onClick={() => router.push("/dashboard/client")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Ver Planes Disponibles
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show "No reports" message if user has a plan but no dashboard data yet
  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No hay reportes disponibles
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Tu equipo de marketing está trabajando en tu primer reporte. Te notificaremos cuando esté listo.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metricIcons = [
    <svg key="1" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>,
    <svg key="2" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>,
    <svg key="3" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>,
    <svg key="4" className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>,
  ];

  const metricColors = [
    'text-blue-600',
    'text-green-600',
    'text-purple-600',
    'text-orange-600',
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Resumen General
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {dashboard.report_period}
              </p>
              {dashboard.description && (
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  {dashboard.description}
                </p>
              )}
            </div>

            {/* Plan Info Badge */}
            {userPlan && (
              <div className="bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Plan Activo
                </div>
                <div className="text-xl font-bold text-red-600 dark:text-red-500">
                  {userPlan.planName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  ${userPlan.price} USD / {userPlan.billingType === 'monthly' ? 'mes' : 'año'}
                </div>
                {userPlan.subscriptionEnd && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Vence: {new Date(userPlan.subscriptionEnd).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {dashboard.metrics.map((metric, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${metricColors[index % metricColors.length]}`}>
                  {metricIcons[index % metricIcons.length]}
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {metric.name}
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {metric.value}
              </p>
              {metric.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.description}
                </p>
              )}
            </div>
          ))}
        </motion.div>

        {/* Chart Section */}
        {dashboard.chart_data && dashboard.chart_data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-8"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Tendencia de Engagement
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.chart_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  style={{ fontSize: '14px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '14px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#DC2626"
                  strokeWidth={3}
                  dot={{ fill: '#DC2626', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Recommendation Section */}
        {dashboard.recommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-8 shadow-sm border-l-4 border-red-600 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  Recomendaciones del Equipo
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {dashboard.recommendation}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Invoice History Section */}
        {invoices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Historial de Facturación
              </h3>
            </div>

            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        invoice.status === 'paid'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : invoice.status === 'overdue'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {invoice.status === 'paid' ? 'Pagada' : invoice.status === 'overdue' ? 'Vencida' : 'Pendiente'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {invoice.plan_name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Período: {new Date(invoice.billing_period_start).toLocaleDateString('es-ES')} - {new Date(invoice.billing_period_end).toLocaleDateString('es-ES')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Vence: {new Date(invoice.due_date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${invoice.amount}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {invoice.currency}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
