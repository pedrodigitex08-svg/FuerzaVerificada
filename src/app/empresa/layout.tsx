"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle,
  Clock,
  MessageCircle,
  Building2,
} from "lucide-react";
import { Navbar } from "@/components/public/Navbar";
import { generatePackageRechargeLink } from "@/lib/utils/whatsappTemplates";
import { useAuth } from "@/lib/supabase/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading, fullName } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [credits, setCredits] = useState(0);
  const [companyName, setCompanyName] = useState("Empresa de Seguridad");
  const [companyNit, setCompanyNit] = useState("En validación");
  const [planName, setPlanName] = useState("Plan Corporativo");
  const [isVerifiedCompany, setIsVerifiedCompany] = useState(false);

  // 1. Route Authorization Guard
  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      setIsAuthorized(false);
      router.replace(`/login?error=unauthorized_company&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (role === "candidate") {
      setIsAuthorized(false);
      router.replace("/guarda/vacantes");
      return;
    }

    setIsAuthorized(true);
  }, [isAuthenticated, role, isLoading, pathname, router]);

  // 2. Company Metadata Sync from Supabase
  useEffect(() => {
    async function loadCompanyMetadata() {
      if (fullName) {
        setCompanyName(fullName);
      }

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let { data: comp } = await supabase
            .from("companies")
            .select("*")
            .eq("owner_id", user.id)
            .maybeSingle();

          // Si el usuario tiene rol 'company' pero su registro en public.companies aún no existe, crearlo automáticamente
          if (!comp && role === "company") {
            const { data: prof } = await supabase
              .from("profiles")
              .select("full_name, phone_whatsapp")
              .eq("id", user.id)
              .maybeSingle();

            const meta = user.user_metadata || {};
            const resolvedCompName =
              meta.company_name || prof?.full_name || fullName || user.email?.split("@")[0] || "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: resolvedCompName,
                nit: meta.nit || "",
                city: meta.city || "Bogotá D.C.",
                contact_person: prof?.full_name || meta.full_name || "Contacto Principal",
                contact_phone: prof?.phone_whatsapp || meta.phone_whatsapp || "",
                is_verified_company: false,
                plan_name: "basico",
                credits_security_studies: 0,
              })
              .select("*")
              .maybeSingle();

            if (createdComp) {
              comp = createdComp;
            }
          }

          if (comp) {
            const validName = comp.company_name?.trim() || fullName || user.email?.split("@")[0] || "Empresa Registrada";
            setCompanyName(validName);

            const hasRealNit = comp.nit && !comp.nit.startsWith("NIT-") && comp.nit.trim().length > 0;
            if (hasRealNit) {
              setCompanyNit(`NIT ${comp.nit.trim()}`);
            } else {
              setCompanyNit("NIT pendiente de registrar");
            }
            setIsVerifiedCompany(Boolean(comp.is_verified_company));
            setCredits(Number(comp.credits_security_studies ?? 0));
            if (comp.plan_name) setPlanName(comp.plan_name.replace(/_/g, " "));

            if (typeof window !== "undefined") {
              localStorage.setItem(
                "fv_company_credits",
                String(comp.credits_security_studies ?? 0)
              );
              localStorage.setItem(
                "fv_company_verified",
                String(Boolean(comp.is_verified_company))
              );
            }
            return;
          }
        }
      } catch {}

      if (typeof window !== "undefined") {
        const savedCredits = localStorage.getItem("fv_company_credits");
        if (savedCredits !== null) {
          setCredits(parseInt(savedCredits, 10) || 0);
        }

        const savedVerified = localStorage.getItem("fv_company_verified");
        if (savedVerified !== null) {
          setIsVerifiedCompany(savedVerified === "true");
        }
      }
    }

    loadCompanyMetadata();
  }, [pathname, fullName, role]);

  const whatsappRechargeLink = generatePackageRechargeLink({
    companyName,
    packageType: "Recarga de Paquete B2B (Estudios + Poligrafía)",
  });

  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#F2F5F8] flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-[#0B3B70] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-700">
            Verificando autorización empresarial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F5F8] text-[#313944] flex flex-col">
      {/* 1. Global Navbar Computrabajo Style */}
      <Navbar />

      {/* 2. Sub-barra Corporativa B2B (Créditos de Poligrafía y Estado SuperVigilancia) */}
      <div className="bg-white border-b border-[#E1E4E9] shadow-2xs py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500 font-medium">Portal Empresas:</span>
              <strong className="text-slate-900 font-bold">{companyName}</strong>
            </div>
            <span className="text-slate-300 hidden sm:inline">•</span>
            {isVerifiedCompany ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                Sello SuperVigilancia Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Validación NIT en Curso
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Shield className="w-4 h-4 text-[#005DA4]" />
              <span>Créditos Poligrafía:</span>
              <strong className="font-mono text-[#0B3B70] font-bold tabular-nums">
                {credits} disp.
              </strong>
            </div>

            <a
              href={whatsappRechargeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3.5 py-1 text-[11px] inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Recargar Paquete</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Área de Contenido Principal a Ancho Completo */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
