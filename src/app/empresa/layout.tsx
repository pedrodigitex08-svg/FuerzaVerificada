"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export default function EmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState(5);
  const [companyName, setCompanyName] = useState("Seguridad Atlas de Colombia");
  const [planName, setPlanName] = useState("Contratación Segura x5");
  const [isVerifiedCompany, setIsVerifiedCompany] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCredits = localStorage.getItem("fv_company_credits");
      if (savedCredits !== null) {
        setCredits(parseInt(savedCredits, 10));
      } else {
        localStorage.setItem("fv_company_credits", "5");
      }

      const savedVerified = localStorage.getItem("fv_company_verified");
      if (savedVerified !== null) {
        setIsVerifiedCompany(savedVerified === "true");
      }

      const savedUser = localStorage.getItem("fv_demo_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.full_name) setCompanyName(parsed.full_name);
        } catch {}
      }
    }
  }, [pathname]);

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
      label: "Radar de Relevos Hoy",
      href: "/empresa/relevos",
      icon: Zap,
    },
    {
      label: "Estudios & Poligrafía",
      href: "/empresa/estudios",
      icon: FileCheck,
    },
  ];

  const whatsappRechargeLink = generatePackageRechargeLink({
    companyName,
    packageType: "Recarga de Paquete B2B (Estudios + Poligrafía)",
  });

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
                Panel B2B Empresa
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            Gestión Operativa
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === "/empresa/vacantes" &&
                pathname.startsWith("/empresa/vacantes") &&
                pathname !== "/empresa/vacantes/nueva");
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

        {/* TARJETA EJECUTIVA DE CRÉDITOS B2B */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="rounded-xl bg-[#0F172A] text-white p-4 space-y-3 shadow-md border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Paquete B2B
              </span>
              {isVerifiedCompany ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#065F46] bg-[#ECFDF5] px-1.5 py-0.2 rounded border border-[#10B981]/30">
                  <CheckCircle className="w-3 h-3 text-[#10B981]" strokeWidth={1.5} />
                  Verificada
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/40">
                  <Clock className="w-3 h-3 text-amber-400" strokeWidth={1.5} />
                  En Validación
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white leading-tight">{planName}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 truncate">{companyName}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  Créditos Poligrafía + Visita:
                </span>
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
            <Link
              href="/login"
              className="text-[#64748B] hover:text-rose-600 text-xs flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Salir
            </Link>
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
