"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  features: string[];
  price: number;
  annualPrice: number;
  duration: string;
  upgrade?: {
    name: string;
    price: number;
  };
}

interface Extra {
  id: string;
  planId: string;
  name: string;
  price: number;
}

interface CartItem {
  type: "plan" | "extra";
  id: string;
  name: string;
  price: number;
  billing: "monthly" | "annual";
}

const plans: Plan[] = [
  {
    id: "basico",
    name: "Plan Básico",
    subtitle: "Fundación Digital",
    description: "Ideal para emprendedores o negocios locales que necesitan una presencia profesional online.",
    features: [
      "Sitio web personalizado (5 secciones: inicio, sobre nosotros, servicios, contacto, blog)",
      "Optimización móvil y carga rápida",
      "Google Maps y formularios de contacto",
      "Portal básico con métricas de visitas y conversiones",
      "Soporte por WhatsApp o email",
    ],
    price: 149,
    annualPrice: 126.65,
    duration: "6–12 meses",
    upgrade: {
      name: "SEO optimizado para mejorar posicionamiento en buscadores",
      price: 20,
    },
  },
  {
    id: "estandar",
    name: "Plan Estándar",
    subtitle: "Crecimiento y Posicionamiento",
    description: "Diseñado para pymes y negocios en expansión que buscan más visibilidad, tráfico y ventas.",
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
    duration: "12 meses",
    upgrade: {
      name: "Maximizador de tráfico pago: aumento de publicaciones diarias + campañas publicitarias gestionadas",
      price: 50,
    },
  },
  {
    id: "premium",
    name: "Plan Premium",
    subtitle: "Automatización y Crecimiento Inteligente",
    description: "Ideal para marcas consolidadas que buscan automatizar, escalar y destacarse.",
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
    duration: "Continuo con revisión trimestral",
    upgrade: {
      name: "Publicidad con influencers locales seleccionados según tu público y nicho",
      price: 250,
    },
  },
];

export default function ClientDashboard() {
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedExtras, setSelectedExtras] = useState<Set<string>>(new Set());
  const [cart, setCart] = useState<CartItem[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setCart([
      {
        type: "plan",
        id: plan.id,
        name: `${plan.name} - ${billing === "monthly" ? "Mensual" : "Anual"}`,
        price: billing === "monthly" ? plan.price : plan.annualPrice,
        billing,
      },
    ]);
    setSelectedExtras(new Set());
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
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price, 0);
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Selecciona tu Plan</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.email}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Cliente</p>
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
            Selecciona el plan perfecto para tu negocio y personalízalo con extras.
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
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billing === "monthly"
                  ? "bg-red-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBilling("annual")}
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
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
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
                        Ahorro anual: ${((plan.price - plan.annualPrice) * 12).toFixed(2)} USD
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2">
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
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      + {plan.features.length - 3} características más
                    </p>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Duración: {plan.duration}
                  </p>
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
                          ${item.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ${calculateTotal()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-red-600 dark:text-red-500">
                        ${calculateTotal()} USD/{billing === "monthly" ? "mes" : "año"}
                      </span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Método de Pago
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                        </svg>
                        Mercado Pago
                      </button>
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 00-.794.68l-.04.22-.63 3.993-.028.15a.804.804 0 01-.793.679H8.25c-.38 0-.684-.29-.72-.663l-.03-.205L6.25 9.75l.02-.137a.805.805 0 01.793-.68h2.647c3.628 0 6.093-1.393 6.925-5.544.11-.554.15-1.003.15-1.39 0-.75-.195-1.317-.59-1.69-.4-.377-.973-.565-1.696-.565H6.947a.805.805 0 00-.794.68l-1.14 7.244-.03.205c0 .443.36.803.804.803h2.647c3.628 0 6.093-1.393 6.925-5.544z" />
                        </svg>
                        PayPal
                        <span className="text-xs">(Próximamente)</span>
                      </button>
                      <button
                        disabled
                        className="w-full px-4 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16.624 13.9202C16.7031 13.0853 17.5291 12.4334 18.8134 12.4334C20.1002 12.4334 21.0652 13.0934 21.0652 13.9448C21.0652 14.6192 20.4835 15.0818 19.5286 15.3063V15.3741C20.6869 15.5731 21.4013 16.0766 21.4013 16.9236C21.4013 17.8768 20.3283 18.5858 18.7967 18.5858C17.2651 18.5858 16.1921 17.8931 16.1921 17.0542C16.1921 16.4023 16.6495 15.9661 17.3844 15.7416V15.6738C16.6741 15.4666 16.2167 14.9712 16.2167 14.3274C16.2167 13.5431 16.8419 12.9827 17.7133 12.7909V12.723C16.9549 12.5157 16.4974 11.9471 16.4974 11.2463C16.4974 10.1879 17.5454 9.4707 18.8134 9.4707C20.0814 9.4707 21.1294 10.1879 21.1294 11.2463C21.1294 11.9471 20.672 12.5157 19.9136 12.723V12.7909C20.7849 12.9827 21.4102 13.5431 21.4102 14.3274C21.4102 14.9712 20.9527 15.4666 20.2424 15.6738V15.7416C20.9773 15.9661 21.4348 16.4023 21.4348 17.0542Z" />
                        </svg>
                        Binance
                        <span className="text-xs">(Próximamente)</span>
                      </button>
                    </div>
                  </div>

                  <button className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl">
                    Proceder al Pago
                  </button>

                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                    Pago seguro • Cancela cuando quieras
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
