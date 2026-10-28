"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Check,
  Building2,
  FileCheck,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle,
  Briefcase,
  Zap,
  Filter,
  Users,
  Search,
  Phone,
  Clock,
  Award,
} from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { Footer } from "@/components/public/Footer";
import {
  generatePackageRechargeLink,
  getStoredWhatsAppSalesNumber,
  setStoredWhatsAppSalesNumber,
} from "@/lib/utils/whatsappTemplates";
import {
  getStoredPlans,
  fetchSubscriptionPlans,
  normalizeFeatures,
} from "@/lib/utils/subscriptionPlans";
import { SubscriptionPlan } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/useAuth";

const B2B_BENEFITS = [
  {
    icon: Zap,
    title: "Publicación con Plantillas en 1 Clic",
    tag: "Velocidad Operativa",
    description:
      "Crea convocatorias en segundos utilizando plantillas precargadas con turnos y salarios normativos para Vigilante Fijo, Escolta VIP, Supervisor Motorizado y Operador CCTV.",
  },
  {
    icon: Filter,
    title: "Filtro Estricto SuperVigilancia (Killer Checks)",
    tag: "Cero Tiempo Perdido",
    description:
      "Filtra automáticamente aspirantes que no cumplan con el curso vigente de la SuperVigilancia, libreta militar de primera clase o cilindraje mínimo de motocicleta.",
  },
  {
    icon: Users,
    title: "ATS Especializado Tipo SherlockHR",
    tag: "Gestión Centralizada",
    description:
      "Gestiona todo el embudo de contratación en 4 etapas ('Postulado', 'Preseleccionado', 'En Estudio', 'Contratado'), con marca automática de 'CV Visto' y citación por WhatsApp.",
  },
  {
    icon: Clock,
    title: "Radar de Relevos Urgentes 24/7",
    tag: "Disponibilidad Inmediata",
    description:
      "Accede en tiempo real a guardas y vigilantes acreditados con disponibilidad inmediata para cubrir turnos caídos, incapacidades o refuerzos de última hora en tu ciudad.",
  },
  {
    icon: Lock,
    title: "Poligrafía y Visitas Domiciliarias",
    tag: "Confiabilidad Certificada",
    description:
      "Solicita estudios periciales de seguridad y pruebas de polígrafo pre-empleo con un solo clic directamente desde el perfil del candidato, con dictamen oficial en 24h.",
  },
  {
    icon: Award,
    title: "Directorio de Empresas Verificadas",
    tag: "Insignia Oficial",
    description:
      "Tu empresa obtiene la insignia oficial de Empresa Verificada con validación de NIT y licencia de la Superintendencia de Vigilancia, atrayendo al mejor talento calificado.",
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { role, isAuthenticated, isLoading: authLoading } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(getStoredPlans());
  const [salesPhone, setSalesPhone] = useState(getStoredWhatsAppSalesNumber());

  useEffect(() => {
    if (!authLoading && role === "candidate") {
      router.replace("/guarda/vacantes");
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // 1. Fetch sales WhatsApp number
      try {
        const { data, error } = await supabase
          .from("platform_settings")
          .select("whatsapp_sales_number")
          .limit(1)
          .maybeSingle();

        if (!error && (data as any)?.whatsapp_sales_number) {
          const num = (data as any).whatsapp_sales_number;
          setSalesPhone(num);
          setStoredWhatsAppSalesNumber(num);
        }
      } catch {}

      // 2. Fetch dynamic subscription plans
      const remotePlans = await fetchSubscriptionPlans(supabase);
      if (remotePlans && remotePlans.length > 0) {
        setPlans(remotePlans);
      }
    }

    loadData();
  }, []);

  const publishTarget =
    isAuthenticated && role === "company"
      ? "/empresa/vacantes/nueva"
      : "/login?role=company";

  const directSalesUrl = `https://wa.me/${salesPhone}?text=${encodeURIComponent(
    "Hola, represento a una empresa de seguridad y deseo recibir información comercial sobre los planes de FuerzaVerificada."
  )}`;

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F8] text-slate-900 font-sans antialiased">
      <Navbar />

      {/* ========================================================================= */}
      {/* HERO COMERCIAL CORPORATIVO B2B                                            */}
      {/* ========================================================================= */}
      <section className="bg-gradient-to-b from-[#0B3B70] via-[#092E57] to-[#072140] text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 bg-[radial-gradient(#005DA4_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-[#FFE066] shadow-xs">
            <Shield className="w-4 h-4 text-emerald-400" strokeWidth={2} />
            <span>Portal Especializado B2B • Seguridad Privada en Colombia</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Atrae el Mejor Talento de Vigilancia y{" "}
            <span className="text-[#FFE066]">Blinda tu Operación en 1 Clic</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-200 max-w-2xl mx-auto leading-relaxed font-normal">
            La solución definitiva para departamentos de selección de empresas de seguridad. Publica vacantes tácticas, filtra candidatos con cursos SuperVigilancia al día, cubre relevos urgentes 24/7 y radica pruebas de poligrafía desde tu panel ATS.
          </p>

          {/* BOTÓN PRINCIPAL DESTACADO "PUBLICA TU OFERTA" */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={publishTarget}
              className="rounded-full bg-[#005DA4] hover:bg-[#004A85] text-white font-bold text-sm px-8 py-4 shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 w-full sm:w-auto active:scale-[0.98] border border-sky-400/30"
            >
              <Briefcase className="w-4 h-4" />
              <span>Publica tu oferta</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href={directSalesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-6 py-4 shadow-xs transition-colors flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Hablar con Asesor Comercial</span>
            </a>
          </div>

          {/* Micro credenciales de autoridad */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Cero intermediación a guardas</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Validación de Cursos y Credencial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Dictamen Pericial en 24h</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6 PILARES DE VALOR PARA EMPRESAS                                          */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FA] text-[#0B3B70] text-xs font-bold uppercase tracking-wider">
              Ventajas Exclusivas
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              ¿Por qué las mejores empresas de vigilancia contratan en FuerzaVerificada?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Diseñamos cada módulo respondiendo a los desafíos reales del reclutamiento de seguridad privada: deserción, falsificación documental y turnos caídos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {B2B_BENEFITS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-[#F2F5F8]/40 hover:bg-white hover:border-[#005DA4] p-6 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-[#0B3B70] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Icon className="w-6 h-6 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[10px] font-bold text-[#005DA4] bg-[#EAF3FA] px-2.5 py-1 rounded-full border border-sky-100 uppercase tracking-wide">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner central de llamada a la acción intermedia */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-[#0B3B70] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-1.5 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                ¿Tienes una vacante urgente de Vigilante, Escolta o CCTV?
              </h3>
              <p className="text-xs sm:text-sm text-slate-200">
                Regístrate como empresa y publica tu primera oferta en menos de 2 minutos.
              </p>
            </div>
            <Link
              href={publishTarget}
              className="rounded-full bg-white hover:bg-slate-100 text-[#0B3B70] font-bold text-xs sm:text-sm px-7 py-3.5 shadow-xs transition-colors shrink-0"
            >
              Publica tu oferta ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN DE PLANES Y TARIFAS DE CONTRATACIÓN CON POLIGRAFÍA                */}
      {/* ========================================================================= */}
      <section className="py-16 bg-[#F2F5F8] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
              <span>Paquetes B2B Flexibles con Poligrafía Incluida</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Planes Comerciales y Recargas de Estudios
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Elige el paquete que mejor se adapte a tu volumen de contratación. Solicita estudios periciales en cualquier momento con descuento por volumen.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {plans
              .filter((plan) => plan.is_active)
              .map((plan) => {
                const featuresList = normalizeFeatures(plan.features);
                const isHighlight =
                  plan.badge === "Más Vendido" ||
                  plan.badge === "Más Elegido por Empresas" ||
                  plan.badge === "Recomendado" ||
                  plan.credits === 5;

                const whatsappUrl = generatePackageRechargeLink({
                  companyName: "Empresa de Seguridad Interesada",
                  packageType: `${plan.name} ($${plan.price.toLocaleString("es-CO")} COP)`,
                  supportPhone: salesPhone,
                });

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl bg-white p-7 flex flex-col justify-between relative transition-all duration-200 ${
                      isHighlight
                        ? "border-2 border-[#0B3B70] shadow-md ring-2 ring-[#0B3B70]/10"
                        : "border border-slate-200 shadow-2xs hover:border-[#005DA4]"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-[#0B3B70] text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#005DA4]">
                          {plan.credits === 0
                            ? "Plan Inicial"
                            : plan.credits >= 15
                            ? "Gran Volumen / Corporativo"
                            : "Paquete Operativo Recomendado"}
                        </span>
                        <h3 className="text-xl font-bold tracking-tight text-slate-900 mt-1">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-1">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums font-mono">
                            ${plan.price.toLocaleString("es-CO")}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            COP {plan.credits === 0 ? "/ mes" : "/ paquete"}
                          </span>
                        </div>
                        {plan.credits > 0 ? (
                          <span className="inline-block mt-2 text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full tabular-nums">
                            ${Math.round(plan.price / plan.credits).toLocaleString("es-CO")} COP por candidato blindado ({plan.credits} créditos)
                          </span>
                        ) : (
                          <span className="inline-block mt-2 text-[11px] text-slate-500 font-medium">Acceso gratuito para siempre</span>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-5 space-y-2.5 text-xs text-slate-800">
                        {featuresList.map((feat, idx) => {
                          const isExcluded = feat.startsWith("Sin ");
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2.5 ${
                                isExcluded ? "text-slate-400" : ""
                              }`}
                            >
                              {isExcluded ? (
                                <span className="w-4 h-4 flex items-center justify-center text-xs font-semibold shrink-0">
                                  -
                                </span>
                              ) : (
                                <Check
                                  className="w-4 h-4 text-emerald-600 shrink-0"
                                  strokeWidth={2.5}
                                />
                              )}
                              <span className="font-medium">{feat}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-7">
                      {plan.price === 0 ? (
                        <Link
                          href={publishTarget}
                          className="w-full h-11 rounded-full bg-[#0B3B70] hover:bg-[#082B54] text-white text-xs font-semibold flex items-center justify-center transition-colors shadow-xs"
                        >
                          Publica tu oferta
                        </Link>
                      ) : (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full h-11 bg-[#0B3B70] hover:bg-[#082B54] text-white rounded-full px-4 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-xs text-center"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-400" strokeWidth={2} />
                          <span>Adquirir Paquete por WhatsApp</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* FOOTER GLOBAL */}
      <Footer />
    </div>
  );
}
