"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { VisaIcon } from "@/components/ui/icons/brandico-visa";
import { MastercardIcon } from "@/components/ui/icons/brandico-mastercard";
import { initMercadoPago } from "@mercadopago/sdk-react";

interface Plan {
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

interface CartItem {
  type: "plan" | "extra";
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
}

// Initialize MP SDK with your public key
initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!);

const plans: Plan[] = [
  {
    id: "test",
    name: "Plan Test",
    subtitle: "Solo para Pruebas",
    description:
      "Plan de prueba de ~16 UYU para verificar que todo funciona correctamente.",
    features: [
      "Este es un plan de prueba",
      "Solo para verificar el flujo de pago",
      "Cuesta aproximadamente 16 pesos uruguayos (mínimo de MercadoPago)",
    ],
    price: 0.40, // ~16 UYU - slightly above minimum to account for exchange rate fluctuations
    annualPrice: 0.40,
    upgrade: {
      name: "Extra de prueba",
      price: 0.40,
    },
  },
  {
    id: "basico",
    name: "Plan Básico",
    subtitle: "Fundación Digital",
    description:
      "Ideal para emprendedores o negocios locales que necesitan una presencia profesional online.",
    features: [
      "Sitio web personalizado (5 secciones: inicio, sobre nosotros, servicios, contacto, blog)",
      "Optimización móvil y carga rápida",
      "Google Maps y formularios de contacto",
      "Portal básico con métricas de visitas y conversiones",
      "Soporte por WhatsApp o email",
    ],
    price: 149,
    annualPrice: 126.65,
    upgrade: {
      name: "SEO optimizado para mejorar posicionamiento en buscadores",
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
      "Gestión de 2 redes sociales (Instagram + Facebook o TikTok)",
      "Subida de contenido cada dos días con publicaciones orgánicas",
      "SEO general y análisis mensual de engagement",
      "Acceso al portal con métricas y reportes",
      "Soporte por WhatsApp y reuniones virtuales",
    ],
    price: 249,
    annualPrice: 211.65,
    upgrade: {
      name: "Maximizador de tráfico pago: aumento de publicaciones diarias + campañas publicitarias gestionadas",
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
      "Campañas publicitarias activas en Meta y Google",
      "Chatbot con IA integrado",
      "Email marketing automatizado",
      "Reuniones estratégicas semanales",
      "Integración con Google Analytics, Meta Ads y CRM",
    ],
    price: 649,
    annualPrice: 551.65,
    upgrade: {
      name: "Publicidad con influencers locales seleccionados según tu público y nicho",
      price: 250,
    },
  },
];

export default function ClientDashboard() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  // Update cart when billing changes
  useEffect(() => {
    if (selectedPlan) {
      setCart((prevCart) => {
        const newCart = prevCart.map((item) => {
          if (item.type === "plan") {
            const planPrice = billing === "monthly"
              ? selectedPlan.price
              : selectedPlan.annualPrice;

            return {
              ...item,
              name: `${selectedPlan.name} - ${billing === "monthly" ? "Mensual" : "Anual"}`,
              price: planPrice,
              billing,
            };
          }
          return item;
        });
        return newCart;
      });
    }
  }, [billing, selectedPlan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);

    const planPrice = billing === "monthly"
      ? plan.price
      : plan.annualPrice;

    setCart([
      {
        type: "plan",
        id: plan.id,
        name: `${plan.name} - ${billing === "monthly" ? "Mensual" : "Anual"}`,
        price: planPrice,
        billing,
      },
    ]);
    setSelectedExtras(new Set());
    // Reset subscription URL when changing plans
    setSubscriptionUrl(null);
  };

  const toggleExtra = (planId: string, extraName: string, price: number) => {
    const extraId = `${planId}-upgrade`;
    const newExtras = new Set(selectedExtras);

    if (newExtras.has(extraId)) {
      newExtras.delete(extraId);
      setCart(cart.filter((item) => item.id !== extraId));
    } else {
      newExtras.add(extraId);
      setCart([
        ...cart,
        {
          type: "extra",
          id: extraId,
          name: extraName,
          price,
          billing,
        },
      ]);
    }

    setSelectedExtras(newExtras);
    // Reset subscription URL when extras change
    setSubscriptionUrl(null);
  };

  const calculateTotal = () => {
    const total = cart.reduce((sum, item) => {
      // For annual plans, multiply by 12 for display purposes only
      if (item.billing === "annual" && item.type === "plan") {
        return sum + (item.price * 12);
      }
      return sum + item.price;
    }, 0);
    return total.toFixed(2);
  };

  const toggleExpandPlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const handleProceedToPayment = async () => {
    if (!user || !selectedPlan || cart.length === 0) {
      alert("Por favor selecciona un plan");
      return;
    }

    setProcessingPayment(true);
    try {
      // Get the base plan price (monthly rate for annual, or monthly price for monthly)
      const planPrice = billing === "monthly"
        ? selectedPlan.price
        : selectedPlan.annualPrice;

      // Create subscription with MercadoPago
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          price: planPrice,
          userId: user.id,
          userEmail: user.email,
          billing: billing,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al crear la suscripción");
      }

      const data = await response.json();

      // Redirect to MercadoPago subscription page
      window.location.href = data.initPoint || data.sandboxInitPoint;
    } catch (error) {
      console.error("Error:", error);
      alert("Error al procesar la suscripción. Por favor intenta nuevamente.");
    } finally {
      setProcessingPayment(false);
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
                  Selecciona tu Plan
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Cliente
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ¡Bienvenido! 👋
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Selecciona el plan perfecto para tu negocio y personalízalo con
            extras.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm inline-flex">
            <button
              onClick={() => {
                setBilling("monthly");
                setSubscriptionUrl(null); // Reset subscription when billing changes
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-red-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => {
                setBilling("annual");
                setSubscriptionUrl(null); // Reset subscription when billing changes
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billing === "annual"
                  ? "bg-red-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                Ahorra 15%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Plans Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  onClick={() => handleSelectPlan(plan)}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                    selectedPlan?.id === plan.id
                      ? "ring-2 ring-red-600 dark:ring-red-500"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-red-600 dark:text-red-500 font-medium">
                        {plan.subtitle}
                      </p>
                    </div>
                    {selectedPlan?.id === plan.id && (
                      <svg
                        className="w-6 h-6 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${billing === "monthly" ? plan.price : plan.annualPrice}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        USD/{billing === "monthly" ? "mes" : "mes"}
                      </span>
                    </div>
                    {billing === "annual" && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                        Ahorro anual: $
                        {((plan.price - plan.annualPrice) * 12).toFixed(2)} USD
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {(expandedPlans.has(plan.id)
                      ? plan.features
                      : plan.features.slice(0, 3)
                    ).map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-start gap-2"
                      >
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
                      </motion.div>
                    ))}

                    {plan.features.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandPlan(plan.id);
                        }}
                        className="text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium mt-2 flex items-center gap-1 transition-colors"
                      >
                        {expandedPlans.has(plan.id) ? (
                          <>
                            Ver menos
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </>
                        ) : (
                          <>
                            Ver más ({plan.features.length - 3} características
                            más)
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Extras Section */}
            {selectedPlan && selectedPlan.upgrade && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-8"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Extras Disponibles
                </h3>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedExtras.has(`${selectedPlan.id}-upgrade`)}
                      onChange={() =>
                        toggleExtra(
                          selectedPlan.id,
                          selectedPlan.upgrade!.name,
                          selectedPlan.upgrade!.price
                        )
                      }
                      className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {selectedPlan.upgrade.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Potencia tu plan con este extra especializado
                          </p>
                        </div>
                        <span className="text-lg font-bold text-red-600 dark:text-red-500 ml-4">
                          +${selectedPlan.upgrade.price} USD/mes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg sticky top-24"
            >
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Tu Carrito
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    Selecciona un plan para comenzar
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.type === "plan" ? "Plan" : "Extra"}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${item.billing === "annual" && item.type === "plan"
                            ? (item.price * 12).toFixed(2)
                            : item.price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Subtotal
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${calculateTotal()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">
                        Total
                      </span>
                      <span className="text-red-600 dark:text-red-500">
                        ${calculateTotal()} USD/
                        {billing === "monthly" ? "mes" : "año"}
                      </span>
                    </div>
                  </div>

                  {/* Subscription Payment Section */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Suscripción
                    </h4>

                    <div className="space-y-2">
                      {/* MercadoPago Button */}
                      <button
                        onClick={handleProceedToPayment}
                        disabled={processingPayment}
                        className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPayment ? (
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
                          <Image
                            src="/mercadopago-logo.png"
                            alt="Mercado Pago"
                            width={120}
                            height={32}
                            className="h-8 object-contain"
                          />
                        )}
                      </button>

                      {/* Credit Card Button (Disabled) */}
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <VisaIcon className="h-6" />
                          <MastercardIcon className="h-6" />
                        </div>
                      </button>

                      {/* PayPal Button (Disabled) */}
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="h-6 w-20" viewBox="0 0 124 33" fill="currentColor">
                          <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/>
                          <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/>
                          <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"/>
                          <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                          <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="#222D65"/>
                          <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="#253B80"/>
                        </svg>
                      </button>

                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                        Serás redirigido a MercadoPago para completar tu suscripción
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                    🔒 Suscripción segura • Cancela cuando quieras
                  </p>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
