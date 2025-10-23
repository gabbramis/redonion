"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useParams } from "next/navigation";
import { DashboardMetric, ChartDataPoint, DashboardFormData } from "@/types/dashboard";

export default function ManageClientDashboard() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientInfo, setClientInfo] = useState<{ email: string; name?: string } | null>(null);

  const [formData, setFormData] = useState<DashboardFormData>({
    client_id: clientId,
    report_period: "",
    description: "",
    metrics: [
      { name: "Tasa de interacción promedio", value: "", description: "" },
      { name: "Promedio de comentarios", value: "", description: "" },
      { name: "Mejor hora para publicar", value: "", description: "" },
      { name: "Contenido más popular", value: "", description: "" },
    ],
    recommendation: "",
    chart_data: [
      { month: "", engagement: 0 },
      { month: "", engagement: 0 },
      { month: "", engagement: 0 },
    ],
  });

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch client info
      const { data: userData } = await supabase
        .from('user_plans')
        .select('users:user_id(email, id)')
        .eq('user_id', clientId)
        .single();

      if (userData && userData.users) {
        const user = Array.isArray(userData.users) ? userData.users[0] : userData.users;
        setClientInfo({
          email: user.email,
          name: user.email.split('@')[0]
        });
      }

      // Fetch existing dashboard if any
      const response = await fetch(`/api/dashboards?client_id=${clientId}`);
      const data = await response.json();

      if (data.dashboards && data.dashboards.length > 0) {
        const existingDashboard = data.dashboards[0];
        setFormData({
          client_id: clientId,
          report_period: existingDashboard.report_period,
          description: existingDashboard.description,
          metrics: existingDashboard.metrics,
          recommendation: existingDashboard.recommendation,
          chart_data: existingDashboard.chart_data,
        });
      }

      setLoading(false);
    };

    fetchData();
  }, [clientId, supabase]);

  const handleMetricChange = (index: number, field: keyof DashboardMetric, value: string) => {
    const newMetrics = [...formData.metrics];
    newMetrics[index] = { ...newMetrics[index], [field]: value };
    setFormData({ ...formData, metrics: newMetrics });
  };

  const handleChartDataChange = (index: number, field: keyof ChartDataPoint, value: string | number) => {
    const newChartData = [...formData.chart_data];
    newChartData[index] = {
      ...newChartData[index],
      [field]: field === 'engagement' ? parseFloat(value as string) || 0 : value
    };
    setFormData({ ...formData, chart_data: newChartData });
  };

  const addChartDataPoint = () => {
    setFormData({
      ...formData,
      chart_data: [...formData.chart_data, { month: "", engagement: 0 }],
    });
  };

  const removeChartDataPoint = (index: number) => {
    const newChartData = formData.chart_data.filter((_, i) => i !== index);
    setFormData({ ...formData, chart_data: newChartData });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log('📤 Enviando datos:', formData);

      const response = await fetch('/api/dashboards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('📥 Response status:', response.status);

      const responseData = await response.json();
      console.log('📥 Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Error al guardar el dashboard');
      }

      alert('Dashboard guardado correctamente');
      router.push('/dashboard/admin');
    } catch (error) {
      console.error('❌ Error completo:', error);
      alert(`Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Gestionar Dashboard del Cliente
          </h1>
          {clientInfo && (
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Cliente: {clientInfo.email}
            </p>
          )}
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Period and Description */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Información General
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Período del Reporte *
                </label>
                <input
                  type="text"
                  required
                  value={formData.report_period}
                  onChange={(e) => setFormData({ ...formData, report_period: e.target.value })}
                  placeholder="ej: Octubre 2025"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descripción Breve
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="ej: Resumen de rendimiento de redes sociales"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Métricas (máx. 4)
            </h2>
            <div className="space-y-4">
              {formData.metrics.map((metric, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={metric.name}
                        onChange={(e) => handleMetricChange(index, 'name', e.target.value)}
                        placeholder="ej: Tasa de interacción"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Valor
                      </label>
                      <input
                        type="text"
                        value={metric.value}
                        onChange={(e) => handleMetricChange(index, 'value', e.target.value)}
                        placeholder="ej: 4.5%"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={metric.description}
                        onChange={(e) => handleMetricChange(index, 'description', e.target.value)}
                        placeholder="ej: Por publicación"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Datos del Gráfico
              </h2>
              <button
                type="button"
                onClick={addChartDataPoint}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Agregar Punto
              </button>
            </div>
            <div className="space-y-3">
              {formData.chart_data.map((point, index) => (
                <div key={index} className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      value={point.month}
                      onChange={(e) => handleChartDataChange(index, 'month', e.target.value)}
                      placeholder="ej: Agosto"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Engagement (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={point.engagement}
                      onChange={(e) => handleChartDataChange(index, 'engagement', e.target.value)}
                      placeholder="ej: 4.5"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  {formData.chart_data.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeChartDataPoint(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Recomendación del Equipo
            </h2>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              placeholder="ej: Incrementar uso de historias interactivas y encuestas para mejorar el engagement..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Dashboard'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
