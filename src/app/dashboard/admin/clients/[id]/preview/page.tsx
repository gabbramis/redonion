"use client";

import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

type Section = "dashboard" | "media" | "profile";

interface UserPlan {
  name: string;
  tier: "basico" | "estandar" | "premium";
  billing: "monthly" | "annual";
  price: number;
  features: string[];
  startDate: string;
}

interface ClientSettings {
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

export default function ClientPreviewPanel() {
  const params = useParams();
  const clientId = params.id as string;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [settings, setSettings] = useState<ClientSettings>({
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

  useEffect(() => {
    const loadClientData = async () => {
      // Verify admin is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || (user.email !== "gabrielaramis01@gmail.com" && user.user_metadata?.role !== "admin")) {
        router.push("/dashboard/admin");
        return;
      }

      try {
        // Fetch client's user info
        const { data: userData } = await supabase.auth.admin.getUserById(clientId);
        if (userData?.user) {
          setClientEmail(userData.user.email || "cliente@test.com");
          setClientName(userData.user.user_metadata?.full_name || "Cliente");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setClientEmail("cliente@test.com");
        setClientName("Cliente");
      }

      // Fetch client plan
      const { data: planData } = await supabase
        .from('user_plans')
        .select('*')
        .eq('user_id', clientId)
        .eq('status', 'active')
        .single();

      if (planData) {
        setUserPlan({
          name: planData.plan_name,
          tier: planData.plan_tier,
          billing: planData.billing_type,
          price: planData.price,
          features: planData.features || [],
          startDate: planData.start_date,
        });
      } else {
        // Fallback data
        setUserPlan({
          name: "Plan Estándar",
          tier: "estandar",
          billing: "monthly",
          price: 249,
          features: [
            "Sitio web personalizado",
            "Gestión de 2 redes sociales",
            "Publicaciones cada dos días",
            "SEO general",
            "Portal con métricas",
            "Soporte prioritario",
          ],
          startDate: new Date().toISOString(),
        });
      }

      // Fetch client panel settings
      const { data: settingsData } = await supabase
        .from('client_panel_settings')
        .select('*')
        .eq('user_id', clientId)
        .single();

      if (settingsData) {
        setSettings({
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Preview Banner */}
      <div className="bg-yellow-500 text-black py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        MODO VISTA PREVIA - Así verá el cliente su panel
        <Link
          href={`/dashboard/admin/clients/${clientId}`}
          className="ml-4 px-3 py-1 bg-black text-yellow-500 rounded hover:bg-gray-800 transition-colors text-sm"
        >
          Volver a Configuración
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

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
                  <p className="text-sm text-gray-600 dark:text-gray-400">Panel de Cliente</p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {clientName || clientEmail}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">{userPlan?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-300 ease-in-out mt-[73px] lg:mt-0 flex flex-col`}
        >
          <nav className="p-4 space-y-2 mt-4 flex-1">
            <button
              onClick={() => {
                setActiveSection("dashboard");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === "dashboard"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveSection("media");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === "media"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Subir Contenido</span>
            </button>

            <button
              onClick={() => {
                setActiveSection("profile");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeSection === "profile"
                  ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="font-medium">Mi Perfil</span>
            </button>
          </nav>

          {/* Logout button at bottom (disabled in preview) */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              disabled
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-[73px]"
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeSection === "dashboard" && userPlan && (
            <DashboardSection
              userPlan={userPlan}
              settings={settings.dashboardSettings}
            />
          )}
          {activeSection === "media" && (
            <MediaSection settings={settings.mediaSettings} />
          )}
          {activeSection === "profile" && userPlan && (
            <ProfileSection
              clientEmail={clientEmail}
              clientName={clientName}
              userPlan={userPlan}
              settings={settings.profileSettings}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// Dashboard Section Component
function DashboardSection({ userPlan, settings }: {
  userPlan: UserPlan;
  settings: ClientSettings['dashboardSettings'];
}) {
  const allStats = [
    { id: "visits", label: "Visitas del Sitio", value: "2,847", change: "+12.5%", positive: true },
    { id: "engagement", label: "Engagement Redes", value: "18.4%", change: "+3.2%", positive: true },
    { id: "posts", label: "Publicaciones este Mes", value: "24", change: "En meta", positive: true },
    { id: "conversions", label: "Conversiones", value: "127", change: "+8.1%", positive: true },
  ];

  const stats = settings.showStats
    ? allStats.filter(stat => settings.enabledStats.includes(stat.id))
    : [];

  const recentActivity = [
    { action: "Publicación en Instagram", date: "Hace 2 horas", status: "completed" },
    { action: "Reporte mensual generado", date: "Hace 1 día", status: "completed" },
    { action: "Actualización de sitio web", date: "Hace 3 días", status: "completed" },
    { action: "Campaña publicitaria activa", date: "Hace 5 días", status: "active" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 sm:p-8 text-white"
      >
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡Bienvenido de vuelta! 👋</h2>
        <p className="text-red-100">
          Tu {userPlan.name} está activo y en funcionamiento. Aquí está tu resumen.
        </p>
      </motion.div>

      {/* Stats Grid */}
      {settings.showStats && stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <span
                  className={`text-xs font-medium ${
                    stat.positive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {settings.showActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</p>
                  </div>
                </div>
                {activity.status === "active" && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    Activo
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Custom Message from Admin */}
      {settings.customMessage && settings.customMessage.trim() !== '' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 sm:p-8 shadow-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Mensaje de tu Equipo RedOnion
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {settings.customMessage}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Media Upload Section Component (Preview Mode)
function MediaSection({ settings }: { settings: ClientSettings['mediaSettings'] }) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Subir Contenido
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {settings.allowUpload
            ? "Sube imágenes y videos para tus publicaciones y campañas."
            : "La carga de archivos está deshabilitada para este cliente."}
        </p>
      </motion.div>

      {settings.allowUpload ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg"
        >
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Arrastra y suelta tus archivos aquí
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              o haz clic para seleccionar archivos
            </p>
            <button
              disabled
              className="inline-block px-6 py-3 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed"
            >
              Seleccionar Archivos (Vista Previa)
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
              Tipos permitidos: {settings.allowedTypes.join(", ")} • Máx: {settings.maxFileSize}MB
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-100 dark:bg-gray-800 rounded-xl p-12 text-center"
        >
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">La función de subir contenido no está disponible en tu plan actual.</p>
        </motion.div>
      )}
    </div>
  );
}

// Profile Section Component
function ProfileSection({
  clientEmail,
  clientName,
  userPlan,
  settings
}: {
  clientEmail: string;
  clientName: string;
  userPlan: UserPlan;
  settings: ClientSettings['profileSettings'];
}) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Mi Perfil
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Información de tu cuenta y plan actual.
        </p>
      </motion.div>

      {/* User Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Información Personal
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Nombre Completo</label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {clientName || "No especificado"}
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-400">Correo Electrónico</label>
            <p className="text-lg font-medium text-gray-900 dark:text-white">{clientEmail}</p>
          </div>
        </div>
      </motion.div>

      {/* Plan Info Card */}
      {settings.showPlanDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gradient-to-br from-red-600 to-orange-600 rounded-xl p-6 shadow-lg text-white"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold mb-1">{userPlan.name}</h3>
              <p className="text-red-100">
                {userPlan.billing === "monthly" ? "Facturación Mensual" : "Facturación Anual"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${userPlan.price}</p>
              <p className="text-sm text-red-100">USD/mes</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-100 mb-2">Fecha de inicio</p>
            <p className="font-semibold">
              {new Date(userPlan.startDate).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>
          {settings.allowPlanChange && (
            <button
              disabled
              className="w-full px-4 py-2 bg-white/50 text-white font-medium rounded-lg cursor-not-allowed"
            >
              Cambiar Plan (Vista Previa)
            </button>
          )}
        </motion.div>
      )}

      {/* Plan Features */}
      {settings.showPlanDetails && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Características de tu Plan
          </h3>
          <div className="space-y-3">
            {userPlan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
