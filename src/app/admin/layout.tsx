"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  FileCheck2,
  Building2,
  GraduationCap,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Clock,
  BadgeCheck,
  Users,
  Search,
  Bell,
  Sparkles,
  ExternalLink,
  Lock,
  AlertCircle,
  Settings,
  Coins,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStudiesCount, setActiveStudiesCount] = useState(0);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [verifiedCompaniesCount, setVerifiedCompaniesCount] = useState(0);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [academiesCount, setAcademiesCount] = useState(0);
  const [adminName, setAdminName] = useState("SuperAdmin B2B");

  // Authentication & Route Protection States
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isDevOrDemo, setIsDevOrDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuthorization() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setIsAuthorized(false);
            router.replace("/login?error=unauthorized_admin");
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          if (isMounted) {
            setIsAuthorized(false);
            if (profile?.role === "company") {
              router.replace("/empresa/dashboard");
            } else if (profile?.role === "candidate") {
              router.replace("/guarda/vacantes");
            } else {
              router.replace("/login?error=unauthorized_admin");
            }
          }
          return;
        }

        if (isMounted) {
          if (profile.full_name) setAdminName(profile.full_name);
          setIsAuthorized(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthorized(false);
          router.replace("/login?error=unauthorized_admin");
        }
      }
    }

    verifyAdminAuthorization();

    // Sync metric counts from Supabase and local storage
    async function loadAdminCounts() {
      try {
        const supabase = createClient();
        const { count: studiesCount } = await supabase
          .from("security_study_orders")
          .select("*", { count: "exact", head: true });
        if (studiesCount !== null && studiesCount !== undefined) {
          setActiveStudiesCount(studiesCount);
        }

        const { count: compsCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true });
        if (compsCount !== null && compsCount !== undefined) {
          setCompaniesCount(compsCount);
        }

        const { count: verCompsCount } = await supabase
          .from("companies")
          .select("*", { count: "exact", head: true })
          .eq("is_verified_company", true);
        if (verCompsCount !== null && verCompsCount !== undefined) {
          setVerifiedCompaniesCount(verCompsCount);
        }

        const { count: candsCount } = await supabase
          .from("candidate_profiles")
          .select("*", { count: "exact", head: true });
        if (candsCount !== null && candsCount !== undefined) {
          setCandidatesCount(candsCount);
        }

        const { count: acadsCount } = await supabase
          .from("partner_academies")
          .select("*", { count: "exact", head: true });
        if (acadsCount !== null && acadsCount !== undefined) {
          setAcademiesCount(acadsCount);
        }
      } catch {}
    }

    loadAdminCounts();

    return () => {
      isMounted = false;
    };
  }, [pathname, router]);

  const navigation = [
    {
      name: "Bandeja de Estudios & Poligrafía",
      href: "/admin/estudios",
      icon: FileCheck2,
      badge: activeStudiesCount.toString(),
    },
    {
      name: "Empresas & Recarga B2B",
      href: "/admin/empresas",
      icon: Building2,
      badge: companiesCount.toString(),
    },
    {
      name: "Red de Academias Aliadas",
      href: "/admin/academias",
      icon: GraduationCap,
      badge: academiesCount.toString(),
    },
    {
      name: "Planes & Tarifas B2B",
      href: "/admin/planes",
      icon: Coins,
      badge: "Precios",
    },
    {
      name: "Configuración Comercial",
      href: "/admin/configuracion",
      icon: Settings,
      badge: "WhatsApp",
    },
  ];

  // Render unauthorized fallback while redirecting
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200/90 p-6 rounded-lg max-w-sm text-center space-y-3 shadow-card">
          <div className="w-10 h-10 rounded-md bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Acceso Restringido a SuperAdmin</h3>
          <p className="text-xs text-slate-500">
            Esta sección requiere credenciales de Super Administrador con rol oficial en la base de datos. Redirigiendo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900 font-sans antialiased">
      {/* DESKTOP FIXED SIDEBAR (260px) */}
      <aside className="hidden md:flex flex-col w-[260px] bg-slate-950 text-white border-r border-slate-900 shrink-0 sticky top-0 h-screen z-40 select-none">
        {/* Brand & Authority Badge */}
        <div className="p-5 border-b border-slate-900">
          <Link href="/admin/estudios" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 transition-colors">
              <Shield className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                FuerzaVerificada
              </div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">
                Mando Operativo & Poligrafía
              </div>
            </div>
          </Link>

          {/* Insignia SuperAdmin */}
          <div className="mt-4 px-2.5 py-1.5 rounded-md bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300 font-semibold tracking-wide uppercase">
                SuperAdmin B2B
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 tabular-nums">
              {isDevOrDemo ? "DEV / DEMO" : "v1.0-LIVE"}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
          <div className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Operaciones Centrales
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-xs border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-emerald-400" : "text-slate-400"
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                        : "bg-slate-900 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Director Profile / Bottom Card */}
        <div className="p-3.5 border-t border-slate-900 bg-slate-950/60">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
                {adminName
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "SA"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {adminName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Dirección Operativa & Poligrafía
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const supabase = createClient();
                await Promise.race([
                  supabase.auth.signOut().catch(() => {}),
                  new Promise((res) => setTimeout(res, 800)),
                ]);
                localStorage.removeItem("fv_demo_role");
                localStorage.removeItem("fv_demo_user");
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              title="Cerrar sesión"
              className="text-slate-500 hover:text-slate-300 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-slate-950 text-white px-4 h-14 border-b border-slate-900 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-3.5 h-3.5" strokeWidth={1.75} />
          </div>
          <div>
            <span className="text-xs font-semibold text-white tracking-tight">
              FuerzaVerificada
            </span>
            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono uppercase">
              SuperAdmin
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" strokeWidth={1.75} />
          ) : (
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          )}
        </button>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col">
          <div className="bg-slate-950 border-b border-slate-800 p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-white uppercase tracking-wider">
              Menú SuperAdmin
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
          <nav className="p-4 space-y-1.5 bg-slate-950 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-2.5 rounded-md text-xs font-medium ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-emerald-400" strokeWidth={1.75} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-emerald-300 font-mono tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* GLOBAL EXECUTIVE METRICS HEADER */}
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 hidden md:flex items-center">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            {/* Live KPI Tickers */}
            <div className="flex items-center gap-6 overflow-x-auto text-xs">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-emerald-50/80 border border-emerald-200/60 text-emerald-700">
                  <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                    Empresas Registradas
                  </div>
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">
                    {companiesCount} Empresas{" "}
                    <span className="text-[10px] text-emerald-700 font-medium">(B2B)</span>
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200/80" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-amber-50/80 border border-amber-200/70 text-amber-700">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                    Órdenes de Estudio
                  </div>
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">
                    {activeStudiesCount} Órdenes{" "}
                    <span className="text-[10px] text-amber-700 font-medium">(Polígrafo/Visita)</span>
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200/80" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700">
                  <BadgeCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                    Empresas Verificadas
                  </div>
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">
                    {verifiedCompaniesCount} de {companiesCount}{" "}
                    <span className="text-[10px] text-slate-500 font-normal">(SuperVigilancia)</span>
                  </div>
                </div>
              </div>

              <div className="h-5 w-px bg-slate-200/80" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700">
                  <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                    Perfiles Operativos
                  </div>
                  <div className="text-xs font-semibold text-slate-900 tabular-nums">
                    {candidatesCount} <span className="text-[10px] text-slate-500 font-normal">Base Nacional</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/empresa/dashboard"
                target="_blank"
                className="btn-secondary text-[11px] h-8 px-2.5"
                title="Abrir vista de empresa cliente"
              >
                <span>Vista Empresa</span>
                <ExternalLink className="w-3 h-3 text-slate-400" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
