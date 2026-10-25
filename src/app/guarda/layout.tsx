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
  GraduationCap,
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
      label: "Mis Cursos y Documentos",
      href: "/guarda/documentos",
      icon: FileCheck,
    },
    {
      label: "Academias Aliadas",
      href: "/guarda/documentos#academias",
      icon: GraduationCap,
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
      <aside className="hidden md:flex flex-col w-60 border-r border-slate-200/80 bg-white shrink-0 sticky top-0 h-screen z-30 select-none">
        {/* Brand */}
        <div className="h-14 px-5 border-b border-slate-200/80 flex items-center justify-between">
          <Link href={isCompany ? "/empresa/dashboard" : "/guarda/vacantes"} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition-colors">
              <Shield className="w-4 h-4 text-white" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-900 tracking-tight leading-none">
                Fuerza<span className="text-slate-900">Verificada</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mt-0.5">
                {isCompany ? "Portal Empresas B2B" : "Portal Operativo"}
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1 flex-1 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {isCompany ? "Módulos de Empresa" : "Navegación Operativa"}
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </Link>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-slate-200/80 bg-slate-50/70">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200/90 shadow-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-md bg-slate-900 text-white font-semibold text-xs flex items-center justify-center shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {displayName}
                </div>
                <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isAuthenticated ? "bg-emerald-500" : "bg-slate-400"}`} />
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
                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            ) : (
              <Link
                href="/login"
                className="p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
                title="Iniciar sesión"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-900"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Mobile brand (hidden in desktop) */}
            <div className="md:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center text-white">
                <Shield className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <span className="text-xs font-semibold text-slate-900 tracking-tight">
                FuerzaVerificada
              </span>
            </div>

            {/* Desktop breadcrumb */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span>{isCompany ? "Portal Empresas" : "Portal Operativo"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-900 font-semibold">
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
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-md h-9 px-3.5 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Publicar Vacante</span>
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200/60 text-[11px] font-medium text-emerald-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.75} />
                <span>Garantía Cero Cobros al Candidato</span>
              </div>
            )}

            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-slate-900 font-medium flex items-center gap-1 transition-colors"
            >
              <span>Ver Landing</span>
              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
            </Link>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200/80 p-3 space-y-1.5 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-md text-xs font-medium ${
                  pathname === item.href
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
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
