"use client";

import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface ClientSettings {
  userId: string;
  dashboardSettings: {
    showStats: boolean;
    enabledStats: string[];
    showActivity: boolean;
    customMessage?: string;
  };
  mediaSettings: {
    allowUpload: boolean;
    maxFileSize: number;
    allowedTypes: string[];
  };
  profileSettings: {
    showPlanDetails: boolean;
    allowPlanChange: boolean;
  };
}

interface UserPlan {
  id: string;
  planName: string;
  planTier: string;
  billingType: string;
  price: number;
  status: string;
}

export default function ManageClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);

  // Client panel settings
  const [settings, setSettings] = useState<ClientSettings>({
    userId: clientId,
    dashboardSettings: {
      showStats: true,
      enabledStats: ["visits", "engagement", "posts", "conversions"],
      showActivity: true,
      customMessage: "",
    },
    mediaSettings: {
      allowUpload: true,
      maxFileSize: 50,
      allowedTypes: ["image", "video"],
    },
    profileSettings: {
      showPlanDetails: true,
      allowPlanChange: false,
    },
  });

  // Available stats
  const availableStats = [
    { id: "visits", label: "Visitas del Sitio" },
    { id: "engagement", label: "Engagement en Redes" },
    { id: "posts", label: "Publicaciones del Mes" },
    { id: "conversions", label: "Conversiones" },
  ];

  useEffect(() => {
    const loadClientData = async () => {
      // Verify admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (
        !user ||
        (user.email !== "gabrielaramis01@gmail.com" &&
          user.user_metadata?.role !== "admin")
      ) {
        router.push("/dashboard/admin");
        return;
      }

      // For testing: Use the client ID directly (it's already a UUID)
      // In production, this would be the selected client's ID
      setClientEmail(user.email || "cliente@test.com");
      setClientName(user.user_metadata?.full_name || "Cliente de Prueba");

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
      }

      // Fetch client panel settings
      const { data: settingsData } = await supabase
        .from("client_panel_settings")
        .select("*")
        .eq("user_id", clientId)
        .single();

      if (settingsData) {
        setSettings({
          userId: clientId,
          dashboardSettings: settingsData.dashboard_settings || {
            showStats: true,
            enabledStats: ["visits", "engagement", "posts", "conversions"],
            showActivity: true,
            customMessage: "",
          },
          mediaSettings: settingsData.media_settings || {
            allowUpload: true,
            maxFileSize: 50,
            allowedTypes: ["image", "video"],
          },
          profileSettings: settingsData.profile_settings || {
            showPlanDetails: true,
            allowPlanChange: false,
          },
        });
      }

      setLoading(false);
    };

    loadClientData();
  }, [clientId, router, supabase]);

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      // Upsert client panel settings (onConflict specifies the unique column)
      const { error } = await supabase.from("client_panel_settings").upsert(
        {
          user_id: clientId,
          dashboard_settings: settings.dashboardSettings,
          media_settings: settings.mediaSettings,
          profile_settings: settings.profileSettings,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id", // Specify the unique constraint column
        }
      );

      if (error) throw error;

      alert("Configuración guardada exitosamente");
    } catch (err) {
      const error = err as Error;
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleStat = (statId: string) => {
    const newStats = settings.dashboardSettings.enabledStats.includes(statId)
      ? settings.dashboardSettings.enabledStats.filter((s) => s !== statId)
      : [...settings.dashboardSettings.enabledStats, statId];

    setSettings({
      ...settings,
      dashboardSettings: {
        ...settings.dashboardSettings,
        enabledStats: newStats,
      },
    });
  };

  const toggleMediaType = (type: string) => {
    const newTypes = settings.mediaSettings.allowedTypes.includes(type)
      ? settings.mediaSettings.allowedTypes.filter((t) => t !== type)
      : [...settings.mediaSettings.allowedTypes, type];

    setSettings({
      ...settings,
      mediaSettings: {
        ...settings.mediaSettings,
        allowedTypes: newTypes,
      },
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

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
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
            <Link
              href={`/dashboard/admin/clients/${clientId}/preview`}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
            >
              Vista Previa
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dashboard Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuración del Dashboard
            </h3>

            {/* Show Stats Toggle */}
            <div className="mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Mostrar Estadísticas
                </span>
                <input
                  type="checkbox"
                  checked={settings.dashboardSettings.showStats}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dashboardSettings: {
                        ...settings.dashboardSettings,
                        showStats: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </label>
            </div>

            {/* Enabled Stats */}
            {settings.dashboardSettings.showStats && (
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Estadísticas Visibles:
                </p>
                <div className="space-y-2">
                  {availableStats.map((stat) => (
                    <label
                      key={stat.id}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={settings.dashboardSettings.enabledStats.includes(
                          stat.id
                        )}
                        onChange={() => toggleStat(stat.id)}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mr-3"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        {stat.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Show Activity Toggle */}
            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Mostrar Actividad Reciente
                </span>
                <input
                  type="checkbox"
                  checked={settings.dashboardSettings.showActivity}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      dashboardSettings: {
                        ...settings.dashboardSettings,
                        showActivity: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </label>
            </div>
          </motion.div>

          {/* Media Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuración de Contenido
            </h3>

            {/* Allow Upload Toggle */}
            <div className="mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Permitir Subir Archivos
                </span>
                <input
                  type="checkbox"
                  checked={settings.mediaSettings.allowUpload}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      mediaSettings: {
                        ...settings.mediaSettings,
                        allowUpload: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </label>
            </div>

            {settings.mediaSettings.allowUpload && (
              <>
                {/* Max File Size */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tamaño Máximo de Archivo (MB)
                  </label>
                  <input
                    type="number"
                    value={settings.mediaSettings.maxFileSize}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        mediaSettings: {
                          ...settings.mediaSettings,
                          maxFileSize: Number(e.target.value),
                        },
                      })
                    }
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Allowed Types */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tipos de Archivo Permitidos:
                  </p>
                  <div className="space-y-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.mediaSettings.allowedTypes.includes(
                          "image"
                        )}
                        onChange={() => toggleMediaType("image")}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mr-3"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Imágenes (JPG, PNG, GIF)
                      </span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.mediaSettings.allowedTypes.includes(
                          "video"
                        )}
                        onChange={() => toggleMediaType("video")}
                        className="w-4 h-4 text-red-600 rounded focus:ring-red-500 mr-3"
                      />
                      <span className="text-gray-700 dark:text-gray-300">
                        Videos (MP4, MOV)
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuración del Perfil
            </h3>

            {/* Show Plan Details */}
            <div className="mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Mostrar Detalles del Plan
                </span>
                <input
                  type="checkbox"
                  checked={settings.profileSettings.showPlanDetails}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profileSettings: {
                        ...settings.profileSettings,
                        showPlanDetails: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </label>
            </div>

            {/* Allow Plan Change */}
            <div className="mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Permitir Cambio de Plan
                </span>
                <input
                  type="checkbox"
                  checked={settings.profileSettings.allowPlanChange}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      profileSettings: {
                        ...settings.profileSettings,
                        allowPlanChange: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
              </label>
            </div>
          </motion.div>
        </div>

        {/* Custom Message Section - Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg mt-8"
        >
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Mensaje Personalizado para el Cliente
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Este mensaje aparecerá en una sección separada en el dashboard del
              cliente.
            </p>
          </div>

          <textarea
            value={settings.dashboardSettings.customMessage || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                dashboardSettings: {
                  ...settings.dashboardSettings,
                  customMessage: e.target.value,
                },
              })
            }
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            placeholder="Escribe un mensaje personalizado para tu cliente..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Los saltos de línea y espacios se respetarán en el mensaje del
            cliente.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
