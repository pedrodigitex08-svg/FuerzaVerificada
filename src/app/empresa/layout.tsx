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
      label: "Radar de Personal Verificado",
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
    <div className="min-h-screen bg-[#F2F5F8] text-[#313944] flex">
      {/* DESKTOP FIXED SIDEBAR ESTILO COMPUTRABAJO EMPRESAS (260px) */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-[#E1E4E9] bg-white shrink-0 sticky top-0 h-screen z-30 select-none shadow-[1px_0_3px_rgba(11,59,112,0.03)]">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-[#E1E4E9] flex items-center justify-between">
          <Link href="/empresa/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#0B3B70] flex items-center justify-center text-white shadow-2xs group-hover:bg-[#082B54] transition-colors">
              <Shield className="w-4 h-4 text-[#FFE066]" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-[#0B3B70] tracking-tight leading-none">
                Fuerza<span className="text-[#005DA4]">Verificada</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">
                Portal Empresas
              </span>
            </div>
          </Link>
        </div>

        {/* Company Active Profile Badge */}
        <div className="p-3.5 border-b border-[#E1E4E9] bg-[#F2F5F8]/60">
          <div className="p-3 rounded-2xl bg-white border border-[#E1E4E9] shadow-2xs space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EAF3FA] text-[#0B3B70] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D5E6F5]">
                <Building2 className="w-4 h-4 text-[#005DA4]" />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {companyName}
                </h4>
                <p className="text-[10px] text-slate-500 font-mono tabular-nums truncate">{companyNit}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">SuperVigilancia:</span>
              {isVerifiedCompany ? (
                <span className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                  <CheckCircle className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                  Verificada
                </span>
              ) : (
                <span className="text-amber-800 font-semibold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Pendiente NIT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Módulos ATS & Selección
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#0B3B70] text-white shadow-xs"
                    : "text-slate-700 hover:text-[#0B3B70] hover:bg-[#EAF3FA]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" strokeWidth={isActive ? 2 : 1.75} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#FFE066]" />}
              </Link>
            );
          })}
        </div>

        {/* B2B Credits & WhatsApp Recharge Card */}
        <div className="p-3.5 border-t border-[#E1E4E9] bg-[#F2F5F8]/60">
          <div className="p-3.5 rounded-2xl bg-white border border-[#D5E6F5] shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800">
                Créditos Poligrafía
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3FA] text-[#0B3B70] border border-[#D5E6F5] uppercase">
                {planName}
              </span>
            </div>

            <div className="bg-[#EAF3FA]/60 p-2.5 rounded-xl border border-[#D5E6F5] flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block font-medium">Disponibles</span>
                <span className="text-base font-bold font-mono text-[#0B3B70] tabular-nums">
                  {credits} créditos
                </span>
              </div>
            </div>

            <a
              href={whatsappRechargeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 rounded-full text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs text-center"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Recargar Paquete B2B</span>
            </a>
          </div>

          {/* Quick exit */}
          <div className="mt-2.5 pt-2 border-t border-[#E1E4E9] flex items-center justify-between px-2 text-xs">
            <span className="text-[11px] text-slate-500">Sesión activa</span>
            <button
              onClick={async () => {
                await signOut();
              }}
              className="text-slate-600 hover:text-rose-600 text-xs flex items-center gap-1 transition-colors font-semibold"
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
        <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-[#E1E4E9] px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-[0_1px_3px_rgba(11,59,112,0.03)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="md:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0B3B70] flex items-center justify-center text-white">
                <Shield className="w-4 h-4 text-[#FFE066]" strokeWidth={2} />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#0B3B70]">
                FuerzaVerificada
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2.5 text-xs">
              <span className="text-slate-500 font-medium">Empresa:</span>
              <strong className="text-slate-900 font-bold">{companyName}</strong>
              <span className="text-slate-300">•</span>
              {isVerifiedCompany ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} />
                  Sello SuperVigilancia Activo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" strokeWidth={2} />
                  Validación NIT en Curso
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/empresa/vacantes/nueva"
              className="h-9 bg-[#0B3B70] hover:bg-[#082B54] text-white rounded-full px-4 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
              <span>Publicar Vacante</span>
            </Link>

            <Link
              href="/"
              className="text-xs text-slate-600 hover:text-[#0B3B70] font-semibold flex items-center gap-1"
            >
              <span>Ver Portal</span>
              <ExternalLink className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E1E4E9] p-4 space-y-1.5 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-3 rounded-full text-xs font-semibold ${
                  pathname === item.href
                    ? "bg-[#0B3B70] text-white"
                    : "text-slate-700 hover:bg-[#EAF3FA]"
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
