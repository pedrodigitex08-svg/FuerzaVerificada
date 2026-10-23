"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(getStoredPlans());
  const [salesPhone, setSalesPhone] = useState(getStoredWhatsAppSalesNumber());

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
    <div className="min-h-screen flex flex-col bg-white text-[#1E293B]">
      <Navbar />

      {/* HEADER SECTION */}
      <section className="pt-14 pb-16 bg-white border-b border-[#E2E8F0] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#10B981]/30 text-[#065F46] text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
            <span>Estructura Comercial B2B • Facturación Corporativa</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#1E293B] tracking-tight">
            Planes de Contratación con{" "}
            <span className="text-[#1E3A8A]">Poligrafía y Visitas</span>
          </h1>
          <p className="text-sm sm:text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed font-normal">
            Adquiera paquetes corporativos para publicar vacantes ilimitadas y solicitar estudios de confiabilidad para sus aspirantes en 1 clic desde el ATS.
          </p>
        </div>
      </section>

      {/* DYNAMIC PRICING CARDS */}
      <section className="py-16 bg-[#F8FAFC] flex-1">
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
                    className={`rounded-xl bg-white p-8 flex flex-col justify-between relative hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200 ${
                      isHighlight
                        ? "border-2 border-[#0F172A] shadow-lg"
                        : "border border-[#E2E8F0] shadow-sm hover:shadow-md"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0F172A] text-white text-[11px] font-bold rounded-full uppercase tracking-wider shadow-sm whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}

                    <div className="space-y-6">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                          {plan.credits === 0
                            ? "Plan Inicial"
                            : plan.credits >= 15
                            ? "Gran Volumen / Corporativo"
                            : "Paquete Operativo Recomendado"}
                        </span>
                        <h3 className="text-xl font-bold text-[#1E293B] mt-1">{plan.name}</h3>
                        {plan.description && (
                          <p className="text-xs text-[#64748B] mt-2 leading-relaxed">
                            {plan.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-[#1E293B] tabular-nums font-mono">
                            ${plan.price.toLocaleString("es-CO")}
                          </span>
                          <span className="text-xs text-[#64748B]">
                            COP {plan.credits === 0 ? "/ mes" : "/ paquete"}
                          </span>
                        </div>
                        {plan.credits > 0 ? (
                          <span className="text-[11px] text-[#065F46] font-semibold bg-[#ECFDF5] px-2 py-0.5 rounded">
                            ${Math.round(plan.price / plan.credits).toLocaleString("es-CO")} COP por candidato blindado ({plan.credits} créditos)
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#64748B]">Acceso gratuito para siempre</span>
                        )}
                      </div>

                      <div className="border-t border-[#E2E8F0] pt-6 space-y-3 text-xs text-[#1E293B]">
                        {featuresList.map((feat, idx) => {
                          const isExcluded = feat.startsWith("Sin ");
                          return (
                            <div
                              key={idx}
                              className={`flex items-center gap-2.5 ${
                                isExcluded ? "text-[#94A3B8]" : ""
                              }`}
                            >
                              {isExcluded ? (
                                <span className="w-4 h-4 flex items-center justify-center text-xs font-bold shrink-0">
                                  -
                                </span>
                              ) : (
                                <Check
                                  className="w-4 h-4 text-[#10B981] shrink-0"
                                  strokeWidth={1.5}
                                />
                              )}
                              <span>{feat}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-8">
                      {plan.price === 0 ? (
                        <Link
                          href="/login?tab=register&role=company"
                          className="w-full btn-secondary text-xs font-bold py-3 flex items-center justify-center shadow-xs"
                        >
                          Comenzar Gratis
                        </Link>
                      ) : (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-3 px-4 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-center"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-400" strokeWidth={1.5} />
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
