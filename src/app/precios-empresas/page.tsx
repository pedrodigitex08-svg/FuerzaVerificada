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
  HelpCircle,
  ArrowRight,
  Sparkles,
  Lock,
  CheckCircle,
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

export default function PricingPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F5F8] text-slate-900">
      <Navbar />

      {/* HEADER SECTION */}
      <section className="pt-12 pb-12 bg-white border-b border-slate-200 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
            <span>Estructura Comercial B2B • Facturación Corporativa</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Planes de Contratación con{" "}
            <span className="text-[#0B3B70]">Poligrafía y Visitas</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Adquiera paquetes corporativos para publicar vacantes ilimitadas y solicitar estudios de confiabilidad para sus aspirantes en 1 clic desde el ATS.
          </p>
        </div>
      </section>

      {/* DYNAMIC PRICING CARDS */}
      <section className="py-12 bg-[#F2F5F8] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                          href="/login?tab=register&role=company"
                          className="w-full h-11 rounded-full bg-[#EAF3FA] hover:bg-[#D5E6F5] text-[#0B3B70] text-xs font-semibold flex items-center justify-center transition-colors"
                        >
                          Comenzar Gratis
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

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
