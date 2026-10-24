"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Shield,
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Zap,
  FileCheck,
  Bell,
  Menu,
  X,
  LogOut,
  Building2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";
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
  const { role, isAuthenticated, isLoading, signOut, fullName } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
              meta.company_name || prof?.full_name || fullName || "Empresa de Seguridad";

            const { data: createdComp } = await supabase
              .from("companies")
              .insert({
                owner_id: user.id,
                company_name: resolvedCompName,
                nit: meta.nit || `NIT-${user.id.slice(0, 8)}`,
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
            if (comp.company_name) setCompanyName(comp.company_name);
            if (comp.nit) setCompanyNit(`NIT ${comp.nit}`);
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

  const navItems = [
    {
      label: "Resumen Operativo",
      href: "/empresa/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Mis Vacantes & ATS",
      href: "/empresa/vacantes",
      icon: Briefcase,
    },
    {
      label: "Publicar Vacante",
      href: "/empresa/vacantes/nueva",
      icon: PlusCircle,
    },
    {
      label: "Directorio de Personal Verificado",
      href: "/empresa/relevos",
      icon: Zap,
    },
    {
      label: "Estudios & Poligrafía",
      href: "/empresa/estudios",
      icon: FileCheck,
    },
    {
      label: "Planes Corporativos B2B",
      href: "/precios-empresas",
      icon: Shield,
    },
  ];

  const whatsappRechargeLink = generatePackageRechargeLink({
    companyName,
    packageType: "Recarga de Paquete B2B (Estudios + Poligrafía)",
  });

  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-8 h-8 border-2 border-[#0F172A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-[#64748B]">
            Verificando autorización empresarial...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex">
      {/* DESKTOP FIXED SIDEBAR (260px) */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-[#E2E8F0] bg-white shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link href="/empresa/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E3A8A] transition-colors">
              <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1E293B] tracking-tight leading-none">
                Fuerza<span className="text-[#0F172A]">Verificada</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold mt-0.5">
                Panel B2B • Empresas
              </span>
            </div>
          </Link>
        </div>

        {/* Company Active Profile Badge */}
        <div className="p-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-[#1E293B] truncate">
                  {companyName}
                </h4>
                <p className="text-[10px] text-[#64748B] truncate">{companyNit}</p>
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px]">
              <span className="text-[#64748B] font-medium">Estado:</span>
              {isVerifiedCompany ? (
                <span className="text-[#065F46] font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#10B981]" strokeWidth={2} />
                  Verificada
                </span>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Pendiente NIT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Módulos Principales
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/empresa/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0F172A] text-white shadow-sm"
                    : "text-[#64748B] hover:text-[#1E293B] hover:bg-[#F8FAFC]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" strokeWidth={1.5} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
              </Link>
            );
          })}
        </div>

        {/* B2B Credits & WhatsApp Recharge Card */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1E293B]">
                Créditos de Poligrafía
              </span>
              <span className="badge-emerald text-[10px] py-0.5 px-2">
                {planName}
              </span>
            </div>

            <div className="bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#64748B] block">Disponibilidad</span>
                <span className="text-lg font-bold font-mono text-[#10B981] tabular-nums">
                  {credits} disponibles
                </span>
              </div>
            </div>

            <a
              href={whatsappRechargeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm text-center"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Recargar Paquete B2B</span>
            </a>
          </div>

          {/* Quick exit */}
          <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex items-center justify-between px-1 text-xs">
            <span className="text-[11px] text-[#64748B]">Sesión activa</span>
            <button
              onClick={async () => {
                await signOut();
              }}
              className="text-[#64748B] hover:text-rose-600 text-xs flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Salir
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Executive Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-[#64748B] hover:text-[#1E293B]"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0F172A] flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-bold text-[#1E293B]">
                FuerzaVerificada
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="text-[#64748B]">Empresa:</span>
              <strong className="text-[#1E293B] font-bold">{companyName}</strong>
              <span className="text-[#94A3B8]">•</span>
              {isVerifiedCompany ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#065F46] bg-[#ECFDF5] border border-[#10B981]/30 px-2 py-0.5 rounded-md">
                  <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                  Sello SuperVigilancia Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-amber-600" strokeWidth={1.5} />
                  Validación NIT en Curso
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/empresa/vacantes/nueva"
              className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Publicar Vacante</span>
            </Link>

            <Link
              href="/"
              className="text-xs text-[#64748B] hover:text-[#0F172A] font-semibold flex items-center gap-1"
            >
              <span>Ver Landing</span>
              <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] p-4 space-y-2 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold ${
                  pathname === item.href
                    ? "bg-[#0F172A] text-white"
                    : "text-[#64748B] hover:bg-[#F8FAFC]"
                }`}
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
