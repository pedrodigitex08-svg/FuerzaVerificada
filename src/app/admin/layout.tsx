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
  const [activeStudiesCount, setActiveStudiesCount] = useState(5);
  const [companiesCount, setCompaniesCount] = useState(5);

  // Authentication & Route Protection States
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isDevOrDemo, setIsDevOrDemo] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyAdminAuthorization() {
      // 1. Check if running in development / localhost mode
      const isLocalhost =
        typeof window !== "undefined" &&
        (window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          process.env.NODE_ENV === "development");

      // In local development, grant quick access for testing
      if (isLocalhost) {
        if (isMounted) {
          setIsDevOrDemo(true);
          setIsAuthorized(true);
        }
        return;
      }

      // 2. Production mode: Strictly verify real session & role in public.profiles
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          if (isMounted) {
            setIsAuthorized(false);
            router.push("/login?error=unauthorized_admin");
          }
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || !profile || profile.role !== "admin") {
          if (isMounted) {
            setIsAuthorized(false);
            if (profile?.role === "company") {
              router.push("/empresa/dashboard");
            } else if (profile?.role === "candidate") {
              router.push("/guarda/vacantes");
            } else {
              router.push("/login?error=unauthorized_admin");
            }
          }
          return;
        }

        if (isMounted) {
          setIsAuthorized(true);
        }
      } catch {
        if (isMounted) {
          setIsAuthorized(false);
          router.push("/login?error=unauthorized_admin");
        }
      }
    }

    verifyAdminAuthorization();

    // Sync metric counts from storage
    if (typeof window !== "undefined") {
      const storedOrders = localStorage.getItem("fv_security_orders");
      if (storedOrders) {
        try {
          const parsed = JSON.parse(storedOrders);
          setActiveStudiesCount(parsed.length);
        } catch {}
      }

      const storedCompanies = localStorage.getItem("fv_companies");
      if (storedCompanies) {
        try {
          const parsed = JSON.parse(storedCompanies);
          setCompaniesCount(parsed.length);
        } catch {}
      }
    }

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
      badge: "5",
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
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl max-w-sm text-center space-y-3 shadow-md">
          <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-bold text-[#1E293B]">Acceso Restringido a SuperAdmin</h3>
          <p className="text-xs text-[#64748B]">
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
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <Shield className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                FuerzaVerificada
              </div>
              <div className="text-[10px] text-amber-400 font-medium tracking-wide">
                Mando Operativo & Poligrafía
              </div>
            </div>
          </Link>

          {/* Insignia SuperAdmin */}
          <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-300 font-semibold tracking-wide uppercase">
                SuperAdmin B2B
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {isDevOrDemo ? "DEV / DEMO" : "v1.0-LIVE"}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <div className="px-2.5 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Operaciones Centrales
          </div>

          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-white font-semibold shadow-sm border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] tabular-nums font-mono px-1.5 py-0.5 rounded ${
                      isActive
                        ? "bg-amber-400/20 text-amber-300 font-bold"
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
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                RB
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  Dr. Ricardo Beltrán
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  Director de Poligrafía
                </p>
              </div>
            </div>
            <Link
              href="/login"
              title="Cerrar sesión"
              className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
            </Link>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-slate-950 text-white px-4 py-3.5 border-b border-slate-900 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-3.5 h-3.5" strokeWidth={2} />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-tight">
              FuerzaVerificada
            </span>
            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono uppercase">
              SuperAdmin
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
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
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Menú SuperAdmin
            </span>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>
          <nav className="p-4 space-y-2 bg-slate-950 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between p-3 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
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
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 py-3 hidden md:block">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            {/* Live KPI Tickers */}
            <div className="flex items-center gap-6 overflow-x-auto text-xs py-0.5">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">
                    Facturación / Paquetes B2B
                  </div>
                  <div className="text-xs font-bold text-slate-900 tabular-nums">
                    $18.450.000 COP{" "}
                    <span className="text-[10px] text-emerald-600 font-semibold">(12 activos)</span>
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-amber-50 border border-amber-200 text-amber-600">
                  <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">
                    Dictámenes Para Hoy
                  </div>
                  <div className="text-xs font-bold text-slate-900 tabular-nums">
                    3 Prioritarios{" "}
                    <span className="text-[10px] text-amber-600 font-semibold">(Polígrafo/Visita)</span>
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-blue-50 border border-blue-200 text-blue-600">
                  <BadgeCheck className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">
                    Empresas Verificadas
                  </div>
                  <div className="text-xs font-bold text-slate-900 tabular-nums">
                    8 de 10{" "}
                    <span className="text-[10px] text-slate-600 font-normal">(SuperVigilancia)</span>
                  </div>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-200" />

              <div className="flex items-center gap-2 shrink-0">
                <div className="p-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700">
                  <Users className="w-3.5 h-3.5" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[10px] text-slate-600 uppercase font-semibold">
                    Guardas Registrados
                  </div>
                  <div className="text-xs font-bold text-slate-900 tabular-nums">
                    1.428 <span className="text-[10px] text-slate-600 font-normal">Base Nacional</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                href="/empresa/dashboard"
                target="_blank"
                className="btn-secondary text-[11px] py-1.5 px-2.5"
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
