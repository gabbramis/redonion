"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Subscription {
  id: string;
  planName: string;
  planTier: string;
  billingType: string;
  price: number;
  currency: string;
  status: string;
  subscriptionStart: string;
  subscriptionEnd: string;
  billingFrequency: number;
  billingPeriod: string;
  nextBillingDate: string | null;
  features: string[];
  mpStatus: string | null;
  mpReason: string | null;
}

interface AvailablePlan {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  features: string[];
  price: number;
  annualPrice: number;
  upgrade?: {
    name: string;
    price: number;
  };
}

const availablePlans: AvailablePlan[] = [
  {
    id: "basico",
    name: "Plan Básico",
    subtitle: "Fundación Digital",
    description:
      "Ideal para emprendedores o negocios locales que necesitan una presencia profesional online.",
    features: [
      "Sitio web personalizado (5 secciones)",
      "Optimización móvil y carga rápida",
      "Google Maps y formularios de contacto",
      "Portal básico con métricas",
      "Soporte por WhatsApp o email",
    ],
    price: 149,
    annualPrice: 126.65,
    upgrade: {
      name: "SEO optimizado",
      price: 20,
    },
  },
  {
    id: "estandar",
    name: "Plan Estándar",
    subtitle: "Crecimiento y Posicionamiento",
    description:
      "Diseñado para pymes y negocios en expansión que buscan más visibilidad, tráfico y ventas.",
    features: [
      "Todo lo del Plan Básico",
      "Gestión de 2 redes sociales",
      "Contenido cada dos días",
      "SEO general y análisis mensual",
      "Acceso al portal con métricas",
      "Soporte premium",
    ],
    price: 249,
    annualPrice: 211.65,
    upgrade: {
      name: "Maximizador de tráfico pago",
      price: 50,
    },
  },
  {
    id: "premium",
    name: "Plan Premium",
    subtitle: "Automatización y Crecimiento Inteligente",
    description:
      "Ideal para marcas consolidadas que buscan automatizar, escalar y destacarse.",
    features: [
      "Todo lo del Plan Estándar",
      "Gestión de 3+ redes sociales",
      "Publicaciones diarias estratégicas",
      "Campañas publicitarias activas",
      "Chatbot con IA integrado",
      "Email marketing automatizado",
      "Reuniones estratégicas semanales",
    ],
    price: 649,
    annualPrice: 551.65,
    upgrade: {
      name: "Publicidad con influencers",
      price: 250,
    },
  },
];

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        // Fetch subscription details from API
        const response = await fetch(
          `/api/subscription/details?userId=${user.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subscription details");
        }

        const data = await response.json();
        setSubscription(data.subscription);
      } catch (err) {
        const error = err as Error;
        setError(error.message);
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionDetails();
  }, [router, supabase]);

  const handleUpgrade = (planId: string) => {
    router.push(`/dashboard/client?plan=${planId}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      active: {
        bg: "bg-green-100 dark:bg-green-900/30",
        text: "text-green-800 dark:text-green-400",
        label: "Activo",
      },
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-900/30",
        text: "text-yellow-800 dark:text-yellow-400",
        label: "Pendiente",
      },
      cancelled: {
        bg: "bg-red-100 dark:bg-red-900/30",
        text: "text-red-800 dark:text-red-400",
        label: "Cancelado",
      },
      inactive: {
        bg: "bg-gray-100 dark:bg-gray-900/30",
        text: "text-gray-800 dark:text-gray-400",
        label: "Inactivo",
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: status,
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

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
          Mi Plan y Upgrades
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Gestiona tu suscripción actual y explora opciones de mejora.
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

      {/* Current Subscription */}
      {subscription ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-red-600 to-orange-600 rounded-xl p-6 sm:p-8 shadow-lg text-white mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">
                {subscription.planName}
              </h3>
              <p className="text-red-100">
                {subscription.billingType === "monthly"
                  ? "Facturación Mensual"
                  : "Facturación Anual"}
              </p>
            </div>
            {getStatusBadge(subscription.status)}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-red-100 mb-1">Precio Mensual</p>
              <p className="text-2xl font-bold">
                ${subscription.price.toFixed(2)}
              </p>
              <p className="text-xs text-red-100">{subscription.currency}</p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-red-100 mb-1">Fecha de Inicio</p>
              <p className="text-lg font-semibold">
                {formatDate(subscription.subscriptionStart)}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-red-100 mb-1">Próximo Pago</p>
              <p className="text-lg font-semibold">
                {subscription.nextBillingDate
                  ? formatDate(subscription.nextBillingDate)
                  : formatDate(subscription.subscriptionEnd)}
              </p>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-red-100 mb-1">Frecuencia</p>
              <p className="text-lg font-semibold">
                Cada {subscription.billingFrequency}{" "}
                {subscription.billingPeriod === "months" ? "mes(es)" : "año(s)"}
              </p>
            </div>
          </div>

          {subscription.features && subscription.features.length > 0 && (
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-semibold mb-3">Características Incluidas:</h4>
              <ul className="space-y-2">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5"
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
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg text-center mb-8"
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No tienes una suscripción activa
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Selecciona un plan para comenzar.
          </p>
          <button
            onClick={() => router.push("/dashboard/client")}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
          >
            Ver Planes Disponibles
          </button>
        </motion.div>
      )}

      {/* Available Plans & Upgrades */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {subscription ? "Mejora tu Plan" : "Planes Disponibles"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availablePlans.map((plan, index) => {
            const isCurrentPlan = subscription?.planTier === plan.id;
            const canUpgrade =
              subscription &&
              availablePlans.findIndex((p) => p.id === subscription.planTier) <
                availablePlans.findIndex((p) => p.id === plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg ${
                  isCurrentPlan
                    ? "ring-2 ring-red-600 dark:ring-red-500"
                    : ""
                }`}
              >
                {isCurrentPlan && (
                  <span className="inline-block px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full mb-4">
                    Plan Actual
                  </span>
                )}

                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {plan.name}
                </h4>
                <p className="text-sm text-red-600 dark:text-red-500 font-medium mb-3">
                  {plan.subtitle}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {" "}
                    USD/mes
                  </span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 3).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
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
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.features.length > 3 && (
                    <li className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                      + {plan.features.length - 3} características más
                    </li>
                  )}
                </ul>

                {canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Mejorar a este Plan
                  </button>
                ) : isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed"
                  >
                    Plan Actual
                  </button>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
                  >
                    Ver Detalles
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
