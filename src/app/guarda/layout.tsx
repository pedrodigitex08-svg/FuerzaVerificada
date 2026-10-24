"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Shield,
  Briefcase,
  Send,
  FileCheck,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  ExternalLink,
  CheckCircle,
  ChevronRight,
  LayoutDashboard,
  PlusCircle,
  Zap,
  Building2,
  Lock,
} from "lucide-react";
import { BottomNav } from "@/components/guarda/BottomNav";
import { useAuth } from "@/lib/supabase/useAuth";

export default function GuardaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, isAuthenticated, isLoading, fullName, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authorization Guard for internal candidate routes
  useEffect(() => {
    if (isLoading) return;

    const isPublicJobFeed = pathname === "/guarda/vacantes";

    // Non-public candidate routes require active authentication
    if (!isPublicJobFeed && !isAuthenticated) {
      router.push(`/login?error=unauthorized_candidate&redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Company accounts attempting to enter private candidate CV/Applications are redirected to ATS
    if (!isPublicJobFeed && role === "company") {
      router.replace("/empresa/dashboard");
      return;
    }

    if (!isPublicJobFeed && role === "admin") {
      router.replace("/admin/estudios");
      return;
    }
  }, [isAuthenticated, role, isLoading, pathname, router]);

  const isCompany = role === "company";

  const companyNavItems = [
    {
      label: "Panel de Empresa",
      href: "/empresa/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Publicar Vacante",
      href: "/empresa/vacantes/nueva",
      icon: PlusCircle,
    },
    {
      label: "Mis Vacantes & ATS",
      href: "/empresa/vacantes",
      icon: Briefcase,
    },
    {
      label: "Personal Verificado",
      href: "/empresa/relevos",
      icon: Zap,
    },
    {
      label: "Estudios & Poligrafía",
      href: "/empresa/estudios",
      icon: FileCheck,
    },
    {
      label: "Planes Empresas",
      href: "/precios-empresas",
      icon: Shield,
    },
    {
      label: "Buscador de Vacantes",
      href: "/guarda/vacantes",
      icon: Briefcase,
    },
  ];

  const candidateNavItems = [
    {
      label: "Buscador de Vacantes",
      href: "/guarda/vacantes",
      icon: Briefcase,
    },
    {
      label: "Mis Postulaciones",
      href: "/guarda/postulaciones",
      icon: Send,
    },
    {
      label: "Curso SuperVigilancia",
      href: "/guarda/documentos",
      icon: FileCheck,
    },
    {
      label: "Mi Hoja de Vida & CV",
      href: "/guarda/perfil",
      icon: User,
    },
  ];

  const navItems = isCompany ? companyNavItems : candidateNavItems;

  const displayName =
    fullName ||
    (isCompany
      ? "Empresa de Seguridad"
      : isAuthenticated
      ? "Personal Operativo"
      : "Visitante");
  const initials =
    displayName
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || (isCompany ? "ES" : "PO");

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex">
      {/* DESKTOP SIDEBAR (240px FIXED) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-[#E2E8F0] bg-white shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Brand */}
        <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <Link href={isCompany ? "/empresa/dashboard" : "/guarda/vacantes"} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-sm group-hover:bg-[#1E3A8A] transition-colors">
              <Shield className="w-4 h-4 text-white" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-[#1E293B] tracking-tight leading-none">
                Fuerza<span className="text-[#0F172A]">Verificada</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-semibold mt-0.5">
                {isCompany ? "Portal Empresas B2B" : "Portal Operativo"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            {isCompany ? "Módulos de Empresa" : "Navegación Operativa"}
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[#0F172A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-[#1E293B] truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-[#065F46] font-semibold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? "bg-[#10B981]" : "bg-slate-400"}`} />
                  {isCompany
                    ? "Cuenta Corporativa"
                    : isAuthenticated
                    ? "Perfil Operativo"
                    : "Acceso Público"}
                </div>
              </div>
            </div>
            {isAuthenticated ? (
              <button
                onClick={async () => {
                  await signOut();
                }}
                className="p-1.5 text-[#64748B] hover:text-rose-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            ) : (
              <Link
                href="/login"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] transition-colors"
                title="Iniciar sesión"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-[#64748B] hover:text-[#1E293B]"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile brand (hidden in desktop) */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#0F172A] flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-bold text-[#1E293B]">
                FuerzaVerificada
              </span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs text-[#64748B]">
              <span>{isCompany ? "Portal Empresas" : "Portal Operativo"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              <span className="text-[#1E293B] font-semibold">
                {isCompany
                  ? "Bolsa de Vacantes (Vista de Mercado)"
                  : pathname.includes("/vacantes")
                  ? "Buscador de Vacantes"
                  : pathname.includes("/postulaciones")
                  ? "Seguimiento de Postulaciones"
                  : pathname.includes("/documentos")
                  ? "Credencial & Curso SuperVigilancia"
                  : pathname.includes("/perfil")
                  ? "Hoja de Vida Estructurada"
                  : "Onboarding"}
              </span>
            </div>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            {isCompany ? (
              <Link
                href="/empresa/vacantes/nueva"
                className="bg-[#0F172A] hover:bg-[#1E3A8A] text-white rounded-xl py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Publicar Vacante</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#10B981]/30 text-[11px] font-semibold text-[#065F46]">
                <CheckCircle className="w-3.5 h-3.5 text-[#10B981]" strokeWidth={1.5} />
                <span>Garantía Cero Cobros al Candidato</span>
              </div>
            )}

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation (Visible only on < 768px) */}
        <BottomNav />
      </div>
    </div>
  );
}
